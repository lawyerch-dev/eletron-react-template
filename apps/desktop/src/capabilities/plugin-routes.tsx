import type { RouteObject } from 'react-router-dom'
import { PluginMarket } from '@/pages/PluginMarket'
import { MyPlugins } from '@/pages/MyPlugins'

export function getPluginRoutes(): RouteObject[] {
  return [
    { path: 'plugin-market', element: <PluginMarket /> },
    { path: 'my-plugins', element: <MyPlugins /> },
  ]
}
