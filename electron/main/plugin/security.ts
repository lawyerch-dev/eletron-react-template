import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'
import { getPluginsRoot } from './shared'
import { resolveBuiltinPluginsRoot } from './builtin'

/** 允许 market-icon 代理的远程图床域名 */
const MARKET_ICON_HOSTS = new Set([
  'raw.githubusercontent.com',
  'github.com',
  'objects.githubusercontent.com',
  'avatars.githubusercontent.com',
  'camo.githubusercontent.com',
])

/** market-icon 代理响应体大小上限（2MB） */
export const MARKET_ICON_MAX_BYTES = 2 * 1024 * 1024

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp'])

/** 收集允许读取的插件资源根目录（realpath，兼容 macOS 符号链接） */
function allowedPluginRoots(): string[] {
  const roots = [getPluginsRoot(), resolveBuiltinPluginsRoot()]
  try {
    roots.push(path.join(app.getPath('userData'), 'plugins'))
  } catch {
    // app 未就绪时忽略
  }
  return roots.map((r) => {
    const abs = path.resolve(r)
    try {
      return fs.realpathSync(abs)
    } catch {
      return abs
    }
  })
}

/**
 * 校验 plugin-icon 协议目标路径：
 * - 必须落在插件根目录内（防任意文件读）
 * - 必须是图片扩展名
 */
export function isSafePluginIconPath(filePath: string): boolean {
  if (typeof filePath !== 'string' || !filePath) return false
  if (filePath.includes('\0')) return false

  const ext = path.extname(filePath).toLowerCase()
  if (!IMAGE_EXT.has(ext)) return false

  let resolved: string
  try {
    resolved = path.resolve(filePath)
  } catch {
    return false
  }

  // 尝试 realpath，失败（如 asar 内路径）则用 resolve 结果
  let real = resolved
  try {
    real = fs.realpathSync(resolved)
  } catch {
    // asar / 尚未落地的路径：保留 resolved
  }

  const roots = allowedPluginRoots()
  return roots.some((root) => real === root || real.startsWith(root + path.sep))
}

/**
 * 将绝对路径编码为 plugin-icon URL。
 * 使用 proxy/encodeURIComponent，避免 standard 协议把路径首段当成 host 并小写化。
 */
export function toPluginIconUrl(absPath: string): string {
  return `plugin-icon://proxy/${encodeURIComponent(absPath)}`
}

/** 从 plugin-icon://proxy/<encoded> 还原本地绝对路径。非法格式返回空串。 */
export function parsePluginIconPath(requestUrl: string): string {
  const prefix = 'plugin-icon://proxy/'
  if (!requestUrl.startsWith(prefix)) return ''
  try {
    return decodeURIComponent(requestUrl.slice(prefix.length))
  } catch {
    return ''
  }
}
export function isAllowedMarketIconUrl(target: string): boolean {
  if (typeof target !== 'string' || !target) return false
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  return MARKET_ICON_HOSTS.has(url.hostname.toLowerCase())
}

/** shell.openExternal 协议白名单 */
export function isSafeExternalUrl(target: string): boolean {
  if (typeof target !== 'string' || !target) return false
  try {
    const url = new URL(target)
    return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:'
  } catch {
    return false
  }
}
