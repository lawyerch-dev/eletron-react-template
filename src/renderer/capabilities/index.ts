import type { RouteObject } from 'react-router-dom'
import { isCapabilityEnabled } from './config'
import { getPluginRoutes, getPluginNavItems } from '@/features/plugins'
import { getOcrRoutes, getOcrNavItems } from '@/features/ocr'
import { getMcpRoutes, getMcpNavItems } from '@/features/mcp'

/** 聚合各能力提供的子路由（挂载在 AppLayout children 下） */
export function getCapabilityRoutes(): RouteObject[] {
  const routes: RouteObject[] = []
  if (isCapabilityEnabled('plugins')) {
    routes.push(...getPluginRoutes())
  }
  if (isCapabilityEnabled('ocr')) {
    routes.push(...getOcrRoutes())
  }
  if (isCapabilityEnabled('mcp')) {
    routes.push(...getMcpRoutes())
  }
  return routes
}

/** 侧边栏能力入口（壳导航之外的可选项） */
export interface CapabilityNavItem {
  to: string
  iconKey: 'store' | 'package' | 'scan' | 'cable'
  labelKey: string
}

export function getCapabilityNavItems(): CapabilityNavItem[] {
  const items: CapabilityNavItem[] = []
  if (isCapabilityEnabled('plugins')) {
    items.push(...getPluginNavItems())
  }
  if (isCapabilityEnabled('ocr')) {
    items.push(...getOcrNavItems())
  }
  if (isCapabilityEnabled('mcp')) {
    items.push(...getMcpNavItems())
  }
  return items
}

export { isCapabilityEnabled, enabledCapabilities, type CapabilityId } from './config'
