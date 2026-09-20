import type { RouteObject } from 'react-router-dom'
import { PromptsPage } from './PromptsPage'

export function getPromptsRoutes(): RouteObject[] {
  return [{ path: 'prompts', element: <PromptsPage /> }]
}

export function getPromptsNavItems() {
  return [{ to: '/prompts', iconKey: 'book' as const, labelKey: 'sidebar.prompts' }]
}
