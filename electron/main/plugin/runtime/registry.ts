import { pluginDb } from '../store'
import { physicalFs } from '../physicalFs'
import type { InstalledPlugin } from '../shared'

const artifactFs = physicalFs.promises

/**
 * 已装插件注册表：负责插件列表读取、卸载、写入。
 * 支持三层来源：内置插件（memory）+ 用户插件（electron-store）。
 * installer 等模块应通过本类读写用户插件列表，避免双写。
 */
class Registry {
  /** 内置插件列表（内存，每次启动时从 plugins/ 扫描） */
  private builtinPlugins: InstalledPlugin[] = []
  private notifyPluginsChanged: () => void = () => {}

  setOnPluginsChanged(cb: () => void): void {
    this.notifyPluginsChanged = cb
  }

  /** 注册内置插件 */
  registerBuiltin(plugins: InstalledPlugin[]): void {
    this.builtinPlugins = plugins
    this.notifyPluginsChanged()
  }

  /**
   * 返回完整的插件列表（内置插件 + 用户安装插件）。
   * 同名内置插件不会重复出现——用户安装的版本优先。
   */
  list(): InstalledPlugin[] {
    const userPlugins = pluginDb.dbGet('plugins')
    const userList = Array.isArray(userPlugins) ? (userPlugins as InstalledPlugin[]) : []

    // 内置插件中，排除已被用户安装覆盖的同名插件
    const userNames = new Set(userList.map((p) => p.name))
    const builtin = this.builtinPlugins.filter((b) => !userNames.has(b.name))

    return [...builtin, ...userList]
  }

  getByName(name: string): InstalledPlugin | undefined {
    return this.list().find((p) => p.name === name)
  }

  /** 仅读用户安装列表（不含内置） */
  listUserInstalled(): InstalledPlugin[] {
    const userPlugins = pluginDb.dbGet('plugins')
    return Array.isArray(userPlugins) ? (userPlugins as InstalledPlugin[]) : []
  }

  private writeUserInstalled(plugins: InstalledPlugin[]): void {
    pluginDb.dbPut('plugins', plugins)
  }

  /** 写入/覆盖一条用户插件记录（安装成功后调用） */
  upsertUserPlugin(plugin: InstalledPlugin): void {
    const next = this.listUserInstalled().filter((p) => p.name !== plugin.name)
    next.push(plugin)
    this.writeUserInstalled(next)
    this.notifyPluginsChanged()
  }

  /** 按 path 移除用户插件记录（不删文件） */
  removeUserPluginByPath(pluginPath: string): boolean {
    const userPlugins = this.listUserInstalled()
    const filtered = userPlugins.filter((p) => p.path !== pluginPath)
    if (filtered.length === userPlugins.length) return false
    this.writeUserInstalled(filtered)
    this.notifyPluginsChanged()
    return true
  }

  async delete(pluginPath: string): Promise<{ success: boolean; error?: string }> {
    const plugins = this.list()
    const index = plugins.findIndex((p) => p.path === pluginPath)
    if (index === -1) return { success: false, error: '插件不存在' }

    const plugin = plugins[index]

    // 内置插件不可删除
    if (plugin.isBuiltin) {
      return { success: false, error: '内置插件不可卸载' }
    }

    // 先删文件，失败则不改注册表，避免「库已删、文件还在」的不一致
    try {
      await Promise.all([
        artifactFs.rm(plugin.path, { recursive: true, force: true }),
        artifactFs.rm(`${plugin.path}.unpacked`, { recursive: true, force: true }),
      ])
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '删除文件失败' }
    }

    this.removeUserPluginByPath(pluginPath)
    return { success: true }
  }
}

export const registry = new Registry()
export type { InstalledPlugin }
