import type { ModelRole } from './models'

/** 技能包（薄版）：系统提示词 + 可选 MCP 工具引用 */
export interface SkillPack {
  id: string
  name: string
  description?: string
  /** 注入对话的 system prompt */
  systemPrompt: string
  /** 引用的 MCP 工具 wire id，如 mcp__memory__create_entities */
  mcpTools?: string[]
  category?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export type WebSearchProviderType = 'brave' | 'tavily' | 'searxng' | 'custom'

export interface WebSearchConfig {
  providerType: WebSearchProviderType
  /** SearXNG / custom 网关 */
  baseUrl?: string
  apiKey?: string
  isActive: boolean
  /** 默认返回条数 */
  limit?: number
}

export interface WebSearchHit {
  title: string
  url: string
  snippet?: string
}

export interface WebSearchResult {
  ok: boolean
  hits: WebSearchHit[]
  error?: string
  latencyMs?: number
}

export type DocFormat = 'text' | 'markdown' | 'json' | 'csv' | 'html' | 'binary' | 'unknown'

export interface DocExtractInput {
  /** 绝对路径或用户选择后的路径 */
  filePath: string
  /** 截断长度，默认 50000 */
  maxLength?: number
}

export interface DocExtractResult {
  ok: boolean
  path: string
  format: DocFormat
  sizeBytes?: number
  text?: string
  truncated?: boolean
  error?: string
}

export interface EmbedResult {
  ok: boolean
  vectors?: number[][]
  dimensions?: number
  providerId?: string
  modelId?: string
  error?: string
  latencyMs?: number
}

export type EnvToolId = 'uv' | 'python' | 'python3' | 'node' | 'npm' | 'pnpm' | 'ffmpeg'

export interface EnvToolStatus {
  id: EnvToolId
  available: boolean
  path?: string
  version?: string
  note?: string
}

export interface EnvStatus {
  tools: EnvToolStatus[]
  platform: string
  checkedAt: number
}

/** Agent 会话消息（主进程侧，可扩展 tool 轨迹） */
export interface AgentChatTurn {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AgentChatInput {
  messages: AgentChatTurn[]
  /** 可选技能：注入 systemPrompt */
  skillId?: string
  role?: ModelRole
  temperature?: number
  maxTokens?: number
}

export interface AgentChatResult {
  ok: boolean
  content?: string
  error?: string
  providerId?: string
  modelId?: string
  latencyMs?: number
  /** 使用的技能名（若有） */
  skillName?: string
}
