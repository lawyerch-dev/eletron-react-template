import { registerLogsIpcHandlers } from './handlers/logs'
import { registerMcpIpcHandlers } from './handlers/mcp'
import { registerModelsIpcHandlers } from './handlers/models'
import { registerOcrIpcHandlers } from './handlers/ocr'
import { registerPluginIpcHandlers } from './handlers/plugin'
import { initUpdateIpc } from './handlers/update'
import { registerWindowIpcHandlers } from './handlers/window'
import { initIpcApiTransport } from './IpcApiService'

export {
  broadcastIpcEvent,
  initIpcApiTransport,
  registerIpcHandler,
  sendIpcEvent,
} from './IpcApiService'
export { logFromMain } from './handlers/logs'

/**
 * 注册宿主渲染层全部 IpcApi 路由并挂上传输通道。
 * 调用时机：initLogging 之后、bootstrapServices / openMain 之前。
 */
export function initHostIpc(options: {
  pluginsEnabled: boolean
  ocrEnabled: boolean
  mcpEnabled: boolean
  modelsEnabled: boolean
}): void {
  initIpcApiTransport()
  registerLogsIpcHandlers()
  registerWindowIpcHandlers()
  initUpdateIpc()
  if (options.ocrEnabled) {
    registerOcrIpcHandlers()
  }
  if (options.mcpEnabled) {
    registerMcpIpcHandlers()
  }
  if (options.modelsEnabled) {
    registerModelsIpcHandlers()
  }
  if (options.pluginsEnabled) {
    registerPluginIpcHandlers()
  }
}
