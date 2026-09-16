import type { RouteObject } from 'react-router-dom'
import { isCapabilityEnabled } from './config'
import { getPluginRoutes } from './plugin-routes'

/** 聚合各能力提供的子路由（挂载在 AppLayout children 下） */
export function getCapabilityRoutes(): RouteObject[] {
  const routes: RouteObject[] = []
  if (isCapabilityEnabled('plugins')) {
    routes.push(...getPluginRoutes())
  }
  return routes
}

/** 侧边栏能力入口（壳导航之外的可选项） */
export interface CapabilityNavItem {
  to: string
  iconKey: 'store' | 'package'
  labelKey: string
}

export function getCapabilityNavItems(): CapabilityNavItem[] {
  if (!isCapabilityEnabled('plugins')) return []
  return [
    { to: '/plugin-market', iconKey: 'store', labelKey: 'sidebar.plugin-market' },
    { to: '/my-plugins', iconKey: 'package', labelKey: 'sidebar.my-plugins' },
  ]
}

export { isCapabilityEnabled, enabledCapabilities, type CapabilityId } from './config'
