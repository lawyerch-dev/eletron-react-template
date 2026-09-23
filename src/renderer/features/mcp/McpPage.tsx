import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  ChevronDown,
  ChevronRight,
  Loader2,
  Package,
  Play,
  Plus,
  RefreshCw,
  Search,
  Store,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { mcpService } from '@/services'
import type { McpServerConfig, McpServerPreset, McpServerStatus } from '@ert/shared/types'
import { Badge, Btn, inputCls, textareaCls } from '@/shell/ui'

type McpSection = 'servers' | 'builtin' | 'market'

/**
 * MCP 页 — 布局对齐 Cherry 使用习惯（结构学习，非资源复制）：
 * 左：MCP 服务器 / 发现（内置服务器、市场）
 * 右：服务器列表（状态点 · 名称 · 版本位 · 徽章 · 开关）+「添加」菜单
 */
export function McpPage() {
  const { t } = useLanguage()
  const [section, setSection] = useState<McpSection>('servers')
  const [servers, setServers] = useState<McpServerStatus[]>([])
  const [presets, setPresets] = useState<McpServerPreset[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState(false)
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [argsJson, setArgsJson] = useState('{}')
  const [callResult, setCallResult] = useState('')
  const [importJson, setImportJson] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!openMenu) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openMenu])

  const serverIds = new Set(servers.map((s) => s.id))

  const filteredServers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return servers
    return servers.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }, [servers, search])

  const filteredPresets = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return presets
    return presets.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
  }, [presets, search])

  const toggleActive = (s: McpServerStatus) => {
    setBusyId(s.id)
    void mcpService
      .setActive(s.id, !s.isActive)
      .then(() => refresh())
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setBusyId(null))
  }

  const addPreset = (presetId: string) => {
    setBusyId('preset:' + presetId)
    void mcpService
      .addPreset(presetId)
      .then(() => {
        toast.success(t('mcp.preset_added'))
        setSection('servers')
        return refresh()
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setBusyId(null))
  }

  const callTool = (serverId: string, toolName: string) => {
    setBusyId(serverId + toolName)
    setCallResult('')
    void mcpService
      .callTool(serverId, toolName, argsJson.trim() ? safeParse(argsJson) : {})
      .then((result) => {
        setCallResult(JSON.stringify(result, null, 2))
        if (!result.ok) toast.error(result.error || t('mcp.call_failed'))
      })
      .catch((e) => {
        setCallResult((e as Error).message)
        toast.error((e as Error).message)
      })
      .finally(() => setBusyId(null))
  }

  const importFromJson = () => {
    try {
      const parsed = JSON.parse(importJson) as Record<string, unknown>
      // 支持 { mcpServers: { id: config } } 或顶层数组
      let list: McpServerConfig[] = []
      if (Array.isArray(parsed)) {
        list = parsed as McpServerConfig[]
      } else {
        const bag =
          (parsed.mcpServers as Record<string, Partial<McpServerConfig>>) ||
          (parsed.servers as Record<string, Partial<McpServerConfig>>) ||
          {}
        list = Object.entries(bag).map(([id, cfg]) => ({
          id,
          name: cfg.name || id,
          type: (cfg.type as McpServerConfig['type']) || 'stdio',
          command: cfg.command,
          args: cfg.args,
          env: cfg.env,
          baseUrl: cfg.baseUrl,
          headers: cfg.headers,
          isActive: cfg.isActive !== false,
          installSource: 'manual',
        }))
      }
      if (!list.length) throw new Error('未解析到服务器')
      void mcpService
        .saveServers(list)
        .then(() => {
          toast.success(t('mcp.import_ok'))
          setShowImport(false)
          setImportJson('')
          setSection('servers')
          return refresh()
        })
        .catch((e) => toast.error((e as Error).message))
    } catch (e) {
      toast.error((e as Error).message || t('mcp.bad_json'))
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2.5rem)] max-w-5xl flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border-default bg-surface">
        {/* ── 左：MCP 分区导航 ── */}
        <div className="flex w-[220px] shrink-0 flex-col border-r border-border-default bg-surface-2/30">
          <div className="border-b border-border-default px-4 py-3">
            <div className="text-[15px] font-semibold text-foreground">{t('mcp.title')}</div>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => setSection('servers')}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition ${
                section === 'servers'
                  ? 'bg-surface font-medium text-foreground shadow-sm ring-1 ring-border-default'
                  : 'text-foreground-secondary hover:bg-surface-hover'
              }`}
            >
              <Package className="h-4 w-4" />
              {t('mcp.nav.servers')}
            </button>

            <div className="mb-1 mt-3 px-2.5 text-[11px] font-medium text-foreground-muted">
              {t('mcp.nav.discover')}
            </div>
            <button
              type="button"
              onClick={() => setSection('builtin')}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition ${
                section === 'builtin'
                  ? 'bg-surface font-medium text-foreground shadow-sm ring-1 ring-border-default'
                  : 'text-foreground-secondary hover:bg-surface-hover'
              }`}
            >
              <Box className="h-4 w-4" />
              {t('mcp.nav.builtin')}
            </button>
            <button
              type="button"
              onClick={() => setSection('market')}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition ${
                section === 'market'
                  ? 'bg-surface font-medium text-foreground shadow-sm ring-1 ring-border-default'
                  : 'text-foreground-secondary hover:bg-surface-hover'
              }`}
            >
              <Store className="h-4 w-4" />
              {t('mcp.nav.market')}
            </button>

            <div className="mb-1 mt-3 px-2.5 text-[11px] font-medium text-foreground-muted">
              {t('mcp.nav.providers')}
            </div>
            <div className="px-2.5 py-1 text-[12px] text-foreground-muted">
              {t('mcp.nav.providers_hint')}
            </div>
          </nav>
        </div>

        {/* ── 右：列表 ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 头部：标题 + 搜索 + 添加 */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border-default px-4 py-3">
            <h1 className="text-[15px] font-semibold text-foreground">
              {section === 'servers'
                ? t('mcp.nav.servers')
                : section === 'builtin'
                  ? t('mcp.nav.builtin')
                  : t('mcp.nav.market')}
            </h1>
            <div className="relative ml-2 w-48">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
              <input
                className={`${inputCls} !py-1.5 pl-8 !text-[12px]`}
                placeholder={t('mcp.search_ph')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Btn className="!py-1" onClick={() => void refresh()} title={t('mcp.refresh')}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Btn>

              {/* + 添加 菜单 */}
              <div className="relative" ref={menuRef}>
                <Btn variant="primary" onClick={() => setOpenMenu((v) => !v)}>
                  <Plus className="h-3.5 w-3.5" />
                  {t('mcp.add')}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Btn>
                {openMenu && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border-default bg-surface py-1 shadow-lg">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-hover"
                      onClick={() => {
                        setOpenMenu(false)
                        setShowQuick(true)
                        setShowImport(false)
                        setSection('servers')
                      }}
                    >
                      {t('mcp.menu.quick')}
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-hover"
                      onClick={() => {
                        setOpenMenu(false)
                        setShowImport(true)
                        setShowQuick(false)
                        setSection('servers')
                      }}
                    >
                      {t('mcp.menu.import_json')}
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[13px] text-foreground-muted"
                      disabled
                      title={t('mcp.menu.coming_soon')}
                    >
                      {t('mcp.menu.import_dxt')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 快速创建 / JSON 导入 */}
          {showQuick && section === 'servers' && (
            <div className="border-b border-border-default bg-surface-2/40 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground">
                  {t('mcp.menu.quick')}
                </span>
                <Btn className="!px-2 !py-0.5" onClick={() => setShowQuick(false)}>
                  <X className="h-3 w-3" />
                </Btn>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.slice(0, 8).map((p) => (
                  <Btn
                    key={p.id}
                    disabled={serverIds.has(p.id) || busyId === 'preset:' + p.id}
                    onClick={() => addPreset(p.id)}
                  >
                    {busyId === 'preset:' + p.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    {p.name}
                    {serverIds.has(p.id) ? ` · ${t('mcp.added')}` : ''}
                  </Btn>
                ))}
              </div>
            </div>
          )}

          {showImport && section === 'servers' && (
            <div className="border-b border-border-default bg-surface-2/40 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground">
                  {t('mcp.menu.import_json')}
                </span>
                <Btn className="!px-2 !py-0.5" onClick={() => setShowImport(false)}>
                  <X className="h-3 w-3" />
                </Btn>
              </div>
              <textarea
                className={`${textareaCls} mb-2`}
                rows={4}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={t('mcp.import_ph')}
              />
              <Btn variant="primary" onClick={importFromJson}>
                {t('mcp.import_do')}
              </Btn>
            </div>
          )}

          {/* 列表主体 */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {section === 'market' ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <Store className="h-8 w-8 text-foreground-muted" />
                <p className="text-[13px] text-foreground-muted">{t('mcp.market_hint')}</p>
                <Btn onClick={() => setSection('builtin')}>{t('mcp.nav.builtin')}</Btn>
              </div>
            ) : section === 'builtin' ? (
              filteredPresets.map((p) => {
                const added = serverIds.has(p.id)
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 border-b border-border-default px-4 py-3 last:border-b-0"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        p.readyToRun ? 'bg-success' : 'bg-foreground-muted/35'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {p.name}
                        </span>
                        <Badge tone="neutral">{p.type}</Badge>
                        {p.readyToRun ? (
                          <Badge tone="success">{t('mcp.ready')}</Badge>
                        ) : (
                          <Badge tone="warning">{t('mcp.need_key')}</Badge>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-foreground-muted">{p.description}</p>
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-[12px] text-foreground-muted">
                      —
                    </span>
                    <Btn
                      disabled={added || busyId === 'preset:' + p.id}
                      onClick={() => addPreset(p.id)}
                    >
                      {busyId === 'preset:' + p.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {added ? t('mcp.added') : t('mcp.install')}
                    </Btn>
                  </div>
                )
              })
            ) : filteredServers.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-foreground-muted">
                {t('mcp.empty')}
              </div>
            ) : (
              filteredServers.map((s) => {
                const open = openRow === s.id
                return (
                  <div key={s.id} className="border-b border-border-default last:border-b-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        className="shrink-0 text-foreground-muted"
                        onClick={() => setOpenRow(open ? null : s.id)}
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          s.connected ? 'bg-success' : 'bg-foreground-muted/35'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-foreground">
                          {s.name}
                        </div>
                      </div>
                      <span className="w-16 shrink-0 text-right font-mono text-[12px] text-foreground-muted">
                        {s.tools.length ? `${s.tools.length} tools` : '—'}
                      </span>
                      <Badge tone={s.type === 'inMemory' ? 'neutral' : 'accent'}>
                        {s.type === 'inMemory' ? t('mcp.badge_builtin') : s.type}
                      </Badge>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.isActive}
                        disabled={busyId === s.id}
                        onClick={() => void toggleActive(s)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          s.isActive ? 'bg-success' : 'bg-foreground-muted/30'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                            s.isActive ? 'left-[22px]' : 'left-0.5'
                          } ${busyId === s.id ? 'opacity-60' : ''}`}
                        />
                      </button>
                    </div>

                    {open && (
                      <div className="border-t border-border-default bg-surface-2/40 px-4 py-3">
                        {s.description && (
                          <p className="mb-2 text-[12px] text-foreground-secondary">
                            {s.description}
                          </p>
                        )}
                        <div className="mb-2 font-mono text-[11px] text-foreground-muted">
                          {s.command}
                        </div>
                        {s.error && <p className="mb-2 text-[12px] text-danger">{s.error}</p>}

                        {s.tools.length > 0 && (
                          <div className="mb-2 overflow-hidden rounded-lg border border-border-default bg-surface">
                            {s.tools.map((tool) => (
                              <div
                                key={tool.id}
                                className="flex items-center justify-between gap-2 border-b border-border-default px-3 py-2 last:border-b-0"
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
                                  onClick={() => callTool(s.id, tool.name)}
                                >
                                  {busyId === s.id + tool.name ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                  {t('mcp.call')}
                                </Btn>
                              </div>
                            ))}
                          </div>
                        )}

                        <textarea
                          className={`${textareaCls} mb-2 !text-[11px]`}
                          rows={2}
                          value={argsJson}
                          onChange={(e) => setArgsJson(e.target.value)}
                          placeholder={t('mcp.args')}
                        />
                        {callResult && (
                          <pre className="max-h-40 overflow-auto rounded-lg bg-background p-2 font-mono text-[11px] text-foreground-secondary">
                            {callResult}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function safeParse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error('bad json')
  }
}
