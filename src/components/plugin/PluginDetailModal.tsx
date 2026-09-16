import { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import {
  X,
  Download,
  Play,
  Loader2,
  List,
  BookOpen,
  Trash2,
  User,
  Tag,
  BarChart3,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { PluginLogo } from './PluginLogo'
import { formatT, sanitizeHtml } from '@/utils/plugin'

export interface PluginDetailData {
  name: string
  title?: string
  version?: string
  description?: string
  author?: string
  homepage?: string
  logo?: string
  downloadUrl?: string
  downloadCount?: number
  path?: string
  features?: Array<{
    code: string
    explain?: string
    cmds: Array<string | { type: string; label: string }>
  }>
  installed?: boolean
  isBuiltin?: boolean
}

interface Props {
  plugin: PluginDetailData
  open: boolean
  onClose: () => void
  onInstall?: (plugin: PluginDetailData) => void
  onLaunch?: (plugin: PluginDetailData) => void
  onUninstall?: (plugin: PluginDetailData) => void
}

type Tab = 'detail' | 'commands'

export function PluginDetailModal({
  plugin,
  open,
  onClose,
  onInstall,
  onLaunch,
  onUninstall,
}: Props) {
  const { t } = useLanguage()
  const [tab, setTab] = useState<Tab>('detail')
  const [readme, setReadme] = useState('')
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [readmeError, setReadmeError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab('detail')
    setReadme('')
    setReadmeError('')
    if (plugin.name) {
      setReadmeLoading(true)
      window.plugin
        .marketReadme(plugin.name)
        .then((r) => {
          if (r.success && r.content) setReadme(r.content)
          else setReadmeError(r.error || t('market.error'))
        })
        .catch(() => setReadmeError(t('market.error')))
        .finally(() => setReadmeLoading(false))
    }
  }, [open, plugin.name, t])

  const renderedHtml = useMemo(() => {
    if (!readme) return ''
    return sanitizeHtml(marked.parse(readme, { async: false }) as string)
  }, [readme])

  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'detail', label: t('market.detail'), icon: BookOpen },
  ]
  if (plugin.features?.length) {
    tabs.push({ id: 'commands', label: t('market.commands'), icon: List })
  }

  const metaItems = [
    { icon: User, label: t('market.detail.author'), value: plugin.author || '—' },
    { icon: Tag, label: t('market.detail.version'), value: `v${plugin.version || '—'}` },
    {
      icon: BarChart3,
      label: t('market.detail.downloads'),
      value:
        plugin.downloadCount != null
          ? formatT(t('market.detail.downloads.value'), {
              count: plugin.downloadCount.toLocaleString(),
            })
          : '—',
    },
  ]

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlay}
    >
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border-default bg-surface shadow-2xl">
        {/* Header with large icon */}
        <div className="flex items-start gap-6 p-8 pb-0">
          <PluginLogo
            logo={plugin.logo}
            size="md"
            className="shadow-[0_4px_12px_-6px_rgba(0,0,0,0.3)]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {plugin.title || plugin.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  {plugin.description || '—'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-1 shrink-0 rounded-xl p-2 text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* App Store style meta row */}
        <div className="mx-8 mt-6 flex items-center divide-x divide-border-default rounded-2xl border border-border-default bg-surface-hover/30">
          {metaItems.map((item, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5 py-4">
              <item.icon className="h-4 w-4 text-foreground-muted" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                {item.label}
              </span>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-0 border-b border-border-default px-8">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === tabItem.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground-muted hover:text-foreground-secondary'
              }`}
            >
              <tabItem.icon className="h-4 w-4" />
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-6">
          {tab === 'detail' && (
            <div className="space-y-6">
              {readmeLoading ? (
                <div className="flex items-center justify-center py-16 text-foreground-muted">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : readmeError ? (
                <p className="text-sm text-foreground-muted">{readmeError}</p>
              ) : renderedHtml ? (
                <div
                  className="prose prose-sm max-w-none text-foreground-secondary prose-headings:text-foreground prose-a:text-accent prose-code:rounded prose-code:bg-surface-hover prose-code:px-1.5 prose-code:py-0.5 prose-pre:bg-surface-hover prose-pre:border prose-pre:border-border-default prose-pre:text-foreground prose-img:rounded-2xl prose-img:border prose-img:border-border-default leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <p className="text-sm text-foreground-muted">{t('market.detail.no-readme')}</p>
              )}
            </div>
          )}
          {tab === 'commands' && plugin.features && (
            <div className="space-y-4">
              {plugin.features.map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border-default bg-surface-hover/30 p-5 transition-colors hover:bg-surface-hover/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{f.code}</div>
                      {f.explain && (
                        <p className="mt-0.5 text-xs text-foreground-muted">{f.explain}</p>
                      )}
                    </div>
                  </div>
                  {f.cmds?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pl-10">
                      {f.cmds.map((cmd, j) => {
                        const label = typeof cmd === 'string' ? cmd : cmd.label || cmd.type
                        return (
                          <span
                            key={j}
                            className="rounded-full border border-border-default bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground-secondary"
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border-default px-8 py-5">
          {plugin.installed ? (
            <>
              <button
                onClick={() => {
                  onLaunch?.(plugin)
                  onClose()
                }}
                className="inline-flex items-center gap-2.5 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)] transition-all hover:opacity-90 active:scale-[0.97]"
              >
                <Play className="h-4 w-4" />
                {t('market.launch')}
              </button>
              {onUninstall && !plugin.isBuiltin && (
                <button
                  onClick={() => onUninstall(plugin)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border-default px-5 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:border-red-500/50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('market.uninstall')}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => {
                onInstall?.(plugin)
                onClose()
              }}
              className="inline-flex items-center gap-2.5 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)] transition-all hover:opacity-90 active:scale-[0.97]"
            >
              <Download className="h-4 w-4" />
              {t('market.install')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
