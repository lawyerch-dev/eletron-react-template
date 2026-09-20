/**
 * 主进程 prompts 能力：本地提示词库。
 * IPC 路由见 main/ipc/handlers/prompts.ts。
 */
import log from 'electron-log/main'
import { promptService } from './PromptService'

export function initPromptsCapability(): void {
  log.info(`[prompts] capability ready count=${promptService.list().length}`)
}

export { promptService }
