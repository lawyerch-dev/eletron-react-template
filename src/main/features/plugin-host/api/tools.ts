import { ipcMain } from 'electron'

/**
 * 工具 API - 插件专用
 * 注册和执行插件提供的工具函数
 */
class PluginToolsAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMain.on('tools:register', (event, options: any) => {
      try {
        console.log('[PluginTools] 注册工具:', options)
        event.returnValue = { success: true }
      } catch {
        event.returnValue = { success: false, error: '注册失败' }
      }
    })
  }
}

export default new PluginToolsAPI()
