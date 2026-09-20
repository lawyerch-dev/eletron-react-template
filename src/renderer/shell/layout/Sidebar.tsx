import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  Settings,
  Info,
  Store,
  Package,
  ScanText,
  Cable,
  Cpu,
  BookMarked,
  Puzzle,
  Wrench,
  Bot,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useTheme } from '@/app/contexts/ThemeContext'
import { getCapabilityNavItems } from '@/capabilities'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const ICONS: Record<string, LucideIcon> = {
  store: Store,
  package: Package,
  scan: ScanText,
  cable: Cable,
  cpu: Cpu,
  book: BookMarked,
  puzzle: Puzzle,
  wrench: Wrench,
  bot: Bot,
}

type NavItem = { to: string; icon: LucideIcon; label: string; group: NavGroup }

type NavGroup = 'main' | 'ai' | 'tools' | 'system'

const GROUP_ORDER: NavGroup[] = ['main', 'ai', 'tools', 'system']

/** 侧栏：导航分组 + 底部固定主题/语言 + 折叠 */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const capabilityNav = getCapabilityNavItems()

  const groupOf = (to: string): NavGroup => {
    if (to === '/' || to === '/agent') return 'main'
    if (to === '/tools') return 'tools'
    if (to === '/settings' || to === '/about') return 'system'
    return 'ai'
  }

  const navItems: NavItem[] = [
    { to: '/', icon: Home, label: t('sidebar.home'), group: 'main' },
    ...capabilityNav.map(({ to, iconKey, labelKey }) => ({
      to,
      icon: ICONS[iconKey] ?? Home,
      label: t(labelKey),
      group: groupOf(to),
    })),
    { to: '/settings', icon: Settings, label: t('sidebar.settings'), group: 'system' },
    { to: '/about', icon: Info, label: t('sidebar.about'), group: 'system' },
  ]

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    label: t(`nav.group.${g}`),
    items: navItems.filter((n) => n.group === g),
  })).filter((g) => g.items.length > 0)

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: t('theme.light') },
    { value: 'dark' as const, icon: Moon, label: t('theme.dark') },
    { value: 'system' as const, icon: Monitor, label: t('theme.system') },
  ]

  const languageOptions = [
    { value: 'zh-CN' as const, short: '中', label: t('language.zh-CN') },
    { value: 'en-US' as const, short: 'EN', label: t('language.en-US') },
  ]

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-border-default bg-sidebar transition-[width] duration-200 ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* Logo */}
      <div className="flex h-12 items-center gap-2 border-b border-border-default px-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-accent-foreground">
          T
        </div>
        {!collapsed && (
          <span className="truncate text-[14px] font-semibold tracking-tight text-foreground">
            Template
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {grouped.map(({ group, label, items }) => (
          <div key={group} className="mb-3 last:mb-0">
            {!collapsed && (
              <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                {label}
              </div>
            )}
            <ul className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-sidebar-active font-medium text-accent'
                          : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                    title={collapsed ? itemLabel : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    {!collapsed && <span className="truncate">{itemLabel}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* 底部：主题 / 语言 / 折叠 — 固定在侧栏 */}
      <div className="space-y-2 border-t border-border-default p-2">
        {/* 主题 */}
        <div className={`flex gap-1 ${collapsed ? 'flex-col' : 'flex-row'}`}>
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              title={label}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg p-1.5 transition-colors ${
                theme === value
                  ? 'bg-accent-subtle text-accent'
                  : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
              } ${collapsed ? 'w-full' : ''}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {!collapsed && <span className="text-[11px]">{label}</span>}
            </button>
          ))}
        </div>

        {/* 语言 */}
        <div className={`flex gap-1 ${collapsed ? 'flex-col' : 'flex-row'}`}>
          {languageOptions.map(({ value, short, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLanguage(value)}
              title={label}
              className={`flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                language === value
                  ? 'bg-accent-subtle text-accent'
                  : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
              } ${collapsed ? 'w-full' : ''}`}
            >
              {collapsed ? short : label}
            </button>
          ))}
        </div>

        {/* 折叠 */}
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground ${
            collapsed ? 'px-0' : ''
          }`}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span>{t('sidebar.collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
