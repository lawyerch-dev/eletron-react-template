import type { RouteObject } from 'react-router-dom'
import { isCapabilityEnabled } from './config'
import { getPluginRoutes, getPluginNavItems } from '@/features/plugins'
import { getOcrRoutes, getOcrNavItems } from '@/features/ocr'
import { getMcpRoutes, getMcpNavItems } from '@/features/mcp'
import { getModelsRoutes, getModelsNavItems } from '@/features/models'
import { getPromptsRoutes, getPromptsNavItems } from '@/features/prompts'
import { getSkillsRoutes, getSkillsNavItems } from '@/features/skills'
import { getToolsRoutes, getToolsNavItems } from '@/features/tools'
import { getAgentRoutes, getAgentNavItems } from '@/features/agent'

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
  if (isCapabilityEnabled('models')) {
    routes.push(...getModelsRoutes())
  }
  if (isCapabilityEnabled('prompts')) {
    routes.push(...getPromptsRoutes())
  }
  if (isCapabilityEnabled('skills')) {
    routes.push(...getSkillsRoutes())
  }
  if (
    isCapabilityEnabled('webSearch') ||
    isCapabilityEnabled('docs') ||
    isCapabilityEnabled('embedding') ||
    isCapabilityEnabled('env')
  ) {
    routes.push(...getToolsRoutes())
  }
  if (isCapabilityEnabled('agent')) {
    routes.push(...getAgentRoutes())
  }
  return routes
}

/** 侧边栏能力入口（壳导航之外的可选项） */
export interface CapabilityNavItem {
  to: string
  iconKey: 'store' | 'package' | 'scan' | 'cable' | 'cpu' | 'book' | 'puzzle' | 'wrench' | 'bot'
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
  if (isCapabilityEnabled('models')) {
    items.push(...getModelsNavItems())
  }
  if (isCapabilityEnabled('prompts')) {
    items.push(...getPromptsNavItems())
  }
  if (isCapabilityEnabled('skills')) {
    items.push(...getSkillsNavItems())
  }
  if (
    isCapabilityEnabled('webSearch') ||
    isCapabilityEnabled('docs') ||
    isCapabilityEnabled('embedding') ||
    isCapabilityEnabled('env')
  ) {
    items.push(...getToolsNavItems())
  }
  if (isCapabilityEnabled('agent')) {
    items.push(...getAgentNavItems())
  }
  return items
}

export { isCapabilityEnabled, enabledCapabilities, type CapabilityId } from './config'
