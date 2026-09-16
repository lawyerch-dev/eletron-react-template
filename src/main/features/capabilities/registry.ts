import { isCapabilityEnabled } from './config'
import { initOcrCapability } from './ocr'
import { initMcpCapability } from './mcp'
import { initAgentCapability } from './agent'

/**
 * 按 config 初始化可选能力。
 * 注意：当前为静态 import；若需真正 tree-shake 未开启能力，改为动态 import()。
 * plugins 能力在 plugin/index.ts 单独初始化。
 */
export async function initCapabilities(): Promise<void> {
  if (isCapabilityEnabled('ocr')) {
    initOcrCapability()
  }
  if (isCapabilityEnabled('mcp')) {
    initMcpCapability()
  }
  if (isCapabilityEnabled('agent')) {
    initAgentCapability()
  }
}
