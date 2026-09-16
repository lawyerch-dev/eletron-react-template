import { ipcMain, BrowserWindow } from 'electron'

/** 插件允许调用的 BrowserWindow 安全方法白名单 */
const ALLOWED_WINDOW_METHODS = new Set([
  'close',
  'focus',
  'blur',
  'show',
  'hide',
  'maximize',
  'unmaximize',
  'minimize',
  'restore',
  'setTitle',
  'getSize',
  'setSize',
  'getPosition',
  'setPosition',
  'getBounds',
  'setBounds',
  'isMinimized',
  'isMaximized',
  'isVisible',
  'isFocused',
  'center',
  'setAlwaysOnTop',
  'loadURL',
  'reload',
])

function isSafeWindowUrl(raw: unknown): boolean {
  if (typeof raw !== 'string' || !raw) return false
  try {
    const parsed = new URL(raw)
    return ['http:', 'https:', 'file:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * 窗口管理API - 插件专用
 */
export class PluginWindowAPI {
  private createdWindows = new Map<number, BrowserWindow>()

  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.on(
      'createBrowserWindow',
      (event, args: { url: string; options?: Electron.BrowserWindowConstructorOptions }) => {
        const { url, options } = args || {}
        if (!url || typeof url !== 'string') {
          event.returnValue = null
          return
        }
        // 仅允许 http(s)/file 加载，拒绝 javascript: 等危险协议
        try {
          const parsed = new URL(url)
          if (!['http:', 'https:', 'file:'].includes(parsed.protocol)) {
            event.returnValue = null
            return
          }
        } catch {
          event.returnValue = null
          return
        }
        // 强制安全 webPreferences：忽略插件传入的危险覆盖（nodeIntegration 等）
        const win = new BrowserWindow({
          width: options?.width || 800,
          height: options?.height || 600,
          backgroundColor: '#ffffff',
          ...(typeof options?.x === 'number' ? { x: options.x } : {}),
          ...(typeof options?.y === 'number' ? { y: options.y } : {}),
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
          },
        })
        const winId = win.webContents.id
        this.createdWindows.set(winId, win)
        win.on('closed', () => this.createdWindows.delete(winId))
        win.loadURL(url)
        // 返回 Proxy 对象，支持 method/invoke 调用
        event.returnValue = {
          id: winId,
          webContents: { id: winId },
          window: win,
        }
      },
    )

    // 同步方法调用（如 win.close(), win.focus() 等）
    ipcMain.on(
      'pluginBrowserWindowMethod',
      (event, args: { id: number; method: string; args?: unknown[] }) => {
        const { id, method, args: methodArgs = [] } = args || {}
        const win = this.createdWindows.get(id)
        if (!win) {
          event.returnValue = { success: false, error: '窗口不存在' }
          return
        }
        if (typeof method !== 'string' || !ALLOWED_WINDOW_METHODS.has(method)) {
          event.returnValue = { success: false, error: '方法不允许' }
          return
        }
        if (method === 'loadURL' && !isSafeWindowUrl(methodArgs[0])) {
          event.returnValue = { success: false, error: 'URL 不允许' }
          return
        }
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (win as any)[method](...methodArgs)
          event.returnValue = { success: true, result }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          event.returnValue = { success: false, error: e.message }
        }
      },
    )

    // 异步方法调用（如 win.loadURL() 等）
    ipcMain.handle(
      'pluginBrowserWindowInvoke',
      async (_event, args: { id: number; method: string; args?: unknown[] }) => {
        const { id, method, args: methodArgs = [] } = args || {}
        const win = this.createdWindows.get(id)
        if (!win) return { success: false, error: '窗口不存在' }
        if (typeof method !== 'string' || !ALLOWED_WINDOW_METHODS.has(method)) {
          return { success: false, error: '方法不允许' }
        }
        if (method === 'loadURL' && !isSafeWindowUrl(methodArgs[0])) {
          return { success: false, error: 'URL 不允许' }
        }
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (win as any)[method](...methodArgs)
          return { success: true, result }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          return { success: false, error: e.message }
        }
      },
    )

    // 子窗口 → 父窗口通信
    ipcMain.on('send-to-parent', (event, channel: string, ...args: unknown[]) => {
      const parentWin = BrowserWindow.fromWebContents(event.sender)
      if (parentWin) {
        parentWin.webContents.send(channel, ...args)
      }
    })

    ipcMain.handle('show-main-window', async () => false)
    ipcMain.handle('hide-main-window', async () => false)

    ipcMain.on(
      'ipc-send-to',
      (event, webContentsId: number, channel: string, ...args: unknown[]) => {
        for (const w of BrowserWindow.getAllWindows()) {
          if (!w.isDestroyed() && w.webContents.id === webContentsId) {
            w.webContents.send('__ipc_sendto_relay__', {
              senderId: event.sender.id,
              channel,
              args,
            })
            break
          }
        }
      },
    )
  }
}

export default new PluginWindowAPI()
