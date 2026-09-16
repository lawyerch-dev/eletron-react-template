import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Search, Terminal, Monitor, Puzzle, MousePointer2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'

const MAX_LOG_ENTRIES = 2000

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose'
type LogSource = 'main' | 'renderer' | 'plugin'

const LEVEL_CONFIG: Record<LogLevel, { badge: string; text: string; dot: string; label: string }> =
  {
    error: {
      badge: 'bg-red-500/15 text-red-500 border-red-500/30',
      text: 'text-red-400',
      dot: 'bg-red-500',
      label: 'ERROR',
    },
    warn: {
      badge: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-500',
      label: 'WARN',
    },
    info: {
      badge: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      text: 'text-foreground-secondary',
      dot: 'bg-blue-500',
      label: 'INFO',
    },
    debug: {
      badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      text: 'text-foreground-muted',
      dot: 'bg-slate-400',
      label: 'DEBUG',
    },
    verbose: {
      badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      text: 'text-foreground-muted/60',
      dot: 'bg-zinc-400',
      label: 'VERB',
    },
  }

const SOURCE_CONFIG: Record<LogSource, { badge: string; icon: React.ReactNode }> = {
  main: {
    badge: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
    icon: <Terminal className="h-3 w-3" />,
  },
  renderer: {
    badge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: <Monitor className="h-3 w-3" />,
  },
  plugin: {
    badge: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
    icon: <Puzzle className="h-3 w-3" />,
  },
}

const LEVELS: LogLevel[] = ['error', 'warn', 'info', 'debug', 'verbose']
const SOURCES: LogSource[] = ['main', 'renderer', 'plugin']

export interface LogViewerHandle {
  refresh: () => Promise<void>
  copySelected: () => Promise<void>
  exportLogs: () => void
  clearLogs: () => Promise<void>
}

interface LogViewerProps {
  onCountChange?: (count: string) => void
}

export const LogViewer = forwardRef<LogViewerHandle, LogViewerProps>(function LogViewer(
  { onCountChange },
  ref,
) {
  const { t } = useLanguage()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logPath, setLogPath] = useState('')
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all')
  const [filterSource, setFilterSource] = useState<LogSource | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showLevelMenu, setShowLevelMenu] = useState(false)
  const [showSourceMenu, setShowSourceMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  // 初始加载 + 实时流
  useEffect(() => {
    window.ipcRenderer.invoke('get-logs').then((entries: LogEntry[]) => {
      if (Array.isArray(entries) && entries.length > 0) {
        setLogs(entries)
      }
    })
    window.ipcRenderer.invoke('get-log-path').then((p: string) => {
      if (typeof p === 'string') setLogPath(p)
    })

    const unsub = window.logEvents.onLogEntry((entry) => {
      setLogs((prev) => {
        const next = [...prev, entry]
        if (next.length > MAX_LOG_ENTRIES) {
          return next.slice(next.length - MAX_LOG_ENTRIES)
        }
        return next
      })
    })

    return unsub
  }, [])

  // 自动滚动
  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    autoScrollRef.current = atBottom
  }, [])

  // 过滤
  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        if (filterLevel !== 'all' && log.level !== filterLevel) return false
        if (filterSource !== 'all' && log.source !== filterSource) return false
        if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false
        return true
      }),
    [logs, filterLevel, filterSource, search],
  )

  // 统计
  const counts = useMemo(() => {
    const level: Record<string, number> = {}
    const source: Record<string, number> = {}
    for (const l of logs) {
      level[l.level] = (level[l.level] || 0) + 1
      source[l.source] = (source[l.source] || 0) + 1
    }
    return { level, source }
  }, [logs])

  // 通知外部计数变化
  useEffect(() => {
    onCountChange?.(`${filteredLogs.length}/${logs.length}`)
  }, [filteredLogs.length, logs.length, onCountChange])

  // 暴露给父组件的方法
  const refresh = useCallback(async () => {
    const entries = await window.ipcRenderer.invoke('get-logs')
    if (Array.isArray(entries)) setLogs(entries)
    toast.success(t('log.refreshed'))
  }, [t])

  const copySelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      const text = filteredLogs.map((l) => l.message).join('\n')
      await navigator.clipboard.writeText(text)
      toast.success(t('log.copied'))
      return
    }
    const text = filteredLogs
      .filter((l) => selectedIds.has(l.id))
      .map((l) => l.message)
      .join('\n')
    await navigator.clipboard.writeText(text)
    toast.success(t('log.copied'))
  }, [selectedIds, filteredLogs, t])

  const exportLogs = useCallback(() => {
    const text = filteredLogs.map((l) => l.message).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('log.exported'))
  }, [filteredLogs, t])

  const clearLogs = useCallback(async () => {
    await window.ipcRenderer.invoke('log:clear')
    setLogs([])
    setSelectedIds(new Set())
    toast.success(t('log.cleared'))
  }, [t])

  useImperativeHandle(ref, () => ({ refresh, copySelected, exportLogs, clearLogs }), [
    refresh,
    copySelected,
    exportLogs,
    clearLogs,
  ])

  // 选择逻辑
  const handleSelect = useCallback(
    (id: number, event: React.MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
        setLastClickedId(id)
      } else if (event.shiftKey && lastClickedId !== null) {
        const allIds = filteredLogs.map((l) => l.id)
        const startIdx = allIds.indexOf(lastClickedId)
        const endIdx = allIds.indexOf(id)
        if (startIdx !== -1 && endIdx !== -1) {
          const [min, max] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
          const range = new Set(allIds.slice(min, max + 1))
          setSelectedIds(range)
        }
      } else {
        setSelectedIds(new Set([id]))
        setLastClickedId(id)
      }
    },
    [lastClickedId, filteredLogs],
  )

  // 键盘快捷键 Ctrl+C
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.size > 0) {
        e.preventDefault()
        copySelected()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [copySelected, selectedIds])

  const selectedCount = selectedIds.size

  const clearSelection = () => {
    setSelectedIds(new Set())
    setLastClickedId(null)
  }

  return (
    <div className="space-y-3">
      {/* 筛选栏 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('log.search')}
            className="w-full rounded-lg border border-border-default bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {/* 级别筛选 */}
        <div className="relative">
          <button
            onClick={() => setShowLevelMenu((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground-secondary transition hover:border-accent/50"
          >
            <span
              className={`h-2 w-2 rounded-full ${filterLevel === 'all' ? 'bg-foreground-muted' : LEVEL_CONFIG[filterLevel as LogLevel].dot}`}
            />
            {filterLevel === 'all' ? t('log.allLevels') : LEVEL_CONFIG[filterLevel].label}
          </button>
          {showLevelMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-border-default bg-surface shadow-lg">
              {(['all', ...LEVELS] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setFilterLevel(level)
                    setShowLevelMenu(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-surface-hover ${
                    filterLevel === level ? 'text-accent' : 'text-foreground-secondary'
                  }`}
                >
                  <span>{level === 'all' ? t('log.allLevels') : LEVEL_CONFIG[level].label}</span>
                  {level !== 'all' && (
                    <span className="text-xs text-foreground-muted">
                      {counts.level[level] || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 来源筛选 */}
        <div className="relative">
          <button
            onClick={() => setShowSourceMenu((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground-secondary transition hover:border-accent/50"
          >
            {filterSource === 'all' ? (
              <>
                <Terminal className="h-3.5 w-3.5" />
                <span>全部来源</span>
              </>
            ) : (
              <>
                {SOURCE_CONFIG[filterSource].icon}
                <span className="capitalize">{filterSource}</span>
              </>
            )}
          </button>
          {showSourceMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-border-default bg-surface shadow-lg">
              {(['all', ...SOURCES] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => {
                    setFilterSource(source)
                    setShowSourceMenu(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-surface-hover ${
                    filterSource === source ? 'text-accent' : 'text-foreground-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {source !== 'all' && SOURCE_CONFIG[source].icon}
                    <span className="capitalize">
                      {source === 'all' ? t('log.source.all') : t(`log.source.${source}`)}
                    </span>
                  </span>
                  {source !== 'all' && (
                    <span className="text-xs text-foreground-muted">
                      {counts.source[source] || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent">
            <MousePointer2 className="h-3 w-3" />
            {selectedCount} 条选中
            <button
              onClick={clearSelection}
              className="ml-1 rounded-full bg-accent/20 px-1 text-[10px] hover:bg-accent/30"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* 日志路径 */}
      {logPath && (
        <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-foreground-muted">
          <span className="truncate font-mono">{logPath}</span>
        </div>
      )}

      {/* 日志内容 */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-80 resize-y overflow-auto rounded-xl border border-border-default bg-surface [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground-muted/40 [&::-webkit-scrollbar-thumb:hover]:bg-foreground-muted/70 [&::-webkit-scrollbar-track]:bg-transparent"
        style={{ minHeight: '200px', maxHeight: '600px' }}
      >
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-border-default">
            {filteredLogs.map((log) => {
              const isSelected = selectedIds.has(log.id)
              const levelCfg = LEVEL_CONFIG[log.level]
              const sourceCfg = SOURCE_CONFIG[log.source]
              return (
                <div
                  key={log.id}
                  onClick={(e) => handleSelect(log.id, e)}
                  className={`flex cursor-pointer items-start gap-2 px-3 py-2 transition ${
                    isSelected ? 'bg-accent/10' : 'hover:bg-surface-hover'
                  }`}
                >
                  <div className="mt-1.5 flex w-3 shrink-0 items-center justify-center">
                    {isSelected ? (
                      <div className="h-2 w-2 rounded-sm bg-accent" />
                    ) : (
                      <div className={`h-2 w-2 rounded-full ${levelCfg.dot} opacity-40`} />
                    )}
                  </div>

                  <span
                    className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${levelCfg.badge}`}
                  >
                    {levelCfg.label}
                  </span>

                  <span
                    className={`mt-0.5 flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${sourceCfg.badge}`}
                  >
                    {sourceCfg.icon}
                    {log.source}
                  </span>

                  {log.timestamp && (
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] text-foreground-muted/70">
                      {log.timestamp}
                    </span>
                  )}

                  <span
                    className={`min-w-0 flex-1 break-all font-mono text-xs leading-6 ${levelCfg.text}`}
                  >
                    {log.message}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
            <Search className="mb-3 h-8 w-8 opacity-40" />
            <p className="text-sm">{t('log.empty')}</p>
          </div>
        )}
      </div>
    </div>
  )
})
