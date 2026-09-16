import { ipcMain } from 'electron'

/**
 * UI API - 插件专用
 * 提供子输入框等功能（在独立窗口模式下为 stub）
 */
class PluginUIAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.handle('set-sub-input', async () => false)
    ipcMain.handle('remove-sub-input', async () => false)
    ipcMain.handle('set-sub-input-value', async () => false)
    ipcMain.on('sub-input-focus', (event) => {
      event.returnValue = false
    })
    ipcMain.on('sub-input-blur', (event) => {
      event.returnValue = false
    })
    ipcMain.on('sub-input-select', (event) => {
      event.returnValue = false
    })
    ipcMain.handle('set-expend-height', async () => false)
  }
}

export default new PluginUIAPI()
