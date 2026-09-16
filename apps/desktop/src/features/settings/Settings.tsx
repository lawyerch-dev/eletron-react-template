import { useState, useRef } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, Copy, Download, Trash2 } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { LogViewer, type LogViewerHandle } from '@/features/settings/log-viewer'

export function Settings() {
  const { t } = useLanguage()
  const [logExpanded, setLogExpanded] = useState(true)
  const [logCount, setLogCount] = useState('0/0')
  const logRef = useRef<LogViewerHandle>(null)

  const handleRefresh = () => logRef.current?.refresh()
  const handleCopy = () => logRef.current?.copySelected()
  const handleExport = () => logRef.current?.exportLogs()
  const handleClear = () => logRef.current?.clearLogs()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('settings.title')}</h2>
        <p className="mt-1 text-sm text-foreground-muted">{t('settings.desc')}</p>
      </div>

      {/* 应用日志（可折叠） */}
      <section className="space-y-4">
        {/* 折叠标题栏 + 操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogExpanded((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted transition hover:text-foreground"
          >
            {logExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{t('log.title')}</span>
          </button>

          <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
            {logCount}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="rounded-lg bg-surface-hover p-1.5 text-foreground-muted transition hover:bg-border-default hover:text-foreground active:scale-95"
              title={t('log.refresh')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className="rounded-lg bg-surface-hover p-1.5 text-foreground-muted transition hover:bg-border-default hover:text-foreground active:scale-95"
              title={t('log.copy')}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleExport}
              className="rounded-lg bg-surface-hover p-1.5 text-foreground-muted transition hover:bg-border-default hover:text-foreground active:scale-95"
              title={t('log.export')}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg bg-surface-hover p-1.5 text-foreground-muted transition hover:bg-red-500/10 hover:text-red-500 active:scale-95"
              title={t('log.clear')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {logExpanded && <LogViewer ref={logRef} onCountChange={setLogCount} />}
      </section>
    </div>
  )
}
