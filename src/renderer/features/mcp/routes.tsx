import type { RouteObject } from 'react-router-dom'
import { McpPage } from './McpPage'

export function getMcpRoutes(): RouteObject[] {
  return [{ path: 'mcp', element: <McpPage /> }]
}

export function getMcpNavItems() {
  return [{ to: '/mcp', iconKey: 'cable' as const, labelKey: 'sidebar.mcp' }]
}
