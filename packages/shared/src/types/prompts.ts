import type { ModelRole } from './models'

/** 提示词模板（本地库） */
export interface PromptTemplate {
  id: string
  name: string
  /** 提示词正文；支持 {{key}} 占位 */
  content: string
  description?: string
  category?: string
  createdAt: number
  updatedAt: number
}

export type PromptTemplates = PromptTemplate[]

/** 聊天消息角色 */
export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

/** 补全请求：二选一 —— role（读默认角色映射）或 providerId+modelId */
export interface LlmCompleteInput {
  role?: ModelRole
  providerId?: string
  modelId?: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface LlmUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface LlmCompleteResult {
  ok: boolean
  content?: string
  error?: string
  /** 实际使用的供应商/模型（便于调试） */
  providerId?: string
  modelId?: string
  latencyMs?: number
  usage?: LlmUsage
}
