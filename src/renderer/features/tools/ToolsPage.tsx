import { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { docsService, embeddingService, envService, webSearchService } from '@/services'
import type { DocExtractResult, EnvStatus, WebSearchConfig, WebSearchHit } from '@ert/shared/types'
import { Badge, Btn, PageShell, SectionCard, inputCls } from '@/shell/ui'

export function ToolsPage() {
  const { t } = useLanguage()

  const [searchCfg, setSearchCfg] = useState<WebSearchConfig | null>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<WebSearchHit[]>([])
  const [searching, setSearching] = useState(false)

  const [docResult, setDocResult] = useState<DocExtractResult | null>(null)
  const [docBusy, setDocBusy] = useState(false)

  const [embedText, setEmbedText] = useState('')
  const [embedBusy, setEmbedBusy] = useState(false)
  const [embedInfo, setEmbedInfo] = useState('')

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

  return (
    <PageShell title={t('tools.title')} description={t('tools.subtitle')} width="max-w-4xl">
      <SectionCard
        title={t('tools.search')}
        actions={
          <>
            <Btn
              onClick={() => {
                if (!searchCfg) return
                void webSearchService
                  .saveConfig(searchCfg)
                  .then((c) => {
                    setSearchCfg(c)
                    toast.success(t('tools.search_saved'))
                  })
                  .catch((e) => toast.error((e as Error).message))
              }}
            >
              {t('tools.save_cfg')}
            </Btn>
            <Btn
              variant="primary"
              disabled={searching}
              onClick={() => {
                if (!query.trim()) return
                setSearching(true)
                void webSearchService
                  .search(query.trim())
                  .then((result) => {
                    if (!result.ok) {
                      toast.error(result.error || t('tools.search_fail'))
                      setHits([])
                      return
                    }
                    setHits(result.hits)
                    toast.success(t('tools.search_ok').replace('{n}', String(result.hits.length)))
                  })
                  .catch((e) => toast.error((e as Error).message))
                  .finally(() => setSearching(false))
              }}
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              {t('tools.search_run')}
            </Btn>
          </>
        }
      >
        {searchCfg && (
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <select
              className={inputCls}
              value={searchCfg.providerType}
              onChange={(e) =>
                setSearchCfg({
                  ...searchCfg,
                  providerType: e.target.value as WebSearchConfig['providerType'],
                })
              }
            >
              <option value="searxng">SearXNG</option>
              <option value="brave">Brave</option>
              <option value="tavily">Tavily</option>
              <option value="custom">Custom</option>
            </select>
            <input
              className={inputCls}
              value={searchCfg.baseUrl || ''}
              placeholder="https://searx.be"
              onChange={(e) => setSearchCfg({ ...searchCfg, baseUrl: e.target.value })}
            />
            <input
              className={inputCls}
              type="password"
              value={searchCfg.apiKey || ''}
              placeholder={t('tools.api_key')}
              onChange={(e) => setSearchCfg({ ...searchCfg, apiKey: e.target.value })}
            />
          </div>
        )}
        <input
          className={inputCls}
          value={query}
          placeholder={t('tools.search_ph')}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !searching && query.trim()) {
              setSearching(true)
              void webSearchService
                .search(query.trim())
                .then((r) => setHits(r.ok ? r.hits : []))
                .finally(() => setSearching(false))
            }
          }}
        />
        {hits.length > 0 && (
          <ul className="mt-3 divide-y divide-border-default">
            {hits.map((h, i) => (
              <li key={i} className="py-2.5">
                <a
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-medium text-accent hover:underline"
                >
                  {h.title}
                </a>
                <p className="mt-0.5 truncate text-[11px] text-foreground-muted">{h.url}</p>
                {h.snippet && (
                  <p className="mt-1 line-clamp-2 text-xs text-foreground-secondary">{h.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title={t('tools.docs')}
        description={t('tools.docs_hint')}
        actions={
          <Btn
            disabled={docBusy}
            onClick={() => {
              setDocBusy(true)
              void docsService
                .pickAndExtract()
                .then((result) => {
                  if (result.cancelled) return
                  setDocResult(result)
                  if (!result.ok) toast.error(result.error || t('tools.doc_fail'))
                  else toast.success(t('tools.doc_ok'))
                })
                .catch((e) => toast.error((e as Error).message))
                .finally(() => setDocBusy(false))
            }}
          >
            {docBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            {t('tools.docs_pick')}
          </Btn>
        }
      >
        {docResult ? (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border-default bg-surface-2 p-3 text-[12px] text-foreground">
            {docResult.ok
              ? `# ${docResult.path}\n# ${docResult.format} · ${docResult.sizeBytes ?? 0}B${docResult.truncated ? ' · truncated' : ''}\n\n${docResult.text || ''}`
              : docResult.error}
          </pre>
        ) : (
          <p className="text-xs text-foreground-muted">—</p>
        )}
      </SectionCard>

      <SectionCard
        title={t('tools.embed')}
        description={t('tools.embed_hint')}
        actions={
          <Btn
            variant="primary"
            disabled={embedBusy}
            onClick={() => {
              if (!embedText.trim()) {
                toast.error(t('tools.embed_need_text'))
                return
              }
              setEmbedBusy(true)
              setEmbedInfo('')
              void embeddingService
                .embed([embedText.trim()])
                .then((result) => {
                  if (!result.ok) {
                    toast.error(result.error || t('tools.embed_fail'))
                    setEmbedInfo(result.error || '')
                    return
                  }
                  setEmbedInfo(
                    `${t('tools.embed_ok')} · dim=${result.dimensions} · ${result.modelId || ''} · ${result.latencyMs || 0}ms`,
                  )
                  toast.success(t('tools.embed_ok'))
                })
                .catch((e) => toast.error((e as Error).message))
                .finally(() => setEmbedBusy(false))
            }}
          >
            {embedBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('tools.embed_run')}
          </Btn>
        }
      >
        <textarea
          className={inputCls}
          rows={3}
          value={embedText}
          onChange={(e) => setEmbedText(e.target.value)}
        />
        {embedInfo && <p className="mt-2 text-xs text-foreground-secondary">{embedInfo}</p>}
      </SectionCard>

      <SectionCard
        title={t('tools.env')}
        description={t('tools.env_hint')}
        actions={
          <Btn
            disabled={envBusy}
            onClick={() => {
              setEnvBusy(true)
              void envService
                .status()
                .then(setEnv)
                .catch((e) => toast.error((e as Error).message))
                .finally(() => setEnvBusy(false))
            }}
          >
            {envBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t('tools.env_refresh')}
          </Btn>
        }
        padded={false}
      >
        {env?.tools.map((tool) => (
          <div
            key={tool.id}
            className="flex items-center justify-between border-b border-border-default px-4 py-2.5 last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <Badge tone={tool.available ? 'success' : 'neutral'}>
                {tool.available ? 'OK' : '—'}
              </Badge>
              <span className="font-mono text-[13px] text-foreground">{tool.id}</span>
              {tool.note && <span className="text-[11px] text-foreground-muted">{tool.note}</span>}
            </div>
            <span className="truncate font-mono text-[11px] text-foreground-secondary">
              {tool.version || (!tool.available ? t('tools.env_missing') : '')}
            </span>
          </div>
        ))}
      </SectionCard>
    </PageShell>
  )
}
