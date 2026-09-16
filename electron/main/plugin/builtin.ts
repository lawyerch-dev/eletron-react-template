import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { InstalledPlugin } from './shared'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 解析内置插件根目录。
 * 开发模式：项目根目录下的 plugins/
 * 打包模式：resources/plugins/（通过 extraResources 分发）
 */
export function resolveBuiltinPluginsRoot(): string {
  if (process.resourcesPath) {
    const packaged = path.join(process.resourcesPath, 'plugins')
    if (fs.existsSync(packaged)) return packaged
  }
  const root = process.env.APP_ROOT || path.join(__dirname, '../..')
  return path.join(root, 'plugins')
}

/**
 * 扫描内置插件目录，返回已注册的内置插件列表。
 * 每个子目录必须包含 plugin.json 才被视为有效插件。
 */
export function scanBuiltinPlugins(): InstalledPlugin[] {
  const root = resolveBuiltinPluginsRoot()
  if (!fs.existsSync(root)) return []

  const entries = fs.readdirSync(root, { withFileTypes: true })
  const plugins: InstalledPlugin[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const pluginDir = path.join(root, entry.name)
    const configPath = path.join(pluginDir, 'plugin.json')
    if (!fs.existsSync(configPath)) continue

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      const name = typeof config.name === 'string' ? config.name : ''
      const version = typeof config.version === 'string' ? config.version : '0.0.0'
      if (!name) continue

      // logo 必须落在插件目录内
      let logo = ''
      if (config.logo) {
        const logoAbs = path.resolve(pluginDir, config.logo as string)
        if (logoAbs === pluginDir || logoAbs.startsWith(pluginDir + path.sep)) {
          logo = 'plugin-icon://' + logoAbs
        }
      }

      plugins.push({
        name,
        title: (config.title as string) || name,
        version,
        description: (config.description as string) || '',
        author: (config.author as string) || '',
        homepage: (config.homepage as string) || '',
        logo,
        main: config.main as string | undefined,
        preload: config.preload as string | undefined,
        features: Array.isArray(config.features) ? config.features : [],
        path: pluginDir,
        storageKind: 'directory',
        installedAt: '1970-01-01T00:00:00.000Z',
        isDevelopment: false,
        isBuiltin: true,
      })
    } catch {
      console.error(`[Plugin] 解析内置插件失败: ${pluginDir}`)
    }
  }

  return plugins
}
