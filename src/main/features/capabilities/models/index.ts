/**
 * 主进程 models 能力：供应商 / 角色配置。
 * IPC 路由见 main/ipc/handlers/models.ts。
 */
import log from 'electron-log/main'
import { modelService } from './ModelService'

export function initModelsCapability(): void {
  const cfg = modelService.loadConfig()
  log.info(
    `[models] capability ready providers=${cfg.providers.length} roles=${Object.keys(cfg.roles).length}`,
  )
}

export { modelService }
