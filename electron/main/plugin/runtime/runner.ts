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
   */
  async launch(plugin: InstalledPlugin): Promise<{ success: boolean; error?: string }> {
    const existing = this.getRunningByPluginPath(plugin.path)
    if (existing) {
      // 聚焦已在运行的窗口
      const win = BrowserWindow.fromId(existing.webContentsId)
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }
      return { success: true }
    }

    // 对于 asar 插件，其内部文件可通过 asar 路径 + 相对文件访问（Electron 支持 asar 内虚拟路径）
    const url = this.resolvePluginUrl(plugin)

    const sess = session.fromPartition(getPluginSessionPartition(plugin.name))
    const preloadPath = getRuntimePreloadPath()
    // 确保 preload 存在
    if (!fs.existsSync(preloadPath)) {
      return { success: false, error: '插件运行时未找到，请重启应用' }
    }
    sess.registerPreloadScript({ type: 'frame', filePath: preloadPath })

    const win = new BrowserWindow({
      title: plugin.title || plugin.name,
      width: 960,
      height: 720,
      minWidth: 480,
      minHeight: 400,
      backgroundColor: '#ffffff',
      webPreferences: {
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

    const id = win.webContents.id
    this.running.push({ name: plugin.name, path: plugin.path, webContentsId: id })
    this.onRunningChanged(this.running)

    await win.loadURL(url)
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
    if (win) {
      win.close()
    } else {
      this.removeRunning(pluginPath)
    }
    return { success: true }
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
