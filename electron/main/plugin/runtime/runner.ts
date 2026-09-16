import { BrowserWindow, session } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPluginSessionPartition, getRuntimePreloadPath, type InstalledPlugin } from '../shared'
import { registry } from './registry'

export interface RunningPlugin {
  name: string
  path: string
  webContentsId: number
}

/**
 * 插件独立窗口运行器。
 * 以独立 BrowserWindow 加载插件入口 html，注入插件 preload，并把窗口信息登记为运行中。
 */
class Runner {
  private running: RunningPlugin[] = []
  private onRunningChanged: (running: RunningPlugin[]) => void = () => {}
  /** 已注册过 preload 的 session partition，避免重复 registerPreloadScript */
  private preloadRegistered = new Set<string>()

  setOnRunningChanged(cb: (running: RunningPlugin[]) => void): void {
    this.onRunningChanged = cb
  }

  getRunning(): RunningPlugin[] {
    return this.running
  }

  getRunningByPluginPath(pluginPath: string): RunningPlugin | undefined {
    return this.running.find((p) => p.path === pluginPath)
  }

  /** 生成插件入口 URL */
  private resolvePluginUrl(plugin: InstalledPlugin): string {
    const main = plugin.main || 'index.html'
    if (main.startsWith('http')) return main
    return pathToFileURL(path.join(plugin.path, main)).href
  }

  /**
   * 启动插件，以独立窗口运行。
   * loadURL 成功后才登记 running，避免失败残留脏状态。
   */
  async launch(plugin: InstalledPlugin): Promise<{ success: boolean; error?: string }> {
    const existing = this.getRunningByPluginPath(plugin.path)
    if (existing) {
      // 聚焦已在运行的窗口；若窗口已销毁则清理脏记录
      const win = BrowserWindow.fromId(existing.webContentsId)
      if (win && !win.isDestroyed()) {
        if (win.isMinimized()) win.restore()
        win.focus()
        return { success: true }
      }
      this.removeRunning(plugin.path)
    }

    // 对于 asar 插件，其内部文件可通过 asar 路径 + 相对文件访问（Electron 支持 asar 内虚拟路径）
    const url = this.resolvePluginUrl(plugin)

    const partition = getPluginSessionPartition(plugin.name)
    const sess = session.fromPartition(partition)
    const preloadPath = getRuntimePreloadPath()
    // 确保 preload 存在
    if (!fs.existsSync(preloadPath)) {
      return { success: false, error: '插件运行时未找到，请重启应用' }
    }
    if (!this.preloadRegistered.has(partition)) {
      sess.registerPreloadScript({ type: 'frame', filePath: preloadPath })
      this.preloadRegistered.add(partition)
    }

    const win = new BrowserWindow({
      title: plugin.title || plugin.name,
      width: 960,
      height: 720,
      minWidth: 480,
      minHeight: 400,
      backgroundColor: '#ffffff',
      webPreferences: {
        // 注意：plugin-preload.js 直接挂载 window.ztools，依赖 contextIsolation:false。
        // 迁移到 contextBridge 是后续安全加固项；在此之前禁止 nodeIntegration / 开启 webSecurity。
        contextIsolation: false,
        nodeIntegration: false,
        webSecurity: false,
        sandbox: false,
        session: sess,
        preload: preloadPath,
      },
    })

    const runEntry = { name: plugin.name, path: plugin.path }
    win.webContents.on('did-finish-load', () => {
      win.webContents.send('on-plugin-enter', { type: 'text', payload: {}, plugin: runEntry })
    })

    // 使用 closed 事件而不是 destroyed，确保窗口关闭时状态正确更新
    win.on('closed', () => {
      this.removeRunning(plugin.path)
    })

    try {
      await win.loadURL(url)
    } catch (error) {
      if (!win.isDestroyed()) win.destroy()
      this.removeRunning(plugin.path)
      return {
        success: false,
        error: error instanceof Error ? error.message : '插件加载失败',
      }
    }

    const id = win.webContents.id
    this.running.push({ name: plugin.name, path: plugin.path, webContentsId: id })
    this.onRunningChanged(this.running)
    return { success: true }
  }

  private removeRunning(pluginPath: string): void {
    this.running = this.running.filter((p) => p.path !== pluginPath)
    this.onRunningChanged(this.running)
  }

  async closePlugin(pluginPath: string): Promise<{ success: boolean; error?: string }> {
    const running = this.getRunningByPluginPath(pluginPath)
    if (!running) return { success: false, error: '插件未运行' }
    const win = BrowserWindow.fromId(running.webContentsId)
    if (win && !win.isDestroyed()) {
      win.close()
    } else {
      this.removeRunning(pluginPath)
    }
    return { success: true }
  }

  /** 卸载/覆盖安装前强制关闭运行中的插件窗口 */
  async forceClose(pluginPath: string): Promise<void> {
    const running = this.getRunningByPluginPath(pluginPath)
    if (!running) return
    const win = BrowserWindow.fromId(running.webContentsId)
    if (win && !win.isDestroyed()) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2000)
        win.once('closed', () => {
          clearTimeout(timer)
          resolve()
        })
        win.close()
      })
    }
    this.removeRunning(pluginPath)
  }

  getRunningPlugins(): Array<{ name: string; path: string; running: boolean }> {
    return registry.list().map((p) => ({
      name: p.name,
      path: p.path,
      running: this.getRunningByPluginPath(p.path) !== undefined,
    }))
  }
}

export const runner = new Runner()
