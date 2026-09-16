import type { RouteObject } from 'react-router-dom'
import { PluginMarket } from './pages/PluginMarket'
import { MyPlugins } from './pages/MyPlugins'

export function getPluginRoutes(): RouteObject[] {
  return [
    { path: 'plugin-market', element: <PluginMarket /> },
    { path: 'my-plugins', element: <MyPlugins /> },
  ]
}

export function getPluginNavItems() {
  return [
    { to: '/plugin-market', iconKey: 'store' as const, labelKey: 'sidebar.plugin-market' },
    { to: '/my-plugins', iconKey: 'package' as const, labelKey: 'sidebar.my-plugins' },
  ]
}
