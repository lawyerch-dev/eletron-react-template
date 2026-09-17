import { protocol, net } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { pluginMarket } from './installer/market'
import { installer } from './installer/installer'
import { registry } from './runtime/registry'
import { runner } from './runtime/runner'
import { initPluginRuntime, bindRunningContext } from './api/services'
import { getRuntimePreloadPath } from './shared'
import {
  isSafePluginIconPath,
  isAllowedMarketIconUrl,
  MARKET_ICON_MAX_BYTES,
  parsePluginIconPath,
} from './security'
import { scanBuiltinPlugins } from './builtin'
import { paths } from '../../app/paths'

/** 根据文件头字节推断图片 MIME，兼容扩展名与实际内容不一致的资源 */
function sniffImageContentType(buffer: Buffer): string {
  const startsWith = (bytes: number[], offset = 0): boolean =>
    buffer.length >= offset + bytes.length && bytes.every((b, i) => buffer[offset + i] === b)

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith([0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  if (startsWith([0x00, 0x00, 0x01, 0x00])) return 'image/x-icon'

  const head = buffer.subarray(0, 512).toString('utf-8').trimStart()
  if (head.startsWith('<svg') || head.startsWith('<?xml') || head.startsWith('<!DOCTYPE svg')) {
    return 'image/svg+xml'
  }
  return 'application/octet-stream'
}

/** 仓库内置插件 preload 源文件（随源码一起分发，打包后经 extraResources 置于 resources） */
function resolveRuntimePreloadSource(): string {
  return paths.pluginPreloadSource()
}

/**
 * 将仓库内置的插件 preload 运行时写入用户数据目录，供插件窗口注入。
 * 打包后 preload 静态文件未必随 asar 直出，因此在启动时统一落地到 userData。
 */
function ensureRuntimePreload(): void {
  const dest = getRuntimePreloadPath()
  try {
    const content = fs.readFileSync(resolveRuntimePreloadSource(), 'utf-8')
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, content, 'utf-8')
  } catch (error) {
    console.error('[Plugin] 写入插件运行时失败:', error)
  }
}

/**
 * 初始化插件子系统：写入运行时、注册 plugin.api 分发、绑定运行上下文、注册协议。
 * 宿主渲染层 IPC 路由由 `main/ipc/handlers/plugin.ts` 注册，本文件不再处理。
 */
export function initPluginSubsystem(notifyWeb?: () => void): void {
  ensureRuntimePreload()
  // 注册内置插件（来自 plugins/ 目录）
  const builtinPlugins = scanBuiltinPlugins()
  if (builtinPlugins.length > 0) {
    registry.registerBuiltin(builtinPlugins)
    console.log(`[Plugin] 已注册 ${builtinPlugins.length} 个内置插件`)
  }
  initPluginRuntime()
  bindRunningContext({ getRunning: () => runner.getRunning() })

  // 注册 plugin-icon 协议：仅允许读取插件目录内的图片，防任意本地文件读
  // 使用 proxy/encodeURIComponent 传路径，避免 standard 协议把 /Users 当 host 小写化
  protocol.handle('plugin-icon', (request) => {
    const filePath = parsePluginIconPath(request.url)
    if (!filePath || !isSafePluginIconPath(filePath)) {
      return new Response('', { status: 403 })
    }
    return net.fetch(pathToFileURL(filePath).href)
  })

  // 注册 market-icon 协议：白名单域名代理远程图标，按文件头修正 MIME，并限制体积
  protocol.handle('market-icon', async (request) => {
    const raw = request.url.slice('market-icon://proxy/'.length)
    let target = raw
    if (!/^https?:\/\//i.test(target)) {
      try {
        target = decodeURIComponent(raw)
      } catch {
        return new Response('', { status: 400 })
      }
    }
    if (!isAllowedMarketIconUrl(target)) {
      return new Response('', { status: 403 })
    }
    try {
      const resp = await net.fetch(target)
      if (!resp.ok) return new Response('', { status: resp.status })
      const buffer = Buffer.from(await resp.arrayBuffer())
      if (buffer.length > MARKET_ICON_MAX_BYTES) {
        return new Response('', { status: 413 })
      }
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': sniffImageContentType(buffer),
          'Cache-Control': 'public, max-age=300',
        },
      })
    } catch {
      return new Response('', { status: 502 })
    }
  })

  registry.setOnPluginsChanged(() => notifyWeb?.())
  runner.setOnRunningChanged(() => notifyWeb?.())
}

export { runner, registry, installer, pluginMarket }
