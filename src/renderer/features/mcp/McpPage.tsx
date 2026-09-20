import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, PackagePlus, Play, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { mcpService } from '@/services'
import type { McpServerPreset, McpServerStatus } from '@ert/shared/types'
import { Badge, Btn, EmptyState, PageShell, inputCls } from '@/shell/ui'

/** MCP：紧凑服务器卡片 + 展开工具 */
export function McpPage() {
  const { t } = useLanguage()
  const [servers, setServers] = useState<McpServerStatus[]>([])
  const [presets, setPresets] = useState<McpServerPreset[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [callResult, setCallResult] = useState('')
  const [argsJson, setArgsJson] = useState('{}')
  const [showPresets, setShowPresets] = useState(false)

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

  const connectedIds = new Set(servers.map((s) => s.id))

  return (
    <PageShell
      title={t('mcp.title')}
      description={t('mcp.subtitle')}
      hint={t('mcp.config_hint')}
      width="max-w-4xl"
      actions={
        <>
          <Btn onClick={() => setShowPresets((v) => !v)}>{t('mcp.presets')}</Btn>
          <Btn onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t('mcp.refresh')}
          </Btn>
        </>
      }
    >
      {showPresets && presets.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
          <div className="border-b border-border-default px-4 py-2.5 text-[12px] font-medium text-foreground-secondary">
            {t('mcp.presets')}
          </div>
          <div className="divide-y divide-border-default">
            {presets.map((p) => {
              const added = connectedIds.has(p.id)
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">{p.name}</span>
                      <Badge tone="accent">{p.type}</Badge>
                      <Badge tone={p.readyToRun ? 'success' : 'warning'}>
                        {p.readyToRun ? t('mcp.ready') : t('mcp.need_key')}
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-foreground-muted">{p.description}</p>
                  </div>
                  <Btn
                    disabled={added || busyId === 'preset:' + p.id}
                    onClick={async () => {
                      setBusyId('preset:' + p.id)
                      try {
                        await mcpService.addPreset(p.id)
                        toast.success(t('mcp.preset_added'))
                        await refresh()
                      } catch (e) {
                        toast.error((e as Error).message)
                      } finally {
                        setBusyId(null)
                      }
                    }}
                  >
                    {added ? t('mcp.added') : <PackagePlus className="h-3.5 w-3.5" />}
                    {!added && t('mcp.add')}
                  </Btn>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 服务器列表：状态点 + 紧凑行 */}
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
        {servers.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('mcp.empty')} />
          </div>
        ) : (
          servers.map((s) => {
            const open = expanded[s.id] ?? false
            return (
              <div key={s.id} className="border-b border-border-default last:border-b-0">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    className="shrink-0 text-foreground-muted hover:text-foreground"
                    onClick={() => setExpanded((prev) => ({ ...prev, [s.id]: !open }))}
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      s.connected ? 'bg-success' : 'bg-foreground-muted/40'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] font-medium text-foreground">{s.name}</span>
                      <Badge tone="accent">{s.type}</Badge>
                      <Badge tone={s.connected ? 'success' : 'neutral'}>{s.state}</Badge>
                      {s.tools.length > 0 && (
                        <span className="text-[11px] text-foreground-muted">
                          {s.tools.length} tools
                        </span>
                      )}
                    </div>
                    <div className="truncate font-mono text-[11px] text-foreground-muted">
                      {s.command}
                    </div>
                  </div>
                  <Btn
                    disabled={busyId === s.id}
                    onClick={() => void toggleActive(s)}
                    variant={s.isActive ? 'secondary' : 'primary'}
                  >
                    {busyId === s.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {s.isActive ? t('mcp.disconnect') : t('mcp.connect')}
                  </Btn>
                </div>

                {open && (
                  <div className="border-t border-border-default bg-surface-2/40 px-3 py-2">
                    {s.error && <p className="mb-2 text-[12px] text-danger">{s.error}</p>}
                    {s.tools.length > 0 ? (
                      <ul className="space-y-1">
                        {s.tools.map((tool) => (
                          <li
                            key={tool.id}
                            className="flex items-center justify-between gap-2 rounded-md bg-surface px-2.5 py-1.5"
                          >
                            <div className="min-w-0">
                              <div className="text-[12px] font-medium text-foreground">
                                {tool.name}
                              </div>
                              {tool.description && (
                                <div className="truncate text-[11px] text-foreground-muted">
                                  {tool.description}
                                </div>
                              )}
                            </div>
                            <Btn
                              disabled={busyId === s.id + tool.name}
                              onClick={() => void callTool(s.id, tool.name)}
                            >
                              <Play className="h-3 w-3" />
                              {t('mcp.call')}
                            </Btn>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12px] text-foreground-muted">—</p>
                    )}
                    {s.logs.length > 0 && (
                      <pre className="mt-2 max-h-20 overflow-auto rounded-md bg-background p-2 font-mono text-[10px] text-foreground-muted">
                        {s.logs
                          .slice(-6)
                          .map((l) => `${new Date(l.timestamp).toLocaleTimeString()} ${l.message}`)
                          .join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 调用台 */}
      <div className="rounded-xl border border-border-default bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-foreground-secondary">{t('mcp.args')}</span>
          {callResult && (
            <Btn variant="ghost" onClick={() => setCallResult('')}>
              Clear
            </Btn>
          )}
        </div>
        <textarea
          className={inputCls}
          value={argsJson}
          onChange={(e) => setArgsJson(e.target.value)}
          rows={3}
          spellCheck={false}
        />
        {callResult && (
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-surface-2 p-2.5 font-mono text-[11px] text-foreground-secondary">
            {callResult}
          </pre>
        )}
      </div>
    </PageShell>
  )
}
