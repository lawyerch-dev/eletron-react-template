import type { RouteObject } from 'react-router-dom'
import { SkillsPage } from './SkillsPage'

export function getSkillsRoutes(): RouteObject[] {
  return [{ path: 'skills', element: <SkillsPage /> }]
}

export function getSkillsNavItems() {
  return [{ to: '/skills', iconKey: 'puzzle' as const, labelKey: 'sidebar.skills' }]
}
