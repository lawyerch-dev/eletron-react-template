import { pluginDb } from '../store'

const GITHUB_REPO = 'ZToolsCenter/ZTools-plugins'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`
const GITHUB_RELEASES = `https://github.com/${GITHUB_REPO}/releases/download`

const CACHE_TTL_MS = 5 * 60 * 1000
let marketCache: { data: MarketPlugin[]; categories: MarketCategory[]; timestamp: number } | null =
  null

export interface MarketPlugin {
  name: string
  version: string
  title?: string
  description?: string
  logo?: string
  author?: string
  homepage?: string
  size?: number
  downloadCount?: number
  updatedAt?: number
  publishedAt?: number
  categoryId?: number | null
  categoryTitle?: string
  downloadUrl?: string
  [key: string]: unknown
}

export interface PluginMarketResult {
  success: boolean
  data?: MarketPlugin[]
  categories?: MarketCategory[]
  storefront?: unknown
  error?: string
}

export interface MarketCategory {
  id: number
  key: string
  title: string
  description?: string
  icon?: string
  plugins: MarketPlugin[]
}

// categories.json 中每个分类的原始结构
interface RawCategory {
  key: string
  title: string
  description?: string
  icon?: string
  list: string[]
}

const RECOMMEND_LIMIT = 12

class PluginMarket {
  async fetchPluginMarket(): Promise<PluginMarketResult> {
    if (marketCache && Date.now() - marketCache.timestamp < CACHE_TTL_MS) {
      return { success: true, data: marketCache.data, categories: marketCache.categories }
    }

    try {
      const tag = await this.fetchLatestTag()
      const [plugins, rawCategories] = await Promise.all([
        this.fetchJson<MarketPlugin[]>(`${GITHUB_RELEASES}/${tag}/plugins.json`),
        this.fetchJson<RawCategory[]>(`${GITHUB_RELEASES}/${tag}/categories.json`),
      ])

      const byName = new Map<string, MarketPlugin>()
      for (const p of plugins) {
        if (p?.name) byName.set(p.name, p)
      }

      const categories: MarketCategory[] = rawCategories.map((cat, i) => ({
        id: i + 1,
        key: cat.key,
        title: cat.title,
        description: cat.description,
        icon: cat.icon,
        plugins: cat.list.map((name) => byName.get(name)).filter(Boolean) as MarketPlugin[],
      }))

      pluginDb.dbPut('plugin-market-data', plugins)
      pluginDb.dbPut('plugin-market-categories', categories)
      marketCache = { data: plugins, categories, timestamp: Date.now() }

      return { success: true, data: plugins, categories }
    } catch (error) {
      const cached = pluginDb.dbGet('plugin-market-data')
      const cachedCategories = pluginDb.dbGet('plugin-market-categories')
      if (Array.isArray(cached)) {
        return {
          success: true,
          data: cached as MarketPlugin[],
          categories: Array.isArray(cachedCategories) ? (cachedCategories as MarketCategory[]) : [],
        }
      }
      return { success: false, error: error instanceof Error ? error.message : '获取失败' }
    }
  }

  async fetchRecommendations(limit = RECOMMEND_LIMIT): Promise<MarketPlugin[]> {
    try {
      const tag = await this.fetchLatestTag()
      const plugins = await this.fetchJson<MarketPlugin[]>(`${GITHUB_RELEASES}/${tag}/plugins.json`)
      // 随机取 N 个
      const shuffled = [...plugins].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, limit).filter((p) => !!p?.name)
    } catch {
      return []
    }
  }

  clearCache(): void {
    marketCache = null
  }

  async resolveDownloadUrl(plugin: { name: string; downloadUrl?: string }): Promise<string> {
    if (typeof plugin?.downloadUrl === 'string' && plugin.downloadUrl.trim()) {
      return plugin.downloadUrl.trim()
    }
    // plugins.json 里每个插件自带 downloadUrl，正常不会走到这里
    return ''
  }

  async fetchReadme(
    pluginName: string,
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/plugins/${pluginName}/README.md`
      const response = await fetch(url)
      if (!response.ok) return { success: false, error: '暂无详情' }
      const content = await response.text()
      if (!content) return { success: false, error: '暂无详情' }
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '加载失败' }
    }
  }

  private async fetchLatestTag(): Promise<string> {
    const resp = await fetch(`${GITHUB_API}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
    if (!resp.ok) throw new Error(`GitHub API ${resp.status}`)
    const data = (await resp.json()) as { tag_name?: string }
    if (!data.tag_name) throw new Error('无法获取最新版本')
    return data.tag_name
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`下载失败: ${resp.status}`)
    return (await resp.json()) as T
  }
}

export const pluginMarket = new PluginMarket()
