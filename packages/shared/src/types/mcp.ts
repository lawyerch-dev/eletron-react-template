/** MCP 服务器通信类型（对齐 Cherry：stdio / 进程内 inMemory；http 预留） */
export type McpServerType = 'stdio' | 'inMemory' | 'http'

export type McpInstallSource = 'builtin' | 'manual'

export interface McpServerConfig {
  id: string
  name: string
  type: McpServerType
  description?: string
  /** stdio */
  command?: string
  args?: string[]
  env?: Record<string, string>
  /** http */
  baseUrl?: string
  headers?: Record<string, string>
  /** 是否启用（对齐 Cherry isActive） */
  isActive: boolean
  /** 请求超时秒数 */
  timeout?: number
  /** 该服务器禁用的工具名 */
  disabledTools?: string[]
  installSource?: McpInstallSource
  /** 需要用户先填 env/路径 */
  shouldConfig?: boolean
}

export interface McpToolInfo {
  /** AI SDK wire id，如 mcp__fileSystem__read */
  id: string
  /** 协议原始工具名 */
  name: string
  description?: string
  serverId: string
  serverName: string
  inputSchema?: unknown
}

export type McpRuntimeState = 'idle' | 'connecting' | 'ready' | 'error'

export interface McpServerLogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error' | 'stderr'
  message: string
  source?: string
}

export interface McpServerStatus {
  id: string
  name: string
  type: McpServerType
  command: string
  isActive: boolean
  connected: boolean
  state: McpRuntimeState
  error?: string
  tools: McpToolInfo[]
  logs: McpServerLogEntry[]
  shouldConfig?: boolean
  description?: string
}

export interface McpCallToolResult {
  ok: boolean
  content?: unknown
  isError?: boolean
  error?: string
}

/** 内置预设（安装后写入配置） */
export interface McpServerPreset {
  id: string
  name: string
  description: string
  type: McpServerType
  command?: string
  args?: string[]
  env?: Record<string, string>
  requiredEnvKeys?: string[]
  readyToRun: boolean
  category: 'local' | 'web' | 'data' | 'dev'
  shouldConfig?: boolean
}
