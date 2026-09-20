import { registerLogsIpcHandlers } from './handlers/logs'
import { registerMcpIpcHandlers } from './handlers/mcp'
import { registerModelsIpcHandlers } from './handlers/models'
import {
  registerAgentIpcHandlers,
  registerDocsIpcHandlers,
  registerEmbeddingIpcHandlers,
  registerEnvIpcHandlers,
  registerLlmIpcHandlers,
  registerPromptsIpcHandlers,
  registerSkillsIpcHandlers,
  registerWebSearchIpcHandlers,
} from './handlers/prompts'
import { registerOcrIpcHandlers } from './handlers/ocr'
import { registerPluginIpcHandlers } from './handlers/plugin'
import { initUpdateIpc } from './handlers/update'
import { registerWindowIpcHandlers } from './handlers/window'
import { initIpcApiTransport } from './IpcApiService'
import { isCapabilityEnabled } from '../features/capabilities'

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
 * 按 @ert/shared capabilities 开关条件注册。
 */
export function initHostIpc(): void {
  initIpcApiTransport()
  registerLogsIpcHandlers()
  registerWindowIpcHandlers()
  initUpdateIpc()
  if (isCapabilityEnabled('ocr')) {
    registerOcrIpcHandlers()
  }
  if (isCapabilityEnabled('mcp')) {
    registerMcpIpcHandlers()
  }
  if (isCapabilityEnabled('models')) {
    registerModelsIpcHandlers()
    registerLlmIpcHandlers()
  }
  if (isCapabilityEnabled('embedding')) {
    registerEmbeddingIpcHandlers()
  }
  if (isCapabilityEnabled('prompts')) {
    registerPromptsIpcHandlers()
  }
  if (isCapabilityEnabled('skills')) {
    registerSkillsIpcHandlers()
  }
  if (isCapabilityEnabled('webSearch')) {
    registerWebSearchIpcHandlers()
  }
  if (isCapabilityEnabled('docs')) {
    registerDocsIpcHandlers()
  }
  if (isCapabilityEnabled('env')) {
    registerEnvIpcHandlers()
  }
  if (isCapabilityEnabled('agent')) {
    registerAgentIpcHandlers()
  }
  if (isCapabilityEnabled('plugins')) {
    registerPluginIpcHandlers()
  }
}
