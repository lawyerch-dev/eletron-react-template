import { ipcMain } from 'electron'

/**
 * HTTP API - 插件专用
 * 提供设置请求头的功能
 */
class PluginHttpAPI {
  private pluginHeaders: Map<string, Record<string, string>> = new Map()

  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.on('http-set-headers', (event, headers: Record<string, string>) => {
      try {
        const sess = event.sender.session
        const namespace = `plugin-${event.sender.id}`
        this.pluginHeaders.set(namespace, headers)
        sess.webRequest.onBeforeSendHeaders(
          { urls: ['http://*/*', 'https://*/*'] },
          (details, callback) => {
            callback({
              requestHeaders: { ...details.requestHeaders, ...headers },
            })
          },
        )
        event.returnValue = { success: true }
      } catch {
        event.returnValue = { success: false, error: '设置失败' }
      }
    })

    ipcMain.on('http-get-headers', (event) => {
      const namespace = `plugin-${event.sender.id}`
      event.returnValue = this.pluginHeaders.get(namespace) || {}
    })

    ipcMain.on('http-clear-headers', (event) => {
      const namespace = `plugin-${event.sender.id}`
      this.pluginHeaders.delete(namespace)
      event.returnValue = { success: true }
    })
  }
}

export default new PluginHttpAPI()
