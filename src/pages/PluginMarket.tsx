import { useEffect, useMemo, useState, useCallback } from 'react'
import { Search, RefreshCw, Boxes, Download, Loader2, AlertTriangle, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import { PluginDetailModal, type PluginDetailData } from '@/components/plugin/PluginDetailModal'
import { ImportPluginButton } from '@/components/plugin/ImportPluginButton'
import { PluginLogo } from '@/components/plugin/PluginLogo'

/** 简易插值：t('key', { count: 3 }) → 替换 {count} */
type Vars = Record<string, string | number>

// eslint-disable-next-line react-refresh/only-export-components
export function formatT(raw: string, vars?: Vars): string {
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : ''))
}

/** 本地 file:// 走 plugin-icon://；远程 http(s) 走 market-icon:// 代理（修正 content-type） */
// eslint-disable-next-line react-refresh/only-export-components
export function logoUrl(url: string | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return `market-icon://proxy/${encodeURIComponent(url)}`
  return url.replace(/^file:\/\//, 'plugin-icon://')
}

interface PluginItem {
  name: string
  version: string
  title?: string
  description?: string
  logo?: string
  author?: string
  homepage?: string
  [key: string]: unknown
}

type DownloadState = Record<
  string,
  'downloading' | 'installing' | 'success' | 'error' | 'cancelled'
>

export function PluginMarket() {
  const { t } = useLanguage()
  const [plugins, setPlugins] = useState<PluginItem[]>([])
  const [categories, setCategories] = useState<MarketCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [installed, setInstalled] = useState<InstalledPluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [pulling, setPulling] = useState(false)
  const [downloads, setDownloads] = useState<DownloadState>({})
  const [detailPlugin, setDetailPlugin] = useState<PluginDetailData | null>(null)

  const installedNames = useMemo(() => new Set(installed.map((p) => p.name)), [installed])

  const refreshInstalled = async () => {
    try {
      const list = await window.plugin.listInstalled()
      setInstalled(list)
    } catch {
      // ignore
    }
  }

  const fetchMarket = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const result = await window.plugin.marketList()
      if (result.success) {
        setPlugins(result.data || [])
        setCategories(result.categories || [])
      } else {
        setError(result.error || t('market.failed'))
      }
    } catch {
      setError(t('market.failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMarket()
    void refreshInstalled()
    const unsubChanged = window.plugin.onPluginsChanged(() => {
      void refreshInstalled()
    })
    const unsubProgress = window.plugin.onDownloadProgress((payload) => {
      setDownloads((prev) => ({
        ...prev,
        [payload.pluginName]: payload.status as DownloadState[string],
      }))
      if (payload.status === 'success') {
        toast.success(formatT(t('market.toast.installed'), { title: payload.pluginName }))
        void refreshInstalled()
      } else if (payload.status === 'error') {
        toast.error(payload.error || t('market.error'))
      }
    })
    return () => {
      unsubChanged()
      unsubProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const install = async (plugin: { name: string; downloadUrl?: string }) => {
    if (installedNames.has(plugin.name)) return
    setDownloads((prev) => ({ ...prev, [plugin.name]: 'downloading' }))
    const result = await window.plugin.installFromMarket({
      name: plugin.name,
      downloadUrl: plugin.downloadUrl,
    })
    if (!result.success) {
      setDownloads((prev) => ({ ...prev, [plugin.name]: 'error' }))
      toast.error(result.error || t('market.error'))
    }
    await refreshInstalled()
  }

  const filtered = useMemo(() => {
    let result = plugins
    if (selectedCategory !== null) {
      const cat = categories.find((c) => c.id === selectedCategory)
      if (cat) {
        const catNames = new Set(cat.plugins.map((p) => p.name))
        result = result.filter((p) => catNames.has(p.name))
      }
    }
    const kw = keyword.trim().toLowerCase()
    if (!kw) return result
    return result.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(kw) ||
        (p.name || '').toLowerCase().includes(kw) ||
        (p.description || '').toLowerCase().includes(kw) ||
        (p.author || '').toLowerCase().includes(kw),
    )
  }, [plugins, keyword, selectedCategory, categories])

  const stateFor = (name: string) => downloads[name]
  const installingNames = new Set(
    Object.keys(downloads).filter(
      (k) => downloads[k] === 'downloading' || downloads[k] === 'installing',
    ),
  )

  const categoryTitle = useCallback(
    (pluginName: string): string | undefined => {
      for (const cat of categories) {
        if (cat.plugins.some((p) => p.name === pluginName)) return cat.title
      }
      return undefined
    },
    [categories],
  )

  return (
    <div className="flex h-full flex-col">
      {/* 固定头部：标题 / 搜索 / 分类 —— 提高层级，避免下方滚动卡片的 backdrop-blur 盖住 */}
      <div className="relative z-10 shrink-0 bg-background">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('market.title')}
            </h1>
            <span className="text-sm text-foreground-muted">
              （{formatT(t('myplugins.count'), { count: installed.length })} / 全部解决方案{' '}
              {plugins.length} 个）
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ImportPluginButton onSuccess={refreshInstalled} />
            <button
              onClick={() => {
                setPulling(true)
                window.plugin.marketClearCache().then(() => {
                  void fetchMarket(true).finally(() => setPulling(false))
                })
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:border-accent/50 hover:text-accent"
            >
              <RefreshCw className={`h-4 w-4 ${pulling ? 'animate-spin' : ''}`} />
              {t('market.refresh')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative my-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('market.search')}
            className="w-full rounded-2xl border border-border-default bg-surface py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent/50 focus:outline-none"
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface-hover text-foreground-secondary hover:bg-surface-hover/80'
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-surface-hover text-foreground-secondary hover:bg-surface-hover/80'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content — only this area scrolls */}
      <div className="min-h-0 flex-1 overflow-y-auto pt-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-foreground-muted">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-3 text-sm">{t('market.loading')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-foreground-muted">
            <AlertTriangle className="h-10 w-10 text-accent" />
            <p className="mt-3 text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-foreground-muted">
            <Boxes className="h-10 w-10" />
            <p className="mt-3 text-sm">{t('market.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((plugin) => {
              const isInstalled = installedNames.has(plugin.name)
              const state = stateFor(plugin.name)
              const isDownloading = installingNames.has(plugin.name)
              return (
                <div
                  key={plugin.name}
                  className="group relative flex flex-col rounded-2xl border border-border-default bg-surface/90 p-5 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.5)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.5)] cursor-pointer"
                  onClick={() =>
                    setDetailPlugin({
                      name: plugin.name,
                      title: plugin.title,
                      version: plugin.version,
                      description: plugin.description,
                      author: plugin.author,
                      homepage: plugin.homepage,
                      logo: plugin.logo,
                      downloadUrl: plugin.downloadUrl as string | undefined,
                      downloadCount: plugin.downloadCount as number | undefined,
                      installed: installedNames.has(plugin.name),
                    })
                  }
                >
                  {/* 分类标签 - 右上角 */}
                  {(() => {
                    const cat = categoryTitle(plugin.name)
                    return cat ? (
                      <span className="absolute right-3 top-3 rounded-md bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
                        {cat}
                      </span>
                    ) : null
                  })()}

                  <div className="flex items-start gap-4">
                    <PluginLogo logo={plugin.logo} size="sm" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {plugin.title || plugin.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-foreground-muted">
                        {plugin.author ? `${t('market.author')}: ${plugin.author}` : plugin.name}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-foreground-secondary">
                    {plugin.description || '—'}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-foreground-muted">
                      v{plugin.version}
                      {plugin.downloadCount != null && (
                        <> · {Number(plugin.downloadCount).toLocaleString()} 次下载</>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailPlugin({
                            name: plugin.name,
                            title: plugin.title,
                            version: plugin.version,
                            description: plugin.description,
                            author: plugin.author,
                            homepage: plugin.homepage,
                            logo: plugin.logo,
                            downloadUrl: plugin.downloadUrl as string | undefined,
                            downloadCount: plugin.downloadCount as number | undefined,
                            installed: installedNames.has(plugin.name),
                          })
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border-default px-2 py-1 text-[11px] font-medium text-foreground-muted transition-colors hover:bg-surface-hover"
                      >
                        {t('market.detail')}
                      </button>
                      {isInstalled ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const p = installed.find((i) => i.name === plugin.name)
                            if (p) window.plugin.launch(p.path)
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground transition-colors hover:opacity-90"
                        >
                          <Play className="h-3 w-3" />
                          {t('market.launch')}
                        </button>
                      ) : isDownloading || state === 'success' ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-1 rounded-md bg-surface-hover px-2 py-1 text-[11px] font-medium text-foreground-muted"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {state === 'installing'
                            ? t('market.installing')
                            : t('market.downloading')}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            void install(plugin)
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground transition-colors hover:opacity-90"
                        >
                          <Download className="h-3 w-3" />
                          {t('market.install')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PluginDetailModal
        plugin={detailPlugin || { name: '' }}
        open={detailPlugin !== null}
        onClose={() => setDetailPlugin(null)}
        onInstall={() => {
          if (detailPlugin) install(detailPlugin)
        }}
        onLaunch={(p) => {
          void window.plugin.launch(p.path || '')
        }}
      />
    </div>
  )
}

export default PluginMarket
