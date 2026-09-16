import path from 'node:path'
import os from 'node:os'
import { app } from 'electron'

/**
 * 开发版插件名后缀，与 ZTools 保持一致。
 */
export const DEV_PLUGIN_SUFFIX = '__dev'

export function isDevelopmentPluginName(pluginName: string): boolean {
  return pluginName.endsWith(DEV_PLUGIN_SUFFIX)
}

/**
 * 生成插件私有数据库文档前缀。
 * 用于将该插件写入的数据与其他插件及宿主隔离。
 */
export function getPluginDataPrefix(pluginName: string): string {
  return `PLUGIN/${pluginName}/`
}

/**
 * 生成插件主视图 / 子窗口共享的 Session partition。
 */
export function getPluginSessionPartition(pluginName: string): string {
  return `persist:${pluginName}`
}

/**
 * 插件安装的根目录（内存中可覆盖，便于测试）。
 */
export function getPluginsRoot(custom?: string): string {
  return (
    custom ||
    process.env.PLUGIN_ROOT ||
    path.join(app.isPackaged ? app.getPath('userData') : app.getPath('userData'), 'plugins')
  )
}

/**
 * 插件运行时 preload 输出路径。
 */
export function getRuntimePreloadPath(custom?: string): string {
  return (
    custom ||
    process.env.PLUGIN_RUNTIME_PRELOAD ||
    path.join(app.getPath('userData'), 'plugin-preload.js')
  )
}

/**
 * 生成唯一临时文件路径。
 */
export function getTempPath(ext: string, prefix = 'plg'): string {
  const name = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  return path.join(os.tmpdir(), name)
}

export type PluginStorageKind = 'directory' | 'asar'

export interface InstalledPlugin {
  name: string
  title: string
  version: string
  description?: string
  author?: string
  homepage?: string
  logo: string
  main?: string
  preload?: string
  features?: unknown[]
  path: string
  storageKind: PluginStorageKind
  installedAt: string
  isDevelopment: boolean
  /** 是否为内置插件（随应用打包，不可卸载） */
  isBuiltin?: boolean
}
