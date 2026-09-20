/**
 * Agent 能力：薄版对话运行时（技能 + 默认助手角色）。
 * 工具循环可在此扩展。
 */
import log from 'electron-log/main'
import { agentService } from './AgentService'

export function initAgentCapability(): void {
  log.info('[agent] capability ready (thin chat runtime)')
}

export { agentService }
