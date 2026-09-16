import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import Store from 'electron-store'
import log from 'electron-log/main'
import { update } from './update'
import { initPluginSubsystem } from './plugin'

// 初始化日志系统
log.initialize()

// 按环境设置日志级别
log.transports.file.level = app.isPackaged ? 'info' : 'silly'
log.transports.console.level = app.isPackaged ? 'info' : 'silly'

// 主进程启动日志
log.info('=== App starting ===')
log.info(`Version: ${app.getVersion()}`)
log.info(`Platform: ${process.platform} ${process.arch}`)
log.info(`Electron: ${process.versions.electron}`)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 强制 DevTools 使用中文，不弹语言选择
app.commandLine.appendSwitch('lang', 'zh-CN')

// 注册插件图标协议，让 file:// 图片在 http 主窗口正常显示
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'plugin-icon',
    privileges: {
      bypassCSP: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: false,
    },
  },
  {
    // 市场远程图标代理：修正 GitHub raw 等对误命名图片返回的错误 content-type
    scheme: 'market-icon',
    privileges: {
      bypassCSP: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: false,
    },
  },
])

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (process.platform === 'win32' && os.release().startsWith('6.1'))
  app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

// 窗口状态持久化
const windowStore = new Store({ name: 'window-state' })
const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800
const MIN_WIDTH = 800
const MIN_HEIGHT = 600

function getWindowState() {
  const state = windowStore.get('bounds', null) as {
    x?: number
    y?: number
    width?: number
    height?: number
    isMaximized?: boolean
  } | null
  if (!state) return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  return {
    x: state.x,
    y: state.y,
    width: Math.max(state.width || DEFAULT_WIDTH, MIN_WIDTH),
    height: Math.max(state.height || DEFAULT_HEIGHT, MIN_HEIGHT),
    isMaximized: state.isMaximized,
  }
}

function saveWindowState(win: BrowserWindow) {
  if (win.isMaximized()) {
    windowStore.set('bounds.isMaximized', true)
  } else {
    const bounds = win.getBounds()
    windowStore.set('bounds', { ...bounds, isMaximized: false })
  }
}

async function createWindow() {
  const windowState = getWindowState()

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: windowState.width,
    height: windowState.height,
    ...(windowState.x !== undefined && { x: windowState.x }),
    ...(windowState.y !== undefined && { y: windowState.y }),
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    webPreferences: {
      preload,
    },
  })

  // 恢复最大化状态
  if (windowState.isMaximized) {
    win.maximize()
  }

  // 窗口关闭时保存状态
  win.on('close', () => {
    if (win) saveWindowState(win)
  })

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)

  log.info('Window created')
}

// ── 日志系统 ──

// 内存环形缓冲区：保留最近 2000 条日志，防止内存爆炸
const MAX_LOG_ENTRIES = 2000
const logRingBuffer: LogEntry[] = []
let logBufferId = 0

export interface LogEntry {
  id: number
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
  source: 'main' | 'renderer' | 'plugin'
  timestamp: string
  message: string
  data?: unknown[]
}

/** 推送日志到所有窗口 */
function pushLog(entry: LogEntry): void {
  logRingBuffer.push(entry)
  if (logRingBuffer.length > MAX_LOG_ENTRIES) {
    logRingBuffer.splice(0, logRingBuffer.length - MAX_LOG_ENTRIES)
  }
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) {
      w.webContents.send('log-entry', entry)
    }
  }
}

/** 创建日志条目 */
function createLogEntry(
  level: LogEntry['level'],
  source: LogEntry['source'],
  message: string,
  data?: unknown[],
): LogEntry {
  return {
    id: ++logBufferId,
    level,
    source,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 23),
    message,
    data,
  }
}

// 挂钩 electron-log，实时推送到渲染进程
log.hooks.push((_message, transport) => {
  if (transport !== log.transports.console) return
  // 从 electron-log 内部结构提取信息
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (_message as any).data
  if (!Array.isArray(data) || data.length === 0) return
  const first = String(data[0])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const level = (_message as any).level || 'info'
  pushLog(createLogEntry(level as LogEntry['level'], 'main', first, data.slice(1)))
})

// IPC: 初始批量加载日志
ipcMain.handle('get-logs', async () => {
  return logRingBuffer
})

// IPC: 获取日志文件路径
ipcMain.handle('get-log-path', () => {
  return log.transports.file.getFile().path
})

// IPC: 清空日志缓冲区
ipcMain.handle('log:clear', () => {
  logRingBuffer.length = 0
  return true
})

// IPC: 接收渲染进程日志
ipcMain.handle(
  'log:from-renderer',
  (_event, entry: { level: string; message: string; data?: unknown[] }) => {
    const level = ['error', 'warn', 'info', 'debug', 'verbose'].includes(entry.level)
      ? (entry.level as LogEntry['level'])
      : 'info'
    pushLog(createLogEntry(level, 'renderer', entry.message, entry.data))
  },
)

app.whenReady().then(async () => {
  // 初始化插件子系统（市场/安装/运行），主窗口就绪后启用事件广播
  initPluginSubsystem((channel, ...args) => {
    if (win && !win.isDestroyed()) win.webContents.send(channel, ...args)
  })
  await createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// 子窗口示例：与主窗一致的隔离策略，禁止 nodeIntegration
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
