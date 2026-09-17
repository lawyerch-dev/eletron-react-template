import { NavLink } from 'react-router-dom'
import {
  Home,
  Settings,
  Info,
  Store,
  Package,
  ScanText,
  Cable,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useTheme } from '@/app/contexts/ThemeContext'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { getCapabilityNavItems } from '@/capabilities'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const ICONS = { store: Store, package: Package, scan: ScanText, cable: Cable } as const

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const capabilityNav = getCapabilityNavItems()
  const navItems = [
    { to: '/', icon: Home, label: t('sidebar.home') },
    ...capabilityNav.map(({ to, iconKey, labelKey }) => ({
      to,
      icon: ICONS[iconKey],
      label: t(labelKey),
    })),
    { to: '/settings', icon: Settings, label: t('sidebar.settings') },
    { to: '/about', icon: Info, label: t('sidebar.about') },
  ]

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: t('theme.light') },
    { value: 'dark' as const, icon: Moon, label: t('theme.dark') },
    { value: 'system' as const, icon: Monitor, label: t('theme.system') },
  ]

  const languageOptions = [
    { value: 'zh-CN' as const, label: t('language.zh-CN') },
    { value: 'en-US' as const, label: t('language.en-US') },
  ]

  return (
    <aside
      className={`flex h-full flex-col border-r border-border-default bg-surface transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-center border-b border-border-default px-4">
        {!collapsed && <span className="text-lg font-semibold text-foreground">Template</span>}
        {collapsed && <span className="text-lg font-bold text-accent">T</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-subtle text-accent'
                  : 'text-foreground-secondary hover:bg-surface-hover'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Theme and Language Settings */}
      <div className="border-t border-border-default p-2">
        {/* Theme Selection */}
        <div className="mb-2">
          <div className={`flex gap-1 ${collapsed ? 'flex-col' : 'flex-row'}`}>
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
                  theme === value
                    ? 'bg-accent-subtle text-accent'
                    : 'text-foreground-muted hover:bg-surface-hover'
                } ${collapsed ? 'w-full' : 'flex-1'}`}
                title={label}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span className="ml-1 text-xs">{label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-2">
          <div className={`flex gap-1 ${collapsed ? 'flex-col' : 'flex-row'}`}>
            {languageOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLanguage(value)}
                className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
                  language === value
                    ? 'bg-accent-subtle text-accent'
                    : 'text-foreground-muted hover:bg-surface-hover'
                } ${collapsed ? 'w-full' : 'flex-1'}`}
                title={label}
              >
                {collapsed ? (
                  <span className="text-xs font-medium">{value === 'zh-CN' ? '中' : 'EN'}</span>
                ) : (
                  <span className="text-xs">{label}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl p-2 text-foreground-muted transition-colors hover:bg-surface-hover"
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="ml-2 text-sm">{t('sidebar.collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
