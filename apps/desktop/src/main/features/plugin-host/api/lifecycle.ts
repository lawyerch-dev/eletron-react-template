import { ipcMain, BrowserWindow } from 'electron'

/**
 * 插件生命周期API - 插件专用
 */
export class PluginLifecycleAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.handle('out-plugin', (event, isKill: boolean = false) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        if (isKill) {
          win.close()
        } else {
          event.sender.send('plugin-out', false)
        }
        return true
      }
      return false
    })
  }
}

export default new PluginLifecycleAPI()
