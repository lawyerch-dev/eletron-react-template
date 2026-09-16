import { ipcMain, protocol, net, dialog } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { pluginMarket } from './installer/market'
import { installer } from './installer/installer'
import { registry } from './runtime/registry'
import { runner } from './runtime/runner'
import { initPluginRuntime, bindRunningContext } from './api/services'
import { getRuntimePreloadPath } from './shared'
import { scanBuiltinPlugins } from './builtin'
import {
  isSafePluginIconPath,
  isAllowedMarketIconUrl,
  MARKET_ICON_MAX_BYTES,
  parsePluginIconPath,
} from './security'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHANGED_EVENT = 'plugins-changed'

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
  // 打包后：resources/plugin-preload.js
  if (process.resourcesPath) {
    const packaged = path.join(process.resourcesPath, 'plugin-preload.js')
    if (fs.existsSync(packaged)) return packaged
  }
  // 开发/构建期间：项目源码目录
  const root = process.env.APP_ROOT || path.join(__dirname, '../..')
  const source = path.join(root, 'electron/main/plugin-host/plugin-preload.js')
  return fs.existsSync(source) ? source : path.join(root, 'resources/plugin-preload.js')
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
 * 初始化插件子系统：写入运行时、注册 plugin.api 分发、绑定运行上下文、注册 IPC。
 * @param notifyWeb 宿主侧变更通知回调（通常向主窗口发送 events）
 */
export function initPluginSubsystem(
  notifyWeb?: (channel: string, ...args: unknown[]) => void,
): void {
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

  const notify = (): void => {
    notifyWeb?.(CHANGED_EVENT)
  }
  registry.setOnPluginsChanged(notify)
  runner.setOnRunningChanged(() => notify)

  // ── 插件市场 ──
  ipcMain.handle('plugin:market-list', () => pluginMarket.fetchPluginMarket())
  ipcMain.handle('plugin:market-recommendations', (_e, limit?: number) =>
    pluginMarket.fetchRecommendations(limit),
  )
  ipcMain.handle('plugin:market-install', (_e, plugin: { name: string; downloadUrl?: string }) =>
    installer.installFromMarket(plugin),
  )
  ipcMain.handle('plugin:market-cancel', (_e, name: string) => installer.cancelDownload(name))
  ipcMain.handle('plugin:market-readme', (_e, pluginName: string) =>
    pluginMarket.fetchReadme(pluginName),
  )
  ipcMain.handle('plugin:market-clear-cache', () => {
    pluginMarket.clearCache()
  })

  // ── 已安装插件 ──
  ipcMain.handle('plugin:list', () => registry.list())
  ipcMain.handle('plugin:delete', async (_e, pluginPath: string) => {
    // 卸载前强制关闭运行中窗口，避免文件占用导致删除失败
    await runner.forceClose(pluginPath)
    return registry.delete(pluginPath)
  })

  // ── 本地导入 ──
  ipcMain.handle('plugin:import-from-file', async () => {
    const result = await dialog.showOpenDialog({
      title: '导入插件',
      filters: [{ name: 'ZTools 插件', extensions: ['zpx', 'zip'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true }
    }
    return installer.installFromPath(result.filePaths[0])
  })

  // ── 插件运行 ──
  ipcMain.handle('plugin:launch', (_e, pluginPath: string) => {
    const plugin = registry.list().find((p) => p.path === pluginPath)
    if (!plugin) return { success: false, error: '插件不存在' }
    return runner.launch(plugin)
  })
  ipcMain.handle('plugin:close', (_e, pluginPath: string) => runner.closePlugin(pluginPath))
  ipcMain.handle('plugin:running', () => runner.getRunningPlugins())
}

export { runner, registry, installer, pluginMarket }
