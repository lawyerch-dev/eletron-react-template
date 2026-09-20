import type { RouteObject } from 'react-router-dom'
import { ToolsPage } from './ToolsPage'

export function getToolsRoutes(): RouteObject[] {
  return [{ path: 'tools', element: <ToolsPage /> }]
}

export function getToolsNavItems() {
  return [{ to: '/tools', iconKey: 'wrench' as const, labelKey: 'sidebar.tools' }]
}
