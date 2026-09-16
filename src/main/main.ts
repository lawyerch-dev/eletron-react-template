import { app, BrowserWindow, ipcMain } from 'electron'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  initLogging,
  registerShellProtocols,
  createMainWindow,
  getPreloadPath,
  getIndexHtmlPath,
  VITE_DEV_SERVER_URL,
} from './app'
import { initPluginSubsystem } from './features/plugin-host'
import { initCapabilities, isCapabilityEnabled } from './features/capabilities'
import { IpcChannel } from '@ert/shared/ipc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 应用壳：日志 + 协议（须在 app ready 前）
initLogging()
registerShellProtocols()

// The built directory structure
//
// ├─┬ out
// │ ├─┬ electron
// │ │ ├─┬ main
// │ │ │ └── main.js     > Electron-Main
// │ │ └─┬ preload
// │ │   └── index.mjs   > Preload-Scripts
// │ └─┬ renderer
// │   └── src/renderer/index.html  > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../../..')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'src/renderer/public')
  : path.join(process.env.APP_ROOT, 'out/renderer')

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
const preload = getPreloadPath()
const indexHtml = getIndexHtmlPath()

app.whenReady().then(async () => {
  if (isCapabilityEnabled('plugins')) {
    initPluginSubsystem((channel, ...args) => {
      if (win && !win.isDestroyed()) win.webContents.send(channel, ...args)
    })
  }
  await initCapabilities()
  win = await createMainWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    void createMainWindow().then((w) => {
      win = w
    })
  }
})

// 子窗口示例：与主窗一致的隔离策略，禁止 nodeIntegration
ipcMain.handle(IpcChannel.OpenWin, (_, arg) => {
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
