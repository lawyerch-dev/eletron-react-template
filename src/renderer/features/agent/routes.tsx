import type { RouteObject } from 'react-router-dom'
import { AgentPage } from './AgentPage'

export function getAgentRoutes(): RouteObject[] {
  return [{ path: 'agent', element: <AgentPage /> }]
}

export function getAgentNavItems() {
  return [{ to: '/agent', iconKey: 'bot' as const, labelKey: 'sidebar.agent' }]
}
