import { registerIpcHandler } from '../IpcApiService'
import { mcpRuntimeService } from '../../features/capabilities/mcp'

/** MCP 能力：Cherry 风格运行时（inMemory + stdio） */
export function registerMcpIpcHandlers(): void {
  registerIpcHandler('mcp.list_servers', () => mcpRuntimeService.listServers())
  registerIpcHandler('mcp.connect', (_e, input) => mcpRuntimeService.connect(input.serverId))
  registerIpcHandler('mcp.disconnect', (_e, input) => mcpRuntimeService.disconnect(input.serverId))
  registerIpcHandler('mcp.list_tools', (_e, input) => mcpRuntimeService.listTools(input?.serverId))
  registerIpcHandler('mcp.call_tool', (_e, input) =>
    mcpRuntimeService.callTool(input.serverId, input.toolName, input.args),
  )
  registerIpcHandler('mcp.save_servers', (_e, input) => mcpRuntimeService.saveConfig(input.servers))
  registerIpcHandler('mcp.list_presets', () => mcpRuntimeService.listPresets())
  registerIpcHandler('mcp.add_preset', (_e, input) =>
    mcpRuntimeService.addPreset(input.presetId, { args: input.args, env: input.env }),
  )
  registerIpcHandler('mcp.set_active', (_e, input) =>
    mcpRuntimeService.setActive(input.serverId, input.active),
  )
  registerIpcHandler('mcp.get_logs', (_e, input) => mcpRuntimeService.getLogs(input.serverId))
}
