import { initOcrCapability } from './ocr'
import { initMcpCapability } from './mcp'
import { initModelsCapability } from './models'
import { initAgentCapability } from './agent'
import { isCapabilityEnabled } from './config'

/**
 * 按 config 初始化可选能力（业务侧）。
 * 宿主渲染层 IPC 路由由 main/ipc 按开关注册，此处只做能力本体初始化。
 */
export async function initCapabilities(): Promise<void> {
  if (isCapabilityEnabled('ocr')) {
    initOcrCapability()
  }
  if (isCapabilityEnabled('mcp')) {
    initMcpCapability()
  }
  if (isCapabilityEnabled('models')) {
    initModelsCapability()
  }
  if (isCapabilityEnabled('agent')) {
    initAgentCapability()
  }
}
