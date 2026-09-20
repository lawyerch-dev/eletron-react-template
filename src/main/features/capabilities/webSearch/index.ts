import log from 'electron-log/main'
import { webSearchService } from './WebSearchService'

export function initWebSearchCapability(): void {
  const cfg = webSearchService.loadConfig()
  log.info(`[web-search] capability ready provider=${cfg.providerType} active=${cfg.isActive}`)
}

export { webSearchService }
