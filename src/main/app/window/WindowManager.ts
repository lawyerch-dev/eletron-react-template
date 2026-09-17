import { BrowserWindow, shell } from 'electron'
import log from 'electron-log/main'
import { getWindowState, saveWindowState, WINDOW_MIN_SIZE } from '../../services/window-state'
import { getIndexHtmlPath, getPreloadPath, VITE_DEV_SERVER_URL } from './paths-bridge'
import { getWindowTypeConfig, type WindowType } from './windowRegistry'

export interface OpenWindowOptions {
  /** hash 路由，如 `/settings`（主窗通常省略） */
  hash?: string
  /** 窗口标题覆盖 */
  title?: string
  /** 额外 webPreferences */
  nodeIntegration?: boolean
}

interface ManagedWindow {
  type: WindowType
  win: BrowserWindow
}

/**
 * 业务只应调用 open / close，禁止直接 new BrowserWindow。
 */
class WindowManager {
  private readonly byId = new Map<number, ManagedWindow>()

  /** 打开窗口；singleton 类型若已存在则聚焦并返回既有实例。 */
  async open(type: WindowType, options: OpenWindowOptions = {}): Promise<BrowserWindow> {
    const config = getWindowTypeConfig(type)

    if (config.mode === 'singleton') {
      const existing = this.findSingleton(type)
      if (existing && !existing.isDestroyed()) {
        if (existing.isMinimized()) existing.restore()
        existing.focus()
        return existing
      }
    }

    const win = this.createBrowserWindow(type, options)
    this.byId.set(win.id, { type, win })

    win.on('closed', () => {
      this.byId.delete(win.id)
    })

    if (config.persistBounds) {
      win.on('close', () => {
        if (!win.isDestroyed()) saveWindowState(win)
      })
    }

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        void shell.openExternal(url)
      }
      return { action: 'deny' }
    })

    await this.loadContent(win, options.hash)
    log.info(`[WindowManager] opened ${type}#${win.id}`, options.hash ?? '')
    return win
  }

  /** 聚焦 singleton；不存在则 open。主窗专用。 */
  async openMain(): Promise<BrowserWindow> {
    return this.open('main')
  }

  /** 聚焦主窗（second-instance / activate）。 */
  focusMain(): void {
    const main = this.findSingleton('main')
    if (main && !main.isDestroyed()) {
      if (main.isMinimized()) main.restore()
      main.focus()
    }
  }

  getMainWindow(): BrowserWindow | undefined {
    return this.findSingleton('main')
  }

  list(type?: WindowType): BrowserWindow[] {
    const all = [...this.byId.values()].filter((e) => !e.win.isDestroyed()).map((e) => e.win)
    if (!type) return all
    return [...this.byId.values()]
      .filter((e) => e.type === type && !e.win.isDestroyed())
      .map((e) => e.win)
  }

  /** 关闭指定类型的所有窗口（singleton/main 不主动调）。 */
  closeAll(type: WindowType): void {
    for (const entry of [...this.byId.values()]) {
      if (entry.type === type && !entry.win.isDestroyed()) {
        entry.win.close()
      }
    }
  }

  private findSingleton(type: WindowType): BrowserWindow | undefined {
    for (const entry of this.byId.values()) {
      if (entry.type === type && !entry.win.isDestroyed()) {
        return entry.win
      }
    }
    return undefined
  }

  private createBrowserWindow(type: WindowType, options: OpenWindowOptions): BrowserWindow {
    const config = getWindowTypeConfig(type)
    const publicDir = process.env.VITE_PUBLIC
    const useSaved = config.persistBounds
    const state = useSaved ? getWindowState() : null

    const width = state?.width ?? config.defaultSize?.width ?? 900
    const height = state?.height ?? config.defaultSize?.height ?? 700
    const minWidth = config.minWidth ?? WINDOW_MIN_SIZE.width
    const minHeight = config.minHeight ?? WINDOW_MIN_SIZE.height

    const win = new BrowserWindow({
      title: options.title ?? config.title ?? type,
      ...(publicDir && type === 'main' ? { icon: `${publicDir}/favicon.ico` } : {}),
      width,
      height,
      ...(state?.x !== undefined ? { x: state.x } : {}),
      ...(state?.y !== undefined ? { y: state.y } : {}),
      minWidth,
      minHeight,
      ...config.browserOptions,
      webPreferences: {
        preload: getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: options.nodeIntegration ?? false,
        sandbox: false,
        ...config.browserOptions?.webPreferences,
      },
    })

    if (state?.isMaximized) {
      win.maximize()
    }

    return win
  }

  private async loadContent(win: BrowserWindow, hash?: string): Promise<void> {
    if (VITE_DEV_SERVER_URL) {
      const url = hash
        ? `${VITE_DEV_SERVER_URL}#${hash.startsWith('/') ? hash : `/${hash}`}`
        : VITE_DEV_SERVER_URL
      await win.loadURL(url)
      win.webContents.openDevTools({ mode: 'detach' })
    } else {
      await win.loadFile(getIndexHtmlPath(), hash ? { hash } : undefined)
    }
  }
}

export const windowManager = new WindowManager()
