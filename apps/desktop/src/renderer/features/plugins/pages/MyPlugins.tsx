import { useEffect, useMemo, useState } from 'react'
import { Boxes, Play, Square, Trash2, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import {
  PluginDetailModal,
  type PluginDetailData,
} from '@/features/plugins/components/PluginDetailModal'
import { ImportPluginButton } from '@/features/plugins/components/ImportPluginButton'
import { PluginLogo } from '@/features/plugins/components/PluginLogo'
import { formatT } from '@shared/utils/plugin'
import { pluginService } from '@/services'

type RunningInfo = { name: string; path: string; running: boolean }

export function MyPlugins() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [plugins, setPlugins] = useState<InstalledPluginInfo[]>([])
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [detailPlugin, setDetailPlugin] = useState<PluginDetailData | null>(null)

  const refresh = async () => {
    try {
      const [list, runList] = await Promise.all([
        pluginService.listInstalled(),
        pluginService.runningPlugins(),
      ])
      setPlugins(list)
      const map: Record<string, boolean> = {}
      ;(runList as RunningInfo[]).forEach((r) => {
        map[r.name] = r.running
      })
      setRunning(map)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 首屏加载本机已装插件列表（数据拉取，非同步副作用）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    const unsubChanged = pluginService.onPluginsChanged(() => void refresh())
    return () => {
      unsubChanged()
    }
  }, [])

  const launch = async (plugin: InstalledPluginInfo) => {
    const result = await pluginService.launch(plugin.path)
    if (!result.success) {
      toast.error(result.error || t('market.launch.failed'))
    }
    void refresh()
  }

  const stop = async (plugin: InstalledPluginInfo) => {
    await pluginService.closePlugin(plugin.path)
    void refresh()
  }

  const uninstall = async (plugin: InstalledPluginInfo) => {
    if (window.confirm(formatT(t('myplugins.uninstall.confirm'), { title: plugin.title }))) {
      const result = await pluginService.deletePlugin(plugin.path)
      if (result.success) {
        toast.success(formatT(t('market.uninstall.success'), { title: plugin.title }))
        void refresh()
      } else {
        toast.error(result.error || t('market.error'))
      }
    }
  }

  const isRunning = (plugin: InstalledPluginInfo) => running[plugin.name]

  const sorted = useMemo(
    () =>
      [...plugins].sort((a, b) => {
        const ra = isRunning(a) ? 1 : 0
        const rb = isRunning(b) ? 1 : 0
        return rb - ra
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plugins, running],
  )

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('myplugins.title')}
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              {formatT(t('myplugins.count'), { count: plugins.length })}
            </p>
          </div>
          <ImportPluginButton onSuccess={refresh} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-foreground-muted">
            <Boxes className="h-10 w-10" />
            <p className="mt-3 text-sm">{t('common.loading')}</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-border-default bg-surface/50 py-24 text-foreground-muted">
            <Boxes className="h-12 w-12" />
            <p className="mt-4 text-sm">{t('myplugins.empty')}</p>
            <button
              onClick={() => navigate('/plugin-market')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface px-4 py-2 text-sm font-medium text-accent transition-colors hover:border-accent/50"
            >
              <Store className="h-4 w-4" />
              {t('myplugins.empty.cta')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((plugin) => {
              const runningNow = isRunning(plugin)
              return (
                <div
                  key={plugin.path}
                  className="group flex items-center gap-4 rounded-2xl border border-border-default bg-surface/90 p-4 shadow-[0_12px_24px_-28px_rgba(15,23,42,0.5)] backdrop-blur transition-all hover:border-accent/40 cursor-pointer"
                  onClick={() =>
                    setDetailPlugin({
                      name: plugin.name,
                      title: plugin.title,
                      version: plugin.version,
                      description: plugin.description,
                      author: plugin.author,
                      homepage: plugin.homepage,
                      logo: plugin.logo,
                      downloadUrl: plugin.downloadUrl,
                      downloadCount: plugin.downloadCount,
                      path: plugin.path,
                      installed: true,
                      isBuiltin: plugin.isBuiltin,
                    })
                  }
                >
                  <PluginLogo logo={plugin.logo} size="sm" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {plugin.title}
                      </h3>
                      {plugin.isBuiltin && (
                        <span className="shrink-0 rounded-md border border-border-default bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted">
                          {t('myplugins.builtin')}
                        </span>
                      )}
                      <span className="shrink-0 text-xs text-foreground-muted">
                        {formatT(t('myplugins.version'), { version: plugin.version })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-foreground-secondary">
                      {plugin.description ||
                        (plugin.author
                          ? `${t('myplugins.author')}: ${plugin.author}`
                          : plugin.name)}
                    </p>
                  </div>

                  {/* 运行状态 */}
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      runningNow
                        ? 'bg-accent-subtle text-accent'
                        : 'bg-surface-hover text-foreground-muted'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${runningNow ? 'animate-pulse bg-accent' : 'bg-foreground-muted'}`}
                    />
                    {runningNow ? t('myplugins.running') : t('myplugins.not-running')}
                  </span>

                  {/* 操作 */}
                  <div className="flex shrink-0 items-center gap-1">
                    {runningNow ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void stop(plugin)
                        }}
                        title={t('myplugins.stop')}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-accent"
                      >
                        <Square className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('myplugins.stop')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void launch(plugin)
                        }}
                        title={t('market.launch')}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-subtle"
                      >
                        <Play className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('market.launch')}</span>
                      </button>
                    )}
                    {!plugin.isBuiltin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void uninstall(plugin)
                        }}
                        title={t('market.uninstall')}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('market.uninstall')}</span>
                      </button>
                    )}
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
        onLaunch={(p) => {
          void pluginService.launch(p.path || '')
        }}
        onUninstall={async (p) => {
          if (p.path) {
            const result = await pluginService.deletePlugin(p.path)
            if (result.success) {
              toast.success(t('market.uninstall'))
              void refresh()
            } else {
              toast.error(result.error || t('market.error'))
            }
          }
        }}
      />
    </>
  )
}

export default MyPlugins
