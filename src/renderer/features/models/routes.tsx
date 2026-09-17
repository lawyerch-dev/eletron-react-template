import type { RouteObject } from 'react-router-dom'
import { ModelsPage } from './ModelsPage'

export function getModelsRoutes(): RouteObject[] {
  return [{ path: 'models', element: <ModelsPage /> }]
}

export function getModelsNavItems() {
  return [{ to: '/models', iconKey: 'cpu' as const, labelKey: 'sidebar.models' }]
}
