import { ipcMain } from 'electron'
import { broadcastIpcEvent } from '../../../ipc/IpcApiService'

/**
 * Toast API 模块 - 插件通过 plugin:show-toast 请求，宿主窗口以 IpcApi 事件展示。
 */
class PluginToastAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMain.handle('plugin:show-toast', async (_event, options: any) => {
      try {
        const { message, type = 'info' } = options || {}
        broadcastIpcEvent('plugin.toast', { message, type })
        return { success: true }
      } catch {
        return { success: false, error: '发送失败' }
      }
    })
  }
}

export default new PluginToastAPI()
