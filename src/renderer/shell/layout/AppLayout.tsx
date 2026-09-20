import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useIpcOn } from '@/ipc/useIpcOn'

const SIDEBAR_KEY = 'sidebar-collapsed'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const pageTitles: Record<string, string> = {
    '/': t('page.home'),
    '/plugin-market': t('page.plugin-market'),
    '/my-plugins': t('page.my-plugins'),
    '/models': t('page.models'),
    '/prompts': t('page.prompts'),
    '/skills': t('page.skills'),
    '/tools': t('page.tools'),
    '/agent': t('page.agent'),
    '/settings': t('page.settings'),
    '/about': t('page.about'),
  }

  const title = pageTitles[location.pathname] || t('page.home')

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed))
  }, [collapsed])

  const onNavigate = useCallback(
    (payload: { route: string }) => {
      if (payload?.route) navigate(payload.route)
    },
    [navigate],
  )
  useIpcOn('app.navigate', onNavigate)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: 'bg-surface text-foreground',
        }}
      />
    </div>
  )
}
