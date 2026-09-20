import type {
  AgentChatInput,
  AgentChatResult,
  DocExtractResult,
  EmbedResult,
  EnvStatus,
  SkillPack,
  WebSearchConfig,
  WebSearchResult,
} from '@ert/shared/types'
import { ipcApi } from '@/ipc'

export const skillsService = {
  list: (): Promise<SkillPack[]> => ipcApi.request('skills.list', undefined as void),
  save: (skill: SkillPack): Promise<SkillPack> => ipcApi.request('skills.save', { skill }),
  delete: (id: string): Promise<void> => ipcApi.request('skills.delete', { id }),
  get: (id: string): Promise<SkillPack | null> => ipcApi.request('skills.get', { id }),
}

export const webSearchService = {
  getConfig: (): Promise<WebSearchConfig> =>
    ipcApi.request('web_search.get_config', undefined as void),
  saveConfig: (config: WebSearchConfig): Promise<WebSearchConfig> =>
    ipcApi.request('web_search.save_config', { config }),
  search: (query: string, limit?: number): Promise<WebSearchResult> =>
    ipcApi.request('web_search.search', { query, limit }),
}

export const docsService = {
  extract: (filePath: string, maxLength?: number): Promise<DocExtractResult> =>
    ipcApi.request('docs.extract', { filePath, maxLength }),
  pickAndExtract: (maxLength?: number): Promise<DocExtractResult & { cancelled?: boolean }> =>
    ipcApi.request('docs.pick_and_extract', { maxLength }),
}

export const embeddingService = {
  embed: (
    texts: string[],
    options?: { providerId?: string; modelId?: string },
  ): Promise<EmbedResult> => ipcApi.request('embedding.embed', { texts, ...options }),
}

export const envService = {
  status: (): Promise<EnvStatus> => ipcApi.request('env.status', undefined as void),
}

export const agentService = {
  chat: (input: AgentChatInput): Promise<AgentChatResult> => ipcApi.request('agent.chat', input),
}
