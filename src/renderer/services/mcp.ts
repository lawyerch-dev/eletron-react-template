import type {
  McpCallToolResult,
  McpServerConfig,
  McpServerLogEntry,
  McpServerPreset,
  McpServerStatus,
  McpToolInfo,
} from '@ert/shared/types'
import { ipcApi } from '@/ipc'

export const mcpService = {
  listServers: (): Promise<McpServerStatus[]> =>
    ipcApi.request('mcp.list_servers', undefined as void),
  connect: (serverId: string): Promise<McpServerStatus> =>
    ipcApi.request('mcp.connect', { serverId }),
  disconnect: (serverId: string): Promise<McpServerStatus> =>
    ipcApi.request('mcp.disconnect', { serverId }),
  setActive: (serverId: string, active: boolean): Promise<McpServerStatus> =>
    ipcApi.request('mcp.set_active', { serverId, active }),
  listTools: (serverId?: string): Promise<McpToolInfo[]> =>
    ipcApi.request('mcp.list_tools', { serverId }),
  callTool: (
    serverId: string,
    toolName: string,
    args?: Record<string, unknown>,
  ): Promise<McpCallToolResult> => ipcApi.request('mcp.call_tool', { serverId, toolName, args }),
  saveServers: (servers: McpServerConfig[]): Promise<McpServerConfig[]> =>
    ipcApi.request('mcp.save_servers', { servers }),
  listPresets: (): Promise<McpServerPreset[]> =>
    ipcApi.request('mcp.list_presets', undefined as void),
  addPreset: (presetId: string, options?: { args?: string[]; env?: Record<string, string> }) =>
    ipcApi.request('mcp.add_preset', { presetId, ...options }),
  getLogs: (serverId: string): Promise<McpServerLogEntry[]> =>
    ipcApi.request('mcp.get_logs', { serverId }),
}
