/**
 * 顶栏：窗口 chrome + 右侧主题/语言快捷切换。
 * 页面主标题由 PageShell 承担，此处不重复展示，避免双标题。
 */
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/contexts/ThemeContext'
import { useLanguage } from '@/app/contexts/LanguageContext'

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  return (
    <header className="flex h-12 shrink-0 items-center justify-end border-b border-border-default bg-surface px-3">
      <div className="flex items-center gap-1">
        {[
          { value: 'light' as const, icon: Sun, label: t('theme.light') },
          { value: 'dark' as const, icon: Moon, label: t('theme.dark') },
          { value: 'system' as const, icon: Monitor, label: t('theme.system') },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            className={`rounded-md p-1.5 transition-colors ${
              theme === value
                ? 'bg-accent-subtle text-accent'
                : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <span className="mx-1 h-3.5 w-px bg-border-default" />
        {[
          { value: 'zh-CN' as const, short: '中' },
          { value: 'en-US' as const, short: 'EN' },
        ].map(({ value, short }) => (
          <button
            key={value}
            onClick={() => setLanguage(value)}
            title={value}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              language === value
                ? 'bg-accent-subtle text-accent'
                : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {short}
          </button>
        ))}
      </div>
    </header>
  )
}
