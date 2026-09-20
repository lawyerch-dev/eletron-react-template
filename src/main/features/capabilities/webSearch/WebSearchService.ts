import fs from 'node:fs'
import log from 'electron-log/main'
import { safeStorage } from 'electron'
import type { WebSearchConfig, WebSearchHit, WebSearchResult } from '@ert/shared/types'
import { paths } from '../../../app/paths'

const ENC_PREFIX = 'enc:'
const PLAIN_PREFIX = 'plain:'

function encryptSecret(plain: string): string {
  if (!plain) return ''
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return ENC_PREFIX + safeStorage.encryptString(plain).toString('base64')
    }
  } catch (e) {
    log.warn('[web-search] encrypt failed', e)
  }
  return PLAIN_PREFIX + plain
}

function decryptSecret(stored: string | undefined): string {
  if (!stored) return ''
  if (stored.startsWith(PLAIN_PREFIX)) return stored.slice(PLAIN_PREFIX.length)
  if (stored.startsWith(ENC_PREFIX)) {
    try {
      return safeStorage.decryptString(Buffer.from(stored.slice(ENC_PREFIX.length), 'base64'))
    } catch {
      return ''
    }
  }
  return stored
}

function defaultConfig(): WebSearchConfig {
  return {
    providerType: 'searxng',
    baseUrl: 'https://searx.be',
    apiKey: '',
    isActive: true,
    limit: 5,
  }
}

/** 网络搜索：Brave / Tavily / SearXNG（json） */
class WebSearchService {
  loadConfig(): WebSearchConfig {
    const p = paths.userData('web-search.json')
    try {
      if (!fs.existsSync(p)) return defaultConfig()
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8')) as Partial<WebSearchConfig>
      return {
        providerType: raw.providerType || 'searxng',
        baseUrl: raw.baseUrl || '',
        // 存储形态保留，读给 UI 时解密
        apiKey: raw.apiKey || '',
        isActive: raw.isActive !== false,
        limit: raw.limit || 5,
      }
    } catch {
      return defaultConfig()
    }
  }

  getConfigForUi(): WebSearchConfig {
    const cfg = this.loadConfig()
    return { ...cfg, apiKey: decryptSecret(cfg.apiKey) }
  }

  saveConfig(input: WebSearchConfig): WebSearchConfig {
    const stored: WebSearchConfig = {
      providerType: input.providerType,
      baseUrl: input.baseUrl || '',
      apiKey: input.apiKey ? encryptSecret(input.apiKey) : '',
      isActive: input.isActive !== false,
      limit: input.limit || 5,
    }
    const p = paths.userData('web-search.json')
    fs.mkdirSync(paths.userData(), { recursive: true })
    fs.writeFileSync(p, JSON.stringify(stored, null, 2), 'utf-8')
    return this.getConfigForUi()
  }

  async search(query: string, limit?: number): Promise<WebSearchResult> {
    const started = Date.now()
    try {
      if (!query?.trim()) throw new Error('查询不能为空')
      const cfg = this.loadConfig()
      if (!cfg.isActive) throw new Error('搜索已停用')
      const n = limit || cfg.limit || 5
      const key = decryptSecret(cfg.apiKey)
      const base = (cfg.baseUrl || '').replace(/\/+$/, '')

      let hits: WebSearchHit[] = []

      if (cfg.providerType === 'brave') {
        if (!key) throw new Error('Brave 需要 API Key')
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${n}`
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'X-Subscription-Token': key,
          },
        })
        if (!res.ok) throw new Error(`Brave HTTP ${res.status}`)
        const data = (await res.json()) as {
          web?: { results?: Array<{ title?: string; url?: string; description?: string }> }
        }
        hits = (data.web?.results || []).map((r) => ({
          title: r.title || '',
          url: r.url || '',
          snippet: r.description,
        }))
      } else if (cfg.providerType === 'tavily') {
        if (!key) throw new Error('Tavily 需要 API Key')
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            api_key: key,
            query,
            max_results: n,
          }),
        })
        if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`)
        const data = (await res.json()) as {
          results?: Array<{ title?: string; url?: string; content?: string }>
        }
        hits = (data.results || []).map((r) => ({
          title: r.title || '',
          url: r.url || '',
          snippet: r.content,
        }))
      } else {
        // searxng / custom — GET json
        const root = base || 'https://searx.be'
        const url = `${root}/search?q=${encodeURIComponent(query)}&format=json`
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'electron-react-template/1.0',
          },
        })
        if (!res.ok) throw new Error(`SearXNG HTTP ${res.status}`)
        const data = (await res.json()) as {
          results?: Array<{ title?: string; url?: string; content?: string }>
        }
        hits = (data.results || []).slice(0, n).map((r) => ({
          title: r.title || '',
          url: r.url || '',
          snippet: r.content,
        }))
      }

      return { ok: true, hits, latencyMs: Date.now() - started }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      log.warn('[web-search] failed', message)
      return { ok: false, hits: [], error: message, latencyMs: Date.now() - started }
    }
  }
}

export const webSearchService = new WebSearchService()
