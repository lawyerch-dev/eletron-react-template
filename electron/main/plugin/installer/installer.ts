import AdmZip from 'adm-zip'
import { app, BrowserWindow } from 'electron'
import { rm, mkdir } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { downloadFile, DownloadCancelledError } from './download'
import { isValidZpx, prepareZpxAsar, readTextFromZpx } from './zpx'
import { physicalFs } from '../physicalFs'
import { pluginMarket } from './market'
import { registry } from '../runtime/registry'
import { runner } from '../runtime/runner'
import { getPluginsRoot, type InstalledPlugin } from '../shared'

const artifactFs = physicalFs.promises

const MARKET_DOWNLOAD_PROGRESS_CHANNEL = 'plugin-market-download-progress'

export interface PluginInstallResult {
  success: boolean
  plugin?: InstalledPlugin
  error?: string
  cancelled?: boolean
}

type ProgressPayload = {
  pluginName: string
  status: 'downloading' | 'installing' | 'success' | 'error' | 'cancelled'
  progress: number | null
  error?: string
}

interface DownloadTask {
  controller: AbortController
}

/**
 * 插件安装器：负责从市场/本地文件安装 .zpx/.zip 插件。
 * 用户插件列表的读写统一走 registry，本类不再维护 notify 回调。
 */
class Installer {
  private tasks = new Map<string, DownloadTask>()

  private emit(pluginName: string, payload: Omit<ProgressPayload, 'pluginName'>): void {
    for (const w of BrowserWindow.getAllWindows()) {
      if (!w.isDestroyed()) {
        w.webContents.send(MARKET_DOWNLOAD_PROGRESS_CHANNEL, { pluginName, ...payload })
      }
    }
  }

  private readInstalled(): InstalledPlugin[] {
    return registry.listUserInstalled()
  }

  /**
   * 从插件市场安装插件：解析下载地址 → 下载 → 自动识别 ZPX/ZIP → 安装。
   */
  async installFromMarket(plugin: {
    name: string
    downloadUrl?: string
  }): Promise<PluginInstallResult> {
    const pluginName = typeof plugin?.name === 'string' ? plugin.name : ''
    if (!pluginName) {
      return { success: false, error: '无效的插件信息' }
    }
    if (this.tasks.has(pluginName)) {
      return { success: false, error: '该插件正在下载中' }
    }

    const taskId = `${pluginName}-${Date.now()}`
    const controller = new AbortController()
    this.tasks.set(pluginName, { controller })

    const tempDir = path.join(app.getPath('temp'), 'plugin-download', taskId)
    const safeName = pluginName.replace(/[\\/]/g, '_')

    try {
      const source = await pluginMarket.resolveDownloadSource(plugin)
      if (!source?.url) {
        return { success: false, error: '无效的下载链接' }
      }
      await mkdir(tempDir, { recursive: true })

      // 清单模式：下载的是整个仓库归档，需先提取 plugins/<name> 子目录再安装
      const subDir = source.subDir
      const packagePath = path.join(tempDir, `${safeName}.pkg`)
      const archivePath = path.join(tempDir, `${safeName}.archive.zip`)
      const downloadTarget = subDir ? archivePath : packagePath

      await downloadFile(source.url, downloadTarget, {
        signal: controller.signal,
        onProgress: (progress) => {
          this.emit(pluginName, { status: 'downloading', progress: progress.percent })
        },
      })
      this.emit(pluginName, { status: 'installing', progress: 100 })

      if (subDir) {
        await this.extractSubDirToZip(archivePath, subDir, packagePath)
      }

      const result = await this.installFromPath(packagePath)
      this.emit(pluginName, {
        status: result.success ? 'success' : 'error',
        progress: result.success ? 100 : null,
        error: result.error,
      })
      return result
    } catch (error) {
      if (error instanceof DownloadCancelledError || controller.signal.aborted) {
        this.emit(pluginName, { status: 'cancelled', progress: null })
        return { success: false, cancelled: true, error: '已取消下载' }
      }
      this.emit(pluginName, {
        status: 'error',
        progress: null,
        error: error instanceof Error ? error.message : '安装失败',
      })
      return { success: false, error: error instanceof Error ? error.message : '安装失败' }
    } finally {
      this.tasks.delete(pluginName)
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }

  cancelDownload(nameOrTaskId: string): { success: boolean; error?: string } {
    const task = this.tasks.get(nameOrTaskId)
    if (!task) return { success: false, error: '没有找到正在下载的插件' }
    task.controller.abort()
    return { success: true }
  }

  /**
   * 从仓库归档（如 cc-ai-tools-plugins-main/）中提取指定子目录，
   * 打包为根目录含 plugin.json 的 zip，复用 ZIP 安装流程。
   */
  private extractSubDirToZip(archivePath: string, subDir: string, destZipPath: string): void {
    const archive = new AdmZip(archivePath)
    const normalizedSub = subDir.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
    const subPrefix = `${normalizedSub}/`

    // 归档通常带一层顶层目录前缀（<repo>-<branch>/），动态探测它
    const entries = archive.getEntries()
    let basePrefix: string | null = null
    for (const entry of entries) {
      const entryName = entry.entryName.replace(/\\/g, '/')
      const idx = entryName.indexOf(subPrefix)
      if (idx === -1) continue
      const prefix = entryName.slice(0, idx)
      if (basePrefix === null || prefix.length < basePrefix.length) {
        basePrefix = prefix
      }
    }
    if (basePrefix === null) {
      throw new Error(`插件目录 ${subDir} 不存在`)
    }

    const out = new AdmZip()
    const prefixLength = (basePrefix + subPrefix).length
    for (const entry of entries) {
      const entryName = entry.entryName.replace(/\\/g, '/')
      if (!entryName.startsWith(basePrefix + subPrefix)) continue
      const rel = entryName.slice(prefixLength)
      if (!rel || entry.isDirectory) continue
      out.addFile(rel, entry.getData())
    }
    out.writeZip(destZipPath)
  }

  /**
   * 从本地 .zpx/.zip 文件安装插件。
   */
  async installFromPath(filePath: string): Promise<PluginInstallResult> {
    try {
      const isZpx = await isValidZpx(filePath)
      let config: Record<string, unknown>
      if (isZpx) {
        config = JSON.parse(await readTextFromZpx(filePath, 'plugin.json'))
      } else {
        const zip = new AdmZip(filePath)
        const content = zip.readAsText('plugin.json')
        if (!content) throw new Error('无效的插件文件：缺少 plugin.json')
        config = JSON.parse(content)
      }
      return await this.installFromPackage(filePath, isZpx, config)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '安装失败' }
    }
  }

  private async installFromPackage(
    filePath: string,
    isZpx: boolean,
    pluginConfig: Record<string, unknown>,
  ): Promise<PluginInstallResult> {
    const name = typeof pluginConfig.name === 'string' ? pluginConfig.name : ''
    if (!name) return { success: false, error: '无效的插件文件：缺少 name 字段' }

    const pluginsRoot = getPluginsRoot()
    const workDir = path.join(pluginsRoot, '.installing', randomUUID())
    await mkdir(workDir, { recursive: true })
    let publishedPath: string

    try {
      // 校验插件配置
      const existing = this.readInstalled()
      const validation = this.validateConfig(
        pluginConfig,
        existing.filter((p) => p.name !== name),
      )
      if (!validation.valid) return { success: false, error: validation.error }

      // 覆盖安装前关闭同名/同目标路径的运行中实例，避免文件占用
      const sameName = existing.find((p) => p.name === name)
      if (sameName) await runner.forceClose(sameName.path)
      const destPath = isZpx
        ? path.join(pluginsRoot, `${name}-${pluginConfig.version}.asar`)
        : path.join(pluginsRoot, name)
      await runner.forceClose(destPath)

      // 准备实体
      if (isZpx) {
        const prepared = await prepareZpxAsar(filePath, workDir)
        const asarName = `${name}-${pluginConfig.version}.asar`
        publishedPath = path.join(pluginsRoot, asarName)
        // 用物理文件系统发布 ASAR 与其 unpack sidecar，避免 Electron 把 .asar 当作虚拟目录。
        await this.publishAsarArtifact(prepared.asarPath, path.join(pluginsRoot, asarName))
        if (prepared.unpackedPath) {
          await artifactFs.rename(prepared.unpackedPath, `${publishedPath}.unpacked`)
        }
      } else {
        const dirPath = path.join(pluginsRoot, name)
        new AdmZip(filePath).extractAllTo(path.join(workDir, 'plugin'), true)
        await rm(dirPath, { recursive: true, force: true })
        await fs.promises.cp(path.join(workDir, 'plugin'), dirPath, { recursive: true })
        publishedPath = dirPath
      }

      // logo 必须落在插件目录内，防止恶意 plugin.json 用 ../ 指向外部文件
      let logoUrl = ''
      if (pluginConfig.logo) {
        const logoAbs = path.resolve(publishedPath, pluginConfig.logo as string)
        if (logoAbs === publishedPath || logoAbs.startsWith(publishedPath + path.sep)) {
          logoUrl = 'plugin-icon://' + logoAbs
        }
      }

      const storageKind: 'asar' | 'directory' = isZpx ? 'asar' : 'directory'
      const installed: InstalledPlugin = {
        name,
        title: (pluginConfig.title as string) || name,
        version: (pluginConfig.version as string) || '未知',
        description: (pluginConfig.description as string) || '',
        author: (pluginConfig.author as string) || '',
        homepage: (pluginConfig.homepage as string) || '',
        logo: logoUrl,
        main: pluginConfig.main as string | undefined,
        preload: pluginConfig.preload as string | undefined,
        features: Array.isArray(pluginConfig.features) ? pluginConfig.features : [],
        path: publishedPath,
        storageKind,
        installedAt: new Date().toISOString(),
        isDevelopment: false,
      }

      // 统一由 registry 写入用户插件列表
      registry.upsertUserPlugin(installed)
      return { success: true, plugin: installed }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '安装失败' }
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => {})
    }
  }

  /**
   * 将准备完成的 ASAR 实体发布到正式路径。
   * 使用物理文件系统（original-fs）移动，避免 Electron 把 .asar 当虚拟目录导致的 ENOENT。
   */
  private async publishAsarArtifact(stagedPath: string, destinationPath: string): Promise<void> {
    try {
      await artifactFs.rename(stagedPath, destinationPath)
    } catch (error) {
      await artifactFs.rm(destinationPath, { force: true }).catch(() => {})
      throw error
    }
  }

  /**
   * 校验插件配置是否合法且无冲突。
   */
  private validateConfig(
    config: Record<string, unknown>,
    existingInstalled: InstalledPlugin[],
  ): { valid: boolean; error?: string } {
    const name = config.name as string
    const version = config.version as string
    if (!name || !version) return { valid: false, error: '缺少必填字段: name/version' }
    const hasFeatures = Array.isArray(config.features) && config.features.length > 0
    const hasTools = !!config.tools
    if (!hasFeatures && !hasTools && !config.main) {
      return { valid: false, error: '插件必须声明 features、tools 或 main 之一' }
    }
    const titleConflict = existingInstalled.find((p) => p.title === config.title && p.name !== name)
    if (titleConflict) {
      return {
        valid: false,
        error: `插件标题 "${config.title}" 已被插件 "${titleConflict.name}" 使用`,
      }
    }
    return { valid: true }
  }
}

export const installer = new Installer()
