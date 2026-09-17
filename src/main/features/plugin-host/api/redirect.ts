import { windowManager } from '../../../app/window'
import { isCapabilityEnabled } from '../../capabilities'
import { sendIpcEvent } from '../../../ipc'
import { ipcMain } from 'electron'

/**
 * 插件跳转API - 插件专用
 * 允许插件之间互相跳转和传递数据
 */
class PluginRedirectAPI {
  public init(): void {
    this.setupIPC()
  }

  private focusMainAndNavigate(route: string): boolean {
    const main = windowManager.getMainWindow()
    if (!main || main.isDestroyed()) return false
    if (main.isMinimized()) main.restore()
    main.focus()
    sendIpcEvent(main.webContents, 'app.navigate', { route })
    return true
  }

  private setupIPC(): void {
    ipcMain.on(
      'redirect',
      (event, options: { label?: string; payload?: Record<string, unknown> }) => {
        try {
          console.log('[PluginRedirect] 插件跳转:', options)
          event.returnValue = { success: true }
        } catch {
          event.returnValue = { success: false, error: '跳转失败' }
        }
      },
    )

    ipcMain.on(
      'host-redirect',
      (_event, _options: { label?: string; payload?: Record<string, unknown> }) => {
        _event.returnValue = { success: true }
      },
    )

    ipcMain.on('host-redirect-hotkey-setting', (event) => {
      this.focusMainAndNavigate('/settings')
      event.returnValue = { success: true }
    })

    ipcMain.on('host-redirect-ai-models-setting', (event) => {
      const ok = isCapabilityEnabled('models')
        ? this.focusMainAndNavigate('/models')
        : this.focusMainAndNavigate('/settings')
      event.returnValue = { success: ok }
    })
  }
}

export default new PluginRedirectAPI()
