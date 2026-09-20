import log from 'electron-log/main'
import { skillService } from './SkillService'

export function initSkillsCapability(): void {
  log.info(`[skills] capability ready count=${skillService.list().length}`)
}

export { skillService }
