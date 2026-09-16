import { pluginDb } from '../store'

/**
 * 插件市场仓库配置。
 * 仓库以「清单 + 源码目录」模式维护插件：
 * - 根目录 manifest.json：列出全部插件（name/version/title/logo/downloadUrl 等）
 * - plugins/<name>/：每个插件的源码目录（plugin.json、index.html、README.md ...）
 */
const GITHUB_OWNER = 'lawyerch-dev'
const GITHUB_REPO_NAME = 'cc-ai-tools-plugins'
const GITHUB_REPO = `${GITHUB_OWNER}/${GITHUB_REPO_NAME}`
const GITHUB_BRANCH = 'main'
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`
const GITHUB_ARCHIVE = `https://github.com/${GITHUB_REPO}/archive/refs/heads/${GITHUB_BRANCH}.zip`
const MANIFEST_URL = `${GITHUB_RAW}/manifest.json`

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

// manifest.json 中插件项的原始结构
interface RawManifestPlugin {
  name: string
  version: string
  title?: string
  description?: string
  author?: string
  homepage?: string
  logo?: string
  downloadUrl?: string
  [key: string]: unknown
}

// manifest.json 顶层结构
interface RawManifest {
  plugins: RawManifestPlugin[]
  categories?: RawCategory[]
}

// categories.json 中每个分类的原始结构（manifest 模式可选）
interface RawCategory {
  key: string
  title: string
  description?: string
  icon?: string
  list: string[]
}

/** 安装所需的下载源：url 为压缩包地址；subDir 存在时表示需要从压缩包中提取该子目录 */
export interface MarketDownloadSource {
  url: string
  subDir?: string
}

const RECOMMEND_LIMIT = 12

/** 将仓库内相对路径解析为可直接访问的绝对 URL（logo 等静态资源） */
function resolveRepoUrl(relative: string): string {
  const trimmed = relative.replace(/^\.?\//, '')
  return `${GITHUB_RAW}/${trimmed}`
}

/** 判断字符串是否为完整 URL */
function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

class PluginMarket {
  /**
   * 拉取市场清单（manifest.json），映射为插件列表与分类。
   * manifest 模式没有独立分类文件时，categories 返回空数组，前端自动隐藏分类栏。
   */
  async fetchPluginMarket(): Promise<PluginMarketResult> {
    if (marketCache && Date.now() - marketCache.timestamp < CACHE_TTL_MS) {
      return { success: true, data: marketCache.data, categories: marketCache.categories }
    }

    try {
      const manifest = await this.fetchJson<RawManifest>(MANIFEST_URL)
      const rawPlugins = Array.isArray(manifest?.plugins) ? manifest.plugins : []
      const byName = new Map<string, MarketPlugin>()

      const plugins: MarketPlugin[] = rawPlugins
        .map((p) => {
          if (!p?.name) return null
          // ...p 放前面，避免覆盖后面已解析的 logo / downloadUrl
          const plugin: MarketPlugin = {
            ...p,
            name: p.name,
            version: p.version || '未知',
            title: p.title,
            description: p.description,
            author: p.author,
            homepage: p.homepage,
            logo: p.logo ? (isAbsoluteUrl(p.logo) ? p.logo : resolveRepoUrl(p.logo)) : undefined,
            // 保留仓库相对路径（plugins/<name>），供安装时定位压缩包内子目录
            downloadUrl: p.downloadUrl || `src/plugins/${p.name}`,
          }
          byName.set(plugin.name, plugin)
          return plugin
        })
        .filter((p): p is MarketPlugin => p !== null)

      // 分类：若 manifest 附带 categories 字段则解析，否则返回空数组
      const rawCategories = manifest?.categories as RawCategory[] | undefined
      const categories: MarketCategory[] = Array.isArray(rawCategories)
        ? rawCategories.map((cat, i) => ({
            id: i + 1,
            key: cat.key,
            title: cat.title,
            description: cat.description,
            icon: cat.icon,
            plugins: cat.list.map((name) => byName.get(name)).filter(Boolean) as MarketPlugin[],
          }))
        : []

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
      const manifest = await this.fetchJson<RawManifest>(MANIFEST_URL)
      const plugins = (Array.isArray(manifest?.plugins) ? manifest.plugins : [])
        .filter((p) => !!p?.name)
        .map((p) => ({
          name: p.name,
          version: p.version || '未知',
          title: p.title,
          description: p.description,
          author: p.author,
          homepage: p.homepage,
          logo: p.logo ? (isAbsoluteUrl(p.logo) ? p.logo : resolveRepoUrl(p.logo)) : undefined,
        }))
      // 随机取 N 个
      const shuffled = [...plugins].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, limit)
    } catch {
      return []
    }
  }

  clearCache(): void {
    marketCache = null
    pluginDb.dbRemove('plugin-market-data')
    pluginDb.dbRemove('plugin-market-categories')
  }

  /**
   * 解析插件的下载源。
   * - downloadUrl 为 .zip/.zpx 完整地址时：直接返回该地址（兼容历史 release 模式）
   * - downloadUrl 为仓库相对目录（如 plugins/<name>）时：返回仓库归档地址 + 待提取子目录
   * 仅传 name 时（前端只发 name），从缓存/持久化的市场数据中按名称回填。
   */
  async resolveDownloadSource(plugin: {
    name: string
    downloadUrl?: string
  }): Promise<MarketDownloadSource | null> {
    const name = typeof plugin?.name === 'string' ? plugin.name : ''
    if (!name) return null

    let raw = typeof plugin?.downloadUrl === 'string' ? plugin.downloadUrl : ''
    if (!raw) {
      const entry = this.findCached(name)
      raw = entry?.downloadUrl || ''
    }
    if (!raw) return null

    const trimmed = raw.trim()
    if (isAbsoluteUrl(trimmed) && /\.(zip|zpx)(\?|$)/i.test(trimmed)) {
      return { url: trimmed }
    }
    // 相对目录：指向仓库归档 + 子目录
    const subDir = trimmed.replace(/^\.?\//, '').replace(/\/+$/, '')
    return { url: GITHUB_ARCHIVE, subDir }
  }

  /** 从内存缓存或持久化存储中按名称查找插件 */
  private findCached(name: string): MarketPlugin | undefined {
    const entry = marketCache?.data.find((p) => p.name === name)
    if (entry) return entry
    const cached = pluginDb.dbGet('plugin-market-data')
    if (Array.isArray(cached)) {
      return (cached as MarketPlugin[]).find((p) => p.name === name)
    }
    return undefined
  }

  async fetchReadme(
    pluginName: string,
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      // 编码插件名，防止路径注入
      const safeName = encodeURIComponent(pluginName)
      const url = `${GITHUB_RAW}/plugins/${safeName}/README.md`
      const response = await fetch(url)
      if (!response.ok) return { success: false, error: '暂无详情' }
      const content = await response.text()
      if (!content) return { success: false, error: '暂无详情' }
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '加载失败' }
    }
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`下载失败: ${resp.status}`)
    return (await resp.json()) as T
  }
}

export const pluginMarket = new PluginMarket()
