import { useState, useRef } from 'react'
import { RefreshCw, Copy, Download, Trash2 } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { LogViewer, type LogViewerHandle } from '@/features/settings/log-viewer'
import { Badge } from '@/shell/ui'

type SettingsSection = 'general' | 'logs' | 'about'

/**
 * 设置：Cherry 风格双栏。
 * 主题 / 语言切换固定在侧栏底部，此处只放系统项。
 */
export function Settings() {
  const { t } = useLanguage()
  const [section, setSection] = useState<SettingsSection>('general')
  const [logCount, setLogCount] = useState('0/0')
  const logRef = useRef<LogViewerHandle>(null)

  const nav: Array<{ id: SettingsSection; label: string }> = [
    { id: 'general', label: t('settings.nav.general') },
    { id: 'logs', label: t('settings.nav.logs') },
    { id: 'about', label: t('settings.nav.about') },
  ]

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-4xl overflow-hidden rounded-xl border border-border-default bg-surface">
      <nav className="w-[180px] shrink-0 border-r border-border-default bg-surface-2/40 p-2">
        <div className="mb-2 px-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          {t('settings.title')}
        </div>
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={`mb-0.5 flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
              section === item.id
                ? 'bg-accent-subtle font-medium text-accent'
                : 'text-foreground-secondary hover:bg-surface-hover'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto">
        {section === 'general' && (
          <div className="p-5">
            <h2 className="text-[16px] font-semibold text-foreground">
              {t('settings.nav.general')}
            </h2>
            <p className="mt-0.5 text-[12px] text-foreground-muted">{t('settings.desc')}</p>

            <div className="mt-5 space-y-0 overflow-hidden rounded-lg border border-border-default">
              <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
                <div>
                  <div className="text-[13px] font-medium text-foreground">
                    {t('settings.appearance')}
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    {t('settings.appearance_hint')}
                  </div>
                </div>
                <span className="text-[12px] text-foreground-muted">
                  {t('settings.appearance_loc')}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-[13px] font-medium text-foreground">
                    {t('settings.caps')}
                  </div>
                  <div className="text-[11px] text-foreground-muted">{t('settings.caps_hint')}</div>
                </div>
                <Badge tone="accent">@ert/shared</Badge>
              </div>
            </div>
          </div>
        )}

        {section === 'logs' && (
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-foreground">{t('log.title')}</h2>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-foreground-muted">
                {logCount}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  title={t('log.refresh')}
                  onClick={() => logRef.current?.refresh()}
                  className="rounded-md p-1.5 text-foreground-muted transition hover:bg-surface-hover hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title={t('log.copy')}
                  onClick={() => logRef.current?.copySelected()}
                  className="rounded-md p-1.5 text-foreground-muted transition hover:bg-surface-hover hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title={t('log.export')}
                  onClick={() => logRef.current?.exportLogs()}
                  className="rounded-md p-1.5 text-foreground-muted transition hover:bg-surface-hover hover:text-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title={t('log.clear')}
                  onClick={() => logRef.current?.clearLogs()}
                  className="rounded-md p-1.5 text-foreground-muted transition hover:bg-surface-hover hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border-default">
              <LogViewer ref={logRef} onCountChange={setLogCount} />
            </div>
          </div>
        )}

        {section === 'about' && (
          <div className="p-5">
            <h2 className="text-[16px] font-semibold text-foreground">{t('settings.nav.about')}</h2>
            <div className="mt-4 space-y-2 rounded-lg border border-border-default px-4 py-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Template</span>
                <span className="text-foreground">electron-react-template</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Stack</span>
                <span className="text-foreground">Electron · React · Vite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Capabilities</span>
                <span className="font-mono text-[12px] text-foreground">
                  models / prompts / skills / mcp / ocr / agent
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
