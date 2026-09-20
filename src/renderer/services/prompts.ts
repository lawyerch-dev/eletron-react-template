import type { LlmCompleteInput, LlmCompleteResult, PromptTemplate } from '@ert/shared/types'
import { ipcApi } from '@/ipc'

export const llmService = {
  complete: (input: LlmCompleteInput): Promise<LlmCompleteResult> =>
    ipcApi.request('llm.complete', input),
}

export const promptsService = {
  list: (): Promise<PromptTemplate[]> => ipcApi.request('prompts.list', undefined as void),
  save: (prompt: PromptTemplate): Promise<PromptTemplate> =>
    ipcApi.request('prompts.save', { prompt }),
  delete: (id: string): Promise<void> => ipcApi.request('prompts.delete', { id }),
  get: (id: string): Promise<PromptTemplate | null> => ipcApi.request('prompts.get', { id }),
}
