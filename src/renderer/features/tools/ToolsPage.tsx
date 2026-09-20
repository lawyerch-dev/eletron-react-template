import { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2, RefreshCw, Search, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { docsService, embeddingService, envService, webSearchService } from '@/services'
import type { DocExtractResult, EnvStatus, WebSearchConfig, WebSearchHit } from '@ert/shared/types'

export function ToolsPage() {
  const { t } = useLanguage()

  // web search
  const [searchCfg, setSearchCfg] = useState<WebSearchConfig | null>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<WebSearchHit[]>([])
  const [searching, setSearching] = useState(false)

  // docs
  const [docResult, setDocResult] = useState<DocExtractResult | null>(null)
  const [docBusy, setDocBusy] = useState(false)

  // embedding
  const [embedText, setEmbedText] = useState('')
  const [embedBusy, setEmbedBusy] = useState(false)
  const [embedInfo, setEmbedInfo] = useState('')

  // env
  const [env, setEnv] = useState<EnvStatus | null>(null)
  const [envBusy, setEnvBusy] = useState(false)

  const refreshAll = useCallback(async () => {
    try {
      const [cfg, envStatus] = await Promise.all([
        webSearchService.getConfig(),
        envService.status(),
      ])
      setSearchCfg(cfg)
      setEnv(envStatus)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshAll()
  }, [refreshAll])

  const saveSearchCfg = async () => {
    if (!searchCfg) return
    try {
      setSearchCfg(await webSearchService.saveConfig(searchCfg))
      toast.success(t('tools.search_saved'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const runSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const result = await webSearchService.search(query.trim())
      if (!result.ok) {
        toast.error(result.error || t('tools.search_fail'))
        setHits([])
        return
      }
      setHits(result.hits)
      toast.success(t('tools.search_ok').replace('{n}', String(result.hits.length)))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSearching(false)
    }
  }

  const pickDoc = async () => {
    setDocBusy(true)
    try {
      const result = await docsService.pickAndExtract()
      if (result.cancelled) return
      setDocResult(result)
      if (!result.ok) toast.error(result.error || t('tools.doc_fail'))
      else toast.success(t('tools.doc_ok'))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setDocBusy(false)
    }
  }

  const runEmbed = async () => {
    if (!embedText.trim()) {
      toast.error(t('tools.embed_need_text'))
      return
    }
    setEmbedBusy(true)
    setEmbedInfo('')
    try {
      const result = await embeddingService.embed([embedText.trim()])
      if (!result.ok) {
        toast.error(result.error || t('tools.embed_fail'))
        setEmbedInfo(result.error || '')
        return
      }
      setEmbedInfo(
        `${t('tools.embed_ok')} · dim=${result.dimensions} · ${result.modelId || ''} · ${result.latencyMs || 0}ms`,
      )
      toast.success(t('tools.embed_ok'))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEmbedBusy(false)
    }
  }

  const refreshEnv = async () => {
    setEnvBusy(true)
    try {
      setEnv(await envService.status())
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEnvBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <Wrench className="h-6 w-6 text-accent" />
          {t('tools.title')}
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">{t('tools.subtitle')}</p>
      </header>

      {/* Web Search */}
      <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
        <div className="text-sm font-medium text-foreground">{t('tools.search')}</div>
        {searchCfg && (
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={searchCfg.providerType}
              onChange={(e) =>
                setSearchCfg({
                  ...searchCfg,
                  providerType: e.target.value as WebSearchConfig['providerType'],
                })
              }
              className="rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="searxng">SearXNG</option>
              <option value="brave">Brave</option>
              <option value="tavily">Tavily</option>
              <option value="custom">Custom</option>
            </select>
            <input
              value={searchCfg.baseUrl || ''}
              onChange={(e) => setSearchCfg({ ...searchCfg, baseUrl: e.target.value })}
              placeholder="https://searx.be"
              className="rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
            <input
              type="password"
              value={searchCfg.apiKey || ''}
              onChange={(e) => setSearchCfg({ ...searchCfg, apiKey: e.target.value })}
              placeholder={t('tools.api_key')}
              className="rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void saveSearchCfg()}
            className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
          >
            {t('tools.save_cfg')}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runSearch()
            }}
            placeholder={t('tools.search_ph')}
            className="flex-1 rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching}
            className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-1 inline h-4 w-4" />
            )}
            {t('tools.search_run')}
          </button>
        </div>
        <div className="space-y-2">
          {hits.map((h, i) => (
            <div key={i} className="rounded-xl border border-border-default px-3 py-2">
              <a
                href={h.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-accent hover:underline"
              >
                {h.title}
              </a>
              <p className="mt-0.5 truncate text-xs text-foreground-muted">{h.url}</p>
              {h.snippet && (
                <p className="mt-1 line-clamp-2 text-xs text-foreground-secondary">{h.snippet}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Docs */}
      <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">{t('tools.docs')}</div>
          <button
            type="button"
            onClick={() => void pickDoc()}
            disabled={docBusy}
            className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            {docBusy ? (
              <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-1 inline h-4 w-4" />
            )}
            {t('tools.docs_pick')}
          </button>
        </div>
        <p className="text-xs text-foreground-muted">{t('tools.docs_hint')}</p>
        {docResult && (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border-default bg-background p-3 text-xs text-foreground">
            {docResult.ok
              ? `# ${docResult.path}\n# ${docResult.format} · ${docResult.sizeBytes ?? 0} bytes${docResult.truncated ? ' · truncated' : ''}\n\n${docResult.text || ''}`
              : docResult.error}
          </pre>
        )}
      </section>

      {/* Embedding */}
      <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
        <div className="text-sm font-medium text-foreground">{t('tools.embed')}</div>
        <p className="text-xs text-foreground-muted">{t('tools.embed_hint')}</p>
        <textarea
          value={embedText}
          onChange={(e) => setEmbedText(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => void runEmbed()}
          disabled={embedBusy}
          className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {embedBusy && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
          {t('tools.embed_run')}
        </button>
        {embedInfo && <p className="text-xs text-foreground-secondary">{embedInfo}</p>}
      </section>

      {/* Env */}
      <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">{t('tools.env')}</div>
          <button
            type="button"
            onClick={() => void refreshEnv()}
            disabled={envBusy}
            className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            {envBusy ? (
              <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 inline h-4 w-4" />
            )}
            {t('tools.env_refresh')}
          </button>
        </div>
        <p className="text-xs text-foreground-muted">{t('tools.env_hint')}</p>
        {env && (
          <div className="space-y-1">
            {env.tools.map((tool) => (
              <div
                key={tool.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-default px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      tool.available ? 'bg-emerald-500' : 'bg-zinc-400'
                    }`}
                  />
                  <span className="font-mono text-foreground">{tool.id}</span>
                  {tool.note && <span className="text-xs text-foreground-muted">{tool.note}</span>}
                </div>
                <span className="truncate font-mono text-xs text-foreground-secondary">
                  {tool.version || (tool.available ? '' : t('tools.env_missing'))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
