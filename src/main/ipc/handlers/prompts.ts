import { registerIpcHandler } from '../IpcApiService'
import { modelService } from '../../features/capabilities/models'
import { skillService } from '../../features/capabilities/skills'
import { webSearchService } from '../../features/capabilities/webSearch'
import { docService } from '../../features/capabilities/docs'
import { envService } from '../../features/capabilities/env'
import { agentService } from '../../features/capabilities/agent'
import { promptService } from '../../features/capabilities/prompts'

/** llm 补全（依赖 models） */
export function registerLlmIpcHandlers(): void {
  registerIpcHandler('llm.complete', (_e, input) => modelService.completeChat(input))
}

/** embedding（依赖 models 的供应商/角色） */
export function registerEmbeddingIpcHandlers(): void {
  registerIpcHandler('embedding.embed', (_e, input) => modelService.embedTexts(input))
}

/** prompts 提示词库 */
export function registerPromptsIpcHandlers(): void {
  registerIpcHandler('prompts.list', () => promptService.list())
  registerIpcHandler('prompts.save', (_e, input) => promptService.save(input.prompt))
  registerIpcHandler('prompts.delete', (_e, input) => {
    promptService.delete(input.id)
  })
  registerIpcHandler('prompts.get', (_e, input) => promptService.get(input.id))
}

export function registerSkillsIpcHandlers(): void {
  registerIpcHandler('skills.list', () => skillService.list())
  registerIpcHandler('skills.save', (_e, input) => skillService.save(input.skill))
  registerIpcHandler('skills.delete', (_e, input) => {
    skillService.delete(input.id)
  })
  registerIpcHandler('skills.get', (_e, input) => skillService.get(input.id))
}

export function registerWebSearchIpcHandlers(): void {
  registerIpcHandler('web_search.get_config', () => webSearchService.getConfigForUi())
  registerIpcHandler('web_search.save_config', (_e, input) =>
    webSearchService.saveConfig(input.config),
  )
  registerIpcHandler('web_search.search', (_e, input) =>
    webSearchService.search(input.query, input.limit),
  )
}

export function registerDocsIpcHandlers(): void {
  registerIpcHandler('docs.extract', (_e, input) =>
    docService.extract(input.filePath, input.maxLength),
  )
  registerIpcHandler('docs.pick_and_extract', (_e, input) =>
    docService.pickAndExtract(input?.maxLength),
  )
}

export function registerEnvIpcHandlers(): void {
  registerIpcHandler('env.status', () => envService.status())
}

export function registerAgentIpcHandlers(): void {
  registerIpcHandler('agent.chat', (_e, input) => agentService.chat(input))
}
