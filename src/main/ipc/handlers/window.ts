import { IpcError } from '@ert/shared/ipc'
import { windowManager } from '../../app/window'
import { registerIpcHandler } from '../IpcApiService'

export function registerWindowIpcHandlers(): void {
  registerIpcHandler('window.open', (_e, input) => {
    const route = input.route
    if (!route || typeof route !== 'string') {
      throw new IpcError('VALIDATION', 'window.open requires a string route')
    }
    // fire-and-forget：创建失败由 WindowManager 日志承载
    void windowManager.open('subWindow', { hash: route })
  })
}
