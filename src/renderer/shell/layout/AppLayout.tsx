import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Sidebar } from './Sidebar'
import { useIpcOn } from '@/ipc/useIpcOn'

const SIDEBAR_KEY = 'sidebar-collapsed'

/** 壳层：侧栏（含主题/语言）+ 内容区。主题/语言固定在侧栏底部，不进各页面。 */
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const navigate = useNavigate()

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

      <main className="min-w-0 flex-1 overflow-y-auto bg-background px-6 py-5">
        <Outlet />
      </main>

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: 'bg-surface text-foreground border border-border-default',
        }}
      />
    </div>
  )
}
