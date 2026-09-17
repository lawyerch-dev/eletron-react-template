/** 模型供应商协议类型（对齐 Cherry 的精简子集） */
export type ModelProviderType =
  'openai' | 'openai-compatible' | 'anthropic' | 'gemini' | 'ollama' | 'custom'

/** 默认模型角色（助手 / 快捷 / 翻译 / 视觉 / 嵌入 / 绘画 / 摘要） */
export type ModelRole =
  'default-assistant' | 'quick' | 'translate' | 'vision' | 'embedding' | 'draw' | 'summarize'

export const MODEL_ROLES: readonly ModelRole[] = [
  'default-assistant',
  'quick',
  'translate',
  'vision',
  'embedding',
  'draw',
  'summarize',
] as const

export interface ModelConfig {
  /** 模型 id（供应商侧，如 gpt-4o / deepseek-chat） */
  id: string
  /** 展示名 */
  name: string
  capabilities?: {
    vision?: boolean
    functionCall?: boolean
    reasoning?: boolean
  }
}

export interface ModelProviderConfig {
  id: string
  name: string
  type: ModelProviderType
  /** OpenAI-compatible / Anthropic / Ollama 等网关地址 */
  baseUrl?: string
  /** 密钥（仅本地 userData；列表接口可脱敏） */
  apiKey?: string
  apiVersion?: string
  isActive: boolean
  description?: string
  models: ModelConfig[]
  createdAt: number
  updatedAt: number
}

/** 返回给渲染层/插件的脱敏供应商（不含密钥） */
export interface PublicModelProvider {
  id: string
  name: string
  type: ModelProviderType
  isActive: boolean
  models: ModelConfig[]
}

export interface ModelRoleAssignment {
  role: ModelRole
  providerId: string
  modelId: string
}

export type ModelRolesMap = Partial<Record<ModelRole, ModelRoleAssignment>>

export interface ModelsConfig {
  providers: ModelProviderConfig[]
  roles: ModelRolesMap
}

/** 供应商预设（一键添加） */
export interface ModelProviderPreset {
  id: string
  name: string
  type: ModelProviderType
  baseUrl?: string
  description: string
  /** 是否需要用户填 apiKey */
  requiresApiKey: boolean
  /** 预填模型列表 */
  models?: ModelConfig[]
  /** 国内可直连 */
  chinaReady?: boolean
}

export interface ModelTestResult {
  ok: boolean
  latencyMs?: number
  error?: string
  /** 连通时拉到的模型 id 列表（若接口支持） */
  models?: string[]
}
