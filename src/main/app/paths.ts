import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'

/**
 * 主进程路径唯一入口。
 * 业务代码禁止直接 `app.getPath` / `process.resourcesPath` / 手写 APP_ROOT 拼接。
 */
let frozenAppRoot: string | null = null

/** 在 main.ts 最早阶段调用一次（任何服务打开文件之前）。 */
export function initAppRoot(root: string): void {
  if (frozenAppRoot) return
  frozenAppRoot = path.resolve(root)
  process.env.APP_ROOT = frozenAppRoot
}

export function getAppRoot(): string {
  return frozenAppRoot || process.env.APP_ROOT || process.cwd()
}

function tryRealpath(p: string): string {
  try {
    return fs.realpathSync(p)
  } catch {
    return p
  }
}

function firstExisting(candidates: string[], fallback: string): string {
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return fallback
}

export const paths = {
  /** 仓库 / 应用根（开发为仓库根，打包后为 resources 旁的 app 根） */
  appRoot: (): string => getAppRoot(),

  /** Electron userData 下的路径 */
  userData: (...segs: string[]): string => path.join(app.getPath('userData'), ...segs),

  /** 系统临时目录 */
  temp: (...segs: string[]): string => path.join(os.tmpdir(), ...segs),

  /** Electron temp（下载等） */
  electronTemp: (...segs: string[]): string => path.join(app.getPath('temp'), ...segs),

  /** 构建产物 */
  mainDist: (): string => path.join(getAppRoot(), 'out/electron'),
  rendererDist: (): string => path.join(getAppRoot(), 'out/renderer'),
  /** 宿主 preload（CJS：package.json type=module 下 ESM+.mjs 不能 require electron） */
  hostPreload: (): string => path.join(getAppRoot(), 'out/electron/preload/index.cjs'),
  rendererIndexHtml: (): string => path.join(getAppRoot(), 'out/renderer/src/renderer/index.html'),
  rendererPublic: (): string => path.join(getAppRoot(), 'src/renderer/public'),

  /** 打包 resources（开发回退到仓库 resources/） */
  resources: (...segs: string[]): string => {
    if (process.resourcesPath && app.isPackaged) {
      return path.join(process.resourcesPath, ...segs)
    }
    return path.join(getAppRoot(), 'resources', ...segs)
  },

  /** 打包 resources（不判断 isPackaged，供启动极早阶段） */
  resourcesRaw: (...segs: string[]): string => {
    if (process.resourcesPath) return path.join(process.resourcesPath, ...segs)
    return path.join(getAppRoot(), 'resources', ...segs)
  },

  /** 用户安装插件根目录 */
  userPluginsRoot: (custom?: string): string =>
    custom || process.env.PLUGIN_ROOT || path.join(app.getPath('userData'), 'plugins'),

  /** 插件运行时 preload（落到 userData，供插件窗口注入） */
  pluginRuntimePreload: (custom?: string): string =>
    custom ||
    process.env.PLUGIN_RUNTIME_PRELOAD ||
    path.join(app.getPath('userData'), 'plugin-preload.js'),

  /** 内置插件扫描根（打包 resources/plugins，开发 src/plugins） */
  builtinPluginsRoot: (): string => {
    if (process.resourcesPath) {
      const packaged = path.join(process.resourcesPath, 'plugins')
      if (fs.existsSync(packaged)) return packaged
    }
    const root = getAppRoot()
    return firstExisting(
      [path.join(root, 'src/plugins'), path.join(root, 'plugins')],
      path.join(root, 'src/plugins'),
    )
  },

  /** 仓库内置 plugin-preload 源文件 */
  pluginPreloadSource: (): string => {
    if (process.resourcesPath) {
      const packaged = path.join(process.resourcesPath, 'plugin-preload.js')
      if (fs.existsSync(packaged)) return packaged
    }
    const root = getAppRoot()
    return firstExisting(
      [
        path.join(root, 'src/main/features/plugin-host/plugin-preload.js'),
        path.join(root, 'resources/plugin-preload.js'),
      ],
      path.join(root, 'src/main/features/plugin-host/plugin-preload.js'),
    )
  },

  /** 原生模块 .node */
  nativeModule: (libDir: string, moduleName: string): string | null => {
    if (app.isPackaged && process.resourcesPath) {
      const p = path.join(process.resourcesPath, 'lib', libDir, moduleName)
      if (fs.existsSync(p)) return p
    }
    const p = path.join(getAppRoot(), 'resources', 'lib', libDir, moduleName)
    return fs.existsSync(p) ? p : null
  },

  /** realpath（macOS /private 等） */
  realpath: tryRealpath,
}
