import log from 'electron-log/main'
import type {
  McpCallToolResult,
  McpServerConfig,
  McpServerLogEntry,
  McpServerPreset,
  McpServerStatus,
  McpToolInfo,
} from '@ert/shared/types'
import {
  MCP_SERVER_PRESETS,
  buildMcpToolWireId,
  chinaMirrorEnv,
  findMcpPreset,
  seedDefaultMcpServers,
} from '@ert/shared/ipc'
import { paths } from '../../../app/paths'
import fs from 'node:fs'
import { createInMemoryTools, type InMemoryTool } from './inMemory'
import { mcpClientService, expandMcpArg } from './McpClientService'

const MAX_LOGS = 200

/**
 * MCP 运行时（对齐 Cherry McpRuntimeService 的精简版）：
 * - inMemory：进程内工具（国内零依赖）
 * - stdio：外部进程 + 国内镜像
 * - isActive 开关、工具 wire id、日志缓冲
 */
class McpRuntimeService {
  private logs = new Map<string, McpServerLogEntry[]>()
  private inMemoryTools = new Map<string, InMemoryTool[]>()

  private pushLog(serverId: string, level: McpServerLogEntry['level'], message: string) {
    const list = this.logs.get(serverId) || []
    list.push({ timestamp: Date.now(), level, message, source: 'mcp' })
    if (list.length > MAX_LOGS) list.splice(0, list.length - MAX_LOGS)
    this.logs.set(serverId, list)
    log.debug(`[mcp:${serverId}] ${level}`, message)
  }

  getLogs(serverId: string): McpServerLogEntry[] {
    return this.logs.get(serverId) || []
  }

  loadConfig(): McpServerConfig[] {
    const p = paths.userData('mcp-servers.json')
    try {
      if (!fs.existsSync(p)) {
        const seeded = seedDefaultMcpServers()
        this.saveConfig(seeded)
        return seeded
      }
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
      const list = Array.isArray(raw) ? raw : (raw?.servers ?? [])
      return (list as McpServerConfig[]).filter(
        (s) => s && typeof s.id === 'string' && typeof s.name === 'string',
      )
    } catch (e) {
      log.warn('[mcp] load config failed', e)
      return seedDefaultMcpServers()
    }
  }

  saveConfig(servers: McpServerConfig[]): McpServerConfig[] {
    const p = paths.userData('mcp-servers.json')
    fs.mkdirSync(paths.userData(), { recursive: true })
    fs.writeFileSync(p, JSON.stringify(servers, null, 2), 'utf-8')
    return servers
  }

  listPresets(): McpServerPreset[] {
    return MCP_SERVER_PRESETS
  }

  addPreset(
    presetId: string,
    options?: { args?: string[]; env?: Record<string, string> },
  ): { config: McpServerConfig; servers: McpServerConfig[] } {
    const preset = findMcpPreset(presetId)
    if (!preset) throw new Error('未知预设: ' + presetId)
    const config: McpServerConfig = {
      id: preset.id,
      name: preset.name,
      type: preset.type,
      description: preset.description,
      command: preset.command,
      args: (options?.args ?? preset.args)?.map(expandMcpArg),
      env: options?.env ?? preset.env,
      baseUrl: undefined,
      isActive: preset.readyToRun && !preset.shouldConfig,
      shouldConfig: preset.shouldConfig,
      installSource: 'builtin',
    }
    const servers = this.loadConfig()
    const idx = servers.findIndex((s) => s.id === config.id)
    if (idx >= 0) servers[idx] = { ...servers[idx], ...config }
    else servers.push(config)
    this.saveConfig(servers)
    this.pushLog(config.id, 'info', 'preset installed: ' + presetId)
    return { config, servers }
  }

  private ensureInMemoryTools(server: McpServerConfig): InMemoryTool[] {
    let tools = this.inMemoryTools.get(server.id)
    if (!tools) {
      tools = createInMemoryTools(server.id, server.args)
      this.inMemoryTools.set(server.id, tools)
    }
    return tools.filter((t) => !server.disabledTools?.includes(t.name))
  }

  private toolsOf(server: McpServerConfig): McpToolInfo[] {
    if (server.type === 'inMemory') {
      return this.ensureInMemoryTools(server).map((t) => ({
        id: buildMcpToolWireId({
          serverId: server.id,
          serverName: server.name,
          toolName: t.name,
        }),
        name: t.name,
        description: t.description,
        serverId: server.id,
        serverName: server.name,
        inputSchema: t.inputSchema,
      }))
    }
    const list = mcpClientService
      .listToolsSync(server.id)
      .filter((t) => !server.disabledTools?.includes(t.name))
    return list.map((t) => ({
      id:
        t.id ||
        buildMcpToolWireId({
          serverId: server.id,
          serverName: server.name,
          toolName: t.name,
        }),
      name: t.name,
      description: t.description,
      serverId: server.id,
      serverName: server.name,
      inputSchema: t.inputSchema,
    }))
  }

  private statusOf(server: McpServerConfig): McpServerStatus {
    const command =
      server.type === 'inMemory'
        ? 'in-process'
        : server.type === 'http'
          ? server.baseUrl || ''
          : [server.command, ...(server.args || [])].join(' ')

    let connected = false
    let error: string | undefined
    if (server.type === 'inMemory') {
      connected = server.isActive
    } else if (server.type === 'stdio') {
      const s = mcpClientService.getConnected(server.id)
      connected = !!s?.connected
      error = s?.error
    }

    return {
      id: server.id,
      name: server.name,
      type: server.type || 'stdio',
      command,
      isActive: server.isActive,
      connected,
      state: connected ? 'ready' : error ? 'error' : server.isActive ? 'connecting' : 'idle',
      error,
      tools: connected || server.type === 'inMemory' ? this.toolsOf(server) : [],
      logs: this.getLogs(server.id).slice(-50),
      shouldConfig: server.shouldConfig,
      description: server.description,
    }
  }

  listServers(): McpServerStatus[] {
    return this.loadConfig().map((c) => this.statusOf(c))
  }

  async setActive(serverId: string, active: boolean): Promise<McpServerStatus> {
    const servers = this.loadConfig()
    const server = servers.find((s) => s.id === serverId)
    if (!server) throw new Error('未找到服务器: ' + serverId)
    server.isActive = active
    this.saveConfig(servers)

    if (server.type === 'stdio') {
      if (active) {
        this.pushLog(serverId, 'info', 'activating stdio...')
        try {
          await mcpClientService.connect(serverId, server)
          this.pushLog(serverId, 'info', 'ready')
        } catch (e) {
          this.pushLog(serverId, 'error', (e as Error).message)
          throw e
        }
      } else {
        await mcpClientService.disconnect(serverId)
        this.pushLog(serverId, 'info', 'disconnected')
      }
    } else {
      this.pushLog(serverId, 'info', active ? 'inMemory enabled' : 'inMemory disabled')
    }
    return this.statusOf(server)
  }

  /** 兼容旧 connect */
  connect(serverId: string): Promise<McpServerStatus> {
    return this.setActive(serverId, true)
  }

  disconnect(serverId: string): Promise<McpServerStatus> {
    return this.setActive(serverId, false)
  }

  async listTools(serverId?: string): Promise<McpToolInfo[]> {
    const configs = this.loadConfig()
    const ids = serverId ? [serverId] : configs.map((c) => c.id)
    const out: McpToolInfo[] = []
    for (const id of ids) {
      const cfg = configs.find((c) => c.id === id)
      if (!cfg || !cfg.isActive) continue
      if (cfg.type === 'stdio' && !mcpClientService.getConnected(id)?.connected) {
        try {
          await mcpClientService.connect(id, cfg)
        } catch {
          continue
        }
      }
      out.push(...this.toolsOf(cfg))
    }
    return out
  }

  async callTool(
    serverId: string,
    toolName: string,
    args?: Record<string, unknown>,
  ): Promise<McpCallToolResult> {
    const server = this.loadConfig().find((s) => s.id === serverId)
    if (!server) return { ok: false, error: '未找到服务器: ' + serverId }
    if (!server.isActive) return { ok: false, error: '服务器未启用' }
    if (server.disabledTools?.includes(toolName)) {
      return { ok: false, error: '工具已被禁用: ' + toolName }
    }

    this.pushLog(serverId, 'info', 'call_tool ' + toolName)

    if (server.type === 'inMemory') {
      const tool = this.ensureInMemoryTools(server).find((t) => t.name === toolName)
      if (!tool) return { ok: false, error: '未知工具: ' + toolName }
      try {
        const result = await tool.handler(args || {})
        return {
          ok: !result.isError,
          isError: !!result.isError,
          content: result.content,
        }
      } catch (e) {
        this.pushLog(serverId, 'error', (e as Error).message)
        return { ok: false, error: (e as Error).message }
      }
    }

    const result = await mcpClientService.callTool(serverId, server, toolName, args)
    if (!result.ok) this.pushLog(serverId, 'error', result.error || 'call failed')
    return result
  }

  /** 兼容旧 save_servers */
  saveServers(servers: McpServerConfig[]): McpServerConfig[] {
    return this.saveConfig(servers)
  }

  dispose(): void {
    this.inMemoryTools.clear()
    mcpClientService.dispose()
  }
}

export const mcpRuntimeService = new McpRuntimeService()
export { chinaMirrorEnv }
