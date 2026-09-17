import { app, BrowserWindow } from 'electron'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initAppRoot, initLogging, registerShellProtocols, paths } from './app'
import { registerDefaultServices } from './app/defaultServices'
import { bootstrapServices, disposeServices } from './app/serviceRegistry'
import { windowManager } from './app/window'
import { isCapabilityEnabled } from './features/capabilities'
import { initHostIpc } from './ipc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 路径注册必须最先：后续日志/协议/插件都依赖 APP_ROOT
initAppRoot(path.join(__dirname, '../../..'))
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? paths.rendererPublic()
  : paths.rendererDist()

initLogging()
registerShellProtocols()

if (process.platform === 'win32' && os.release().startsWith('6.1')) {
  app.disableHardwareAcceleration()
}
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(async () => {
  // 1) IpcApi 传输 + 各域 handler
  initHostIpc({
    pluginsEnabled: isCapabilityEnabled('plugins'),
    ocrEnabled: isCapabilityEnabled('ocr'),
  })

  // 2) 注册并启动主进程服务
  registerDefaultServices({ pluginsEnabled: isCapabilityEnabled('plugins') })
  await bootstrapServices()

  // 3) 主窗（经 WindowManager，禁止业务 new BrowserWindow）
  await windowManager.openMain()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    disposeServices()
    app.quit()
  }
})

app.on('before-quit', () => {
  disposeServices()
})

app.on('second-instance', () => {
  windowManager.focusMain()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void windowManager.openMain()
  } else {
    windowManager.focusMain()
  }
})
