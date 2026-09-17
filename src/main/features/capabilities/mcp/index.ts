/**
 * MCP 能力入口（对齐 Cherry 精简版）：inMemory 内置 + stdio 运行时。
 */
import log from 'electron-log/main'
import { mcpRuntimeService } from './McpRuntimeService'

export function initMcpCapability(): void {
  const servers = mcpRuntimeService.loadConfig()
  const active = servers.filter((s) => s.isActive)
  log.info(`[mcp] capability ready configured=${servers.length} active=${active.length}`)
  // 激活所有 isActive 的 inMemory；stdio 在首次 call/connect 时拉起
  for (const s of active) {
    if (s.type === 'inMemory') {
      void mcpRuntimeService
        .listTools(s.id)
        .then((tools) => log.info(`[mcp] inMemory ${s.id} tools=${tools.length}`))
        .catch((e) => log.warn('[mcp] inMemory init', e))
    }
  }
}

export { mcpRuntimeService }
export { mcpClientService } from './McpClientService'
