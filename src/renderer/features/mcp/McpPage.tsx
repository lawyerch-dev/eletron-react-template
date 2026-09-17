import { useCallback, useEffect, useState } from 'react'
import { Cable, Loader2, PackagePlus, Play, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { mcpService } from '@/services'
import type { McpServerPreset, McpServerStatus } from '@ert/shared/types'

export function McpPage() {
  const { t } = useLanguage()
  const [servers, setServers] = useState<McpServerStatus[]>([])
  const [presets, setPresets] = useState<McpServerPreset[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [callResult, setCallResult] = useState('')
  const [argsJson, setArgsJson] = useState('{}')

  const refresh = useCallback(async () => {
    try {
      const [list, presetList] = await Promise.all([
        mcpService.listServers(),
        mcpService.listPresets(),
      ])
      setServers(list)
      setPresets(presetList)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // 首屏加载（异步 IPC）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const toggleActive = async (s: McpServerStatus) => {
    setBusyId(s.id)
    try {
      await mcpService.setActive(s.id, !s.isActive)
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  const callTool = async (serverId: string, toolName: string) => {
    setBusyId(serverId + toolName)
    setCallResult('')
    try {
      let args: Record<string, unknown> = {}
      try {
        args = argsJson.trim() ? JSON.parse(argsJson) : {}
      } catch {
        toast.error(t('mcp.bad_json'))
        return
      }
      const result = await mcpService.callTool(serverId, toolName, args)
      setCallResult(JSON.stringify(result, null, 2))
      if (!result.ok) toast.error(result.error || t('mcp.call_failed'))
    } catch (e) {
      setCallResult((e as Error).message)
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const addPreset = async (presetId: string) => {
    setBusyId('preset:' + presetId)
    try {
      await mcpService.addPreset(presetId)
      toast.success(t('mcp.preset_added'))
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const connectedIds = new Set(servers.map((s) => s.id))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Cable className="h-6 w-6 text-accent" />
            {t('mcp.title')}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('mcp.subtitle')}</p>
          <p className="mt-1 text-xs text-foreground-muted">{t('mcp.config_hint')}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
        >
          <RefreshCw className="mr-1 inline h-4 w-4" />
          {t('mcp.refresh')}
        </button>
      </header>

      {presets.length > 0 && (
        <section className="rounded-2xl border border-border-default bg-surface p-4">
          <div className="mb-3 text-sm font-medium text-foreground">{t('mcp.presets')}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((p) => {
              const added = connectedIds.has(p.id)
              return (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-border-default px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-600">
                        {p.type}
                      </span>
                      {p.readyToRun ? (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-600">
                          {t('mcp.ready')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600">
                          {t('mcp.need_key')}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">
                      {p.description}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={added || busyId === 'preset:' + p.id}
                    onClick={() => void addPreset(p.id)}
                    className="shrink-0 rounded-lg border border-border-default px-2 py-1 text-xs hover:bg-surface-hover disabled:opacity-50"
                  >
                    {added ? (
                      t('mcp.added')
                    ) : (
                      <>
                        <PackagePlus className="mr-1 inline h-3 w-3" />
                        {t('mcp.add')}
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {servers.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border-default bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-600">
                    {s.type}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      s.connected
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-slate-500/15 text-slate-500'
                    }`}
                  >
                    {s.state}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-foreground-muted">{s.command}</div>
                {s.error && <div className="mt-1 text-xs text-red-500">{s.error}</div>}
                {s.logs.length > 0 && (
                  <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-background p-2 text-[10px] text-foreground-muted">
                    {s.logs
                      .slice(-8)
                      .map((l) => new Date(l.timestamp).toLocaleTimeString() + ' ' + l.message)
                      .join('\n')}
                  </pre>
                )}
              </div>
              <button
                type="button"
                disabled={busyId === s.id}
                onClick={() => void toggleActive(s)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium ${
                  s.isActive
                    ? 'border border-border-default text-foreground-secondary hover:bg-surface-hover'
                    : 'bg-accent text-accent-foreground hover:opacity-90'
                }`}
              >
                {busyId === s.id ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> : null}
                {s.isActive ? t('mcp.disconnect') : t('mcp.connect')}
              </button>
            </div>

            {s.tools.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-border-default pt-3">
                {s.tools.map((tool) => (
                  <div key={tool.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{tool.name}</div>
                      <div className="truncate font-mono text-[10px] text-foreground-muted">
                        {tool.id}
                      </div>
                      {tool.description && (
                        <div className="text-xs text-foreground-muted">{tool.description}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busyId === s.id + tool.name}
                      onClick={() => void callTool(s.id, tool.name)}
                      className="shrink-0 rounded-lg border border-border-default px-2 py-1 text-xs hover:bg-surface-hover"
                    >
                      <Play className="mr-1 inline h-3 w-3" />
                      {t('mcp.call')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border-default bg-surface p-4">
        <label className="mb-2 block text-sm font-medium text-foreground">{t('mcp.args')}</label>
        <textarea
          value={argsJson}
          onChange={(e) => setArgsJson(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-border-default bg-background px-3 py-2 font-mono text-sm text-foreground"
          spellCheck={false}
        />
        {callResult && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-background p-3 text-xs text-foreground-secondary">
            {callResult}
          </pre>
        )}
      </section>
    </div>
  )
}
