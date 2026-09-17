import type { BrowserWindowConstructorOptions } from 'electron'

/** 窗口类型（封闭集合，新增须在此登记） */
export type WindowType = 'main' | 'subWindow'

/** 窗口生命周期模式 */
export type WindowMode = 'singleton' | 'default'

export interface WindowTypeConfig {
  mode: WindowMode
  title?: string
  /** 默认尺寸（无持久化状态时） */
  defaultSize?: { width: number; height: number }
  minWidth?: number
  minHeight?: number
  /** 是否持久化 bounds（仅 main 等需要） */
  persistBounds?: boolean
  /** 透传 BrowserWindow 额外选项 */
  browserOptions?: BrowserWindowConstructorOptions
}

/**
 * 窗口类型注册表。
 * - singleton：全局唯一，open 时聚焦已有实例
 * - default：每次 open 新建
 */
export const windowRegistry: Record<WindowType, WindowTypeConfig> = {
  main: {
    mode: 'singleton',
    title: 'Main window',
    defaultSize: { width: 1200, height: 800 },
    minWidth: 800,
    minHeight: 600,
    persistBounds: true,
  },
  subWindow: {
    mode: 'default',
    title: 'Sub window',
    defaultSize: { width: 900, height: 700 },
    minWidth: 400,
    minHeight: 300,
    persistBounds: false,
  },
}

export function getWindowTypeConfig(type: WindowType): WindowTypeConfig {
  const config = windowRegistry[type]
  if (!config) {
    throw new Error(`Unknown window type: ${type}`)
  }
  return config
}
