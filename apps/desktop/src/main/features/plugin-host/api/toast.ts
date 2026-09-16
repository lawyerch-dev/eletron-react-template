import { ipcMain, BrowserWindow } from 'electron'

/**
 * Toast API 模块 - 通过主窗口转发 toast 消息
 */
class PluginToastAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMain.handle('plugin:show-toast', async (event, options: any) => {
      try {
        const { message, type = 'info' } = options || {}
        // 转发到所有窗口
        for (const w of BrowserWindow.getAllWindows()) {
          if (!w.isDestroyed()) {
            w.webContents.send('plugin-toast', { message, type })
          }
        }
        return { success: true }
      } catch {
        return { success: false, error: '发送失败' }
      }
    })
  }
}

export default new PluginToastAPI()
