import type {
  InstalledPluginInfo,
  MarketListResult,
  MarketPlugin,
  PluginDownloadProgress,
} from '../types/plugin'
import type { LogEntry, RendererLogInput } from '../types/log'
import type {
  CheckUpdateResult,
  UpdateErrorPayload,
  UpdateProgressInfo,
  UpdateVersionInfo,
} from '../types/update'
import type { OcrRecognizeInput, OcrRecognizeResult, OcrStatus } from '../types/ocr'
import type {
  McpCallToolResult,
  McpServerConfig,
  McpServerLogEntry,
  McpServerPreset,
  McpServerStatus,
  McpToolInfo,
} from '../types/mcp'
import type {
  ModelProviderConfig,
  ModelProviderPreset,
  ModelRole,
  ModelRolesMap,
  ModelTestResult,
  PublicModelProvider,
} from '../types/models'
import type { LlmCompleteInput, LlmCompleteResult, PromptTemplate } from '../types/prompts'
import type {
  AgentChatInput,
  AgentChatResult,
  DocExtractInput,
  DocExtractResult,
  EmbedResult,
  EnvStatus,
  SkillPack,
  WebSearchConfig,
  WebSearchResult,
} from '../types/tools'

/**
 * 请求路由契约：route 为 resource.verb 点分 snake_case。
 * 新增能力 = 在此补 map + main 注册 handler，禁止另开裸通道。
 */
export interface IpcRequestMap {
  // plugin
  'plugin.market.list': { input: void; output: MarketListResult }
  'plugin.market.recommendations': {
    input: { limit?: number } | undefined
    output: MarketPlugin[]
  }
  'plugin.market.readme': {
    input: { pluginName: string }
    output: { success: boolean; content?: string; error?: string }
  }
  'plugin.market.clear_cache': { input: void; output: void }
  'plugin.market.install': {
    input: { name: string; downloadUrl?: string }
    output: { success: boolean; plugin?: InstalledPluginInfo; error?: string }
  }
  'plugin.market.cancel': {
    input: { name: string }
    output: { success: boolean; error?: string }
  }
  'plugin.import_from_file': {
    input: void
    output: {
      success: boolean
      plugin?: InstalledPluginInfo
      error?: string
      cancelled?: boolean
    }
  }
  'plugin.list': { input: void; output: InstalledPluginInfo[] }
  'plugin.delete': {
    input: { pluginPath: string }
    output: { success: boolean; error?: string }
  }
  'plugin.launch': {
    input: { pluginPath: string }
    output: { success: boolean; error?: string }
  }
  'plugin.close': {
    input: { pluginPath: string }
    output: { success: boolean; error?: string }
  }
  'plugin.running': {
    input: void
    output: Array<{ name: string; path: string; running: boolean }>
  }

  // logs
  'logs.get': { input: void; output: LogEntry[] }
  'logs.get_path': { input: void; output: string }
  'logs.clear': { input: void; output: boolean }
  'logs.from_renderer': { input: RendererLogInput; output: void }

  // update
  'update.check': { input: void; output: CheckUpdateResult }
  'update.start_download': { input: void; output: void }
  'update.cancel_download': { input: void; output: void }
  'update.quit_and_install': { input: void; output: void }

  // window
  'window.open': { input: { route: string }; output: void }

  // capabilities: ocr
  'ocr.status': { input: void; output: OcrStatus }
  'ocr.recognize': { input: OcrRecognizeInput; output: OcrRecognizeResult }

  // capabilities: mcp
  'mcp.list_servers': { input: void; output: McpServerStatus[] }
  'mcp.connect': { input: { serverId: string }; output: McpServerStatus }
  'mcp.disconnect': { input: { serverId: string }; output: McpServerStatus }
  'mcp.list_tools': {
    input: { serverId?: string } | undefined
    output: McpToolInfo[]
  }
  'mcp.call_tool': {
    input: { serverId: string; toolName: string; args?: Record<string, unknown> }
    output: McpCallToolResult
  }
  'mcp.save_servers': { input: { servers: McpServerConfig[] }; output: McpServerConfig[] }
  'mcp.list_presets': { input: void; output: McpServerPreset[] }
  'mcp.add_preset': {
    input: {
      presetId: string
      args?: string[]
      env?: Record<string, string>
    }
    output: { config: McpServerConfig; servers: McpServerConfig[] }
  }
  'mcp.set_active': {
    input: { serverId: string; active: boolean }
    output: McpServerStatus
  }
  'mcp.get_logs': {
    input: { serverId: string }
    output: McpServerLogEntry[]
  }

  // capabilities: models
  'models.list_providers': { input: void; output: ModelProviderConfig[] }
  'models.save_provider': {
    input: { provider: ModelProviderConfig }
    output: ModelProviderConfig
  }
  'models.delete_provider': { input: { providerId: string }; output: void }
  'models.list_presets': { input: void; output: ModelProviderPreset[] }
  'models.add_preset': {
    input: {
      presetId: string
      name?: string
      apiKey?: string
      baseUrl?: string
    }
    output: { provider: ModelProviderConfig; providers: ModelProviderConfig[] }
  }
  'models.list_roles': { input: void; output: ModelRolesMap }
  'models.set_role': {
    input: {
      role: ModelRole
      providerId?: string
      modelId?: string
    }
    output: ModelRolesMap
  }
  'models.clear_role': { input: { role: ModelRole }; output: ModelRolesMap }
  'models.test_provider': {
    input: { providerId: string }
    output: ModelTestResult
  }
  'models.fetch_models': {
    input: { providerId: string }
    output: { models: string[] }
  }
  /** 插件宿主 / 其它能力读取可用模型供应商（无密钥） */
  'models.list_public_providers': { input: void; output: PublicModelProvider[] }

  // capabilities: llm（依赖 models 能力的供应商/角色）
  'llm.complete': { input: LlmCompleteInput; output: LlmCompleteResult }

  // capabilities: prompts
  'prompts.list': { input: void; output: PromptTemplate[] }
  'prompts.save': { input: { prompt: PromptTemplate }; output: PromptTemplate }
  'prompts.delete': { input: { id: string }; output: void }
  'prompts.get': { input: { id: string }; output: PromptTemplate | null }

  // capabilities: skills
  'skills.list': { input: void; output: SkillPack[] }
  'skills.save': { input: { skill: SkillPack }; output: SkillPack }
  'skills.delete': { input: { id: string }; output: void }
  'skills.get': { input: { id: string }; output: SkillPack | null }

  // capabilities: web-search
  'web_search.get_config': { input: void; output: WebSearchConfig }
  'web_search.save_config': { input: { config: WebSearchConfig }; output: WebSearchConfig }
  'web_search.search': {
    input: { query: string; limit?: number }
    output: WebSearchResult
  }

  // capabilities: docs
  'docs.extract': { input: DocExtractInput; output: DocExtractResult }
  'docs.pick_and_extract': {
    input: { maxLength?: number } | undefined
    output: DocExtractResult & { cancelled?: boolean }
  }

  // capabilities: embedding
  'embedding.embed': {
    input: {
      texts: string[]
      providerId?: string
      modelId?: string
    }
    output: EmbedResult
  }

  // capabilities: env
  'env.status': { input: void; output: EnvStatus }

  // capabilities: agent
  'agent.chat': { input: AgentChatInput; output: AgentChatResult }
}

export type IpcRoute = keyof IpcRequestMap
export type IpcInput<R extends IpcRoute> = IpcRequestMap[R]['input']
export type IpcOutput<R extends IpcRoute> = IpcRequestMap[R]['output']

/** 主进程 → 渲染进程事件契约 */
export interface IpcEventMap {
  'log.entry': LogEntry
  'plugin.changed': void
  'plugin.download.progress': PluginDownloadProgress
  'plugin.toast': { message: string; type?: string }
  'update.can_available': UpdateVersionInfo
  'update.error': UpdateErrorPayload
  'update.progress': UpdateProgressInfo
  'update.downloaded': void
  /** 主窗内 hash 路由跳转（如插件 host-redirect-ai-models-setting） */
  'app.navigate': { route: string }
}

export type IpcEventName = keyof IpcEventMap
export type IpcEventPayload<E extends IpcEventName> = IpcEventMap[E]
