/**
 * 插件 API 服务入口
 *
 * 初始化所有插件 API 模块 + 统一分发器 + 数据库 API。
 * 各模块从 Host 源码适配而来，保持与 Host 插件 API 兼容。
 */
import type { RunningPlugin } from '../runtime/runner'
import { pluginDb } from '../store'
import { getPluginDataPrefix } from '../shared'
import { initPluginApiDispatcher, registerPluginApiServices } from './dispatcher'
import clipboardAPI from './clipboard'
import deviceAPI from './device'
import dialogAPI from './dialog'
import httpAPI from './http'
import inputAPI from './input'
import lifecycleAPI from './lifecycle'
import redirectAPI from './redirect'
import screenAPI from './screen'
import shellAPI from './shell'
import toastAPI from './toast'
import toolsAPI from './tools'
import uiAPI from './ui'
import windowAPI from './window'
import { ensureNativeModule } from './native'
import { isCapabilityEnabled } from '../../capabilities'
import { modelService } from '../../capabilities/models'

let runningContext: {
  getRunning: () => RunningPlugin[]
} = { getRunning: () => [] }

export function bindRunningContext(ctx: { getRunning: () => RunningPlugin[] }): void {
  runningContext = ctx
}

export function getRunningContext(): { getRunning: () => RunningPlugin[] } {
  return runningContext
}

/** 根据 sender 解析插件数据前缀 */
function resolvePrefixForSender(
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent,
): string {
  const running = runningContext.getRunning()
  const match = running.find((p) => p.webContentsId === event.sender.id)
  return match ? getPluginDataPrefix(match.name) : 'ZTOOLS/'
}

/** 注册数据库相关 IPC handler */
function registerDatabaseApis(): void {
  const { ipcMain } = require('electron') as typeof import('electron')

  ipcMain.on('db:put', (event, doc) => {
    const prefix = resolvePrefixForSender(event)
    event.returnValue = pluginDb.put({ ...doc, _id: prefix + doc._id }) as unknown
  })
  ipcMain.on('db:get', (event, id) => {
    const prefix = resolvePrefixForSender(event)
    const doc = pluginDb.get(prefix + id)
    event.returnValue = (doc ? { ...doc, _id: id } : null) as unknown
  })
  ipcMain.on('db:remove', (event, docOrId) => {
    const prefix = resolvePrefixForSender(event)
    const id = typeof docOrId === 'string' ? docOrId : docOrId?._id
    event.returnValue = pluginDb.remove(prefix + id) as unknown
  })
  ipcMain.on('db:bulk-docs', (event, docs) => {
    const prefix = resolvePrefixForSender(event)
    event.returnValue = docs.map((d: Record<string, unknown>) =>
      pluginDb.put({ ...d, _id: prefix + (d._id as string) }),
    ) as unknown
  })
  ipcMain.on('db:all-docs', (event, key) => {
    const prefix = resolvePrefixForSender(event)
    const prefixToQuery = Array.isArray(key) ? key.map((k: string) => prefix + k) : prefix
    let docs = pluginDb.allDocs(prefixToQuery as string | string[])
    docs = docs.map((d) => ({ ...d, _id: String(d._id).slice(prefix.length) }))
    event.returnValue = docs as unknown
  })
  ipcMain.on('db:post-attachment', (event, id, attachment) => {
    const prefix = resolvePrefixForSender(event)
    const docId = prefix + id
    const existing = pluginDb.get(docId)
    pluginDb.put({
      ...existing,
      _id: docId,
      attachment: Buffer.isBuffer(attachment) ? attachment.toString('base64') : attachment,
      attachmentType: 'binary',
    })
    event.returnValue = { ok: true, id: docId } as unknown
  })
  ipcMain.on('db:get-attachment', (event, id) => {
    const prefix = resolvePrefixForSender(event)
    const doc = pluginDb.get(prefix + id)
    event.returnValue = (doc && doc.attachment ? doc.attachment : null) as unknown
  })
  ipcMain.on('db:get-attachment-type', (event, id) => {
    const prefix = resolvePrefixForSender(event)
    const doc = pluginDb.get(prefix + id)
    event.returnValue = (doc ? doc.attachmentType : null) as unknown
  })
  ipcMain.on('db-storage:set-item', (event, key, value) => {
    const prefix = resolvePrefixForSender(event)
    const existing = pluginDb.get(prefix + key)
    pluginDb.put({ ...existing, _id: prefix + key, value })
    event.returnValue = undefined
  })
  ipcMain.on('db-storage:get-item', (event, key) => {
    const prefix = resolvePrefixForSender(event)
    const doc = pluginDb.get(prefix + key)
    event.returnValue = (doc ? doc.value : null) as unknown
  })
  ipcMain.on('db-storage:remove-item', (event, key) => {
    const prefix = resolvePrefixForSender(event)
    pluginDb.remove(prefix + key)
    event.returnValue = undefined
  })
  // 异步 handle 必须与同步 on 一样按 sender 隔离，否则插件可直写宿主 ZTOOLS/ 命名空间
  ipcMain.handle('db:put', async (event, doc) => {
    const prefix = resolvePrefixForSender(event)
    return pluginDb.put({ ...doc, _id: prefix + doc._id })
  })
  ipcMain.handle('db:get', async (event, id) => {
    const prefix = resolvePrefixForSender(event)
    const doc = pluginDb.get(prefix + id)
    return doc ? { ...doc, _id: id } : null
  })
  ipcMain.handle('db:remove', async (event, docOrId) => {
    const prefix = resolvePrefixForSender(event)
    const id = typeof docOrId === 'string' ? docOrId : docOrId?._id
    return pluginDb.remove(prefix + id)
  })
  ipcMain.handle('db:bulk-docs', async (event, docs) => {
    const prefix = resolvePrefixForSender(event)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return docs.map((d: any) => pluginDb.put({ ...d, _id: prefix + d._id }))
  })
  ipcMain.handle('db:all-docs', async (event, key) => {
    const prefix = resolvePrefixForSender(event)
    const prefixToQuery = Array.isArray(key) ? key.map((k: string) => prefix + k) : prefix
    const docs = pluginDb.allDocs(prefixToQuery as string | string[])
    return docs.map((d) => ({ ...d, _id: String(d._id).slice(prefix.length) }))
  })
}

/** 注册 plugin.api 统一分发通道的服务 */
function registerPluginApiServices_(): void {
  const { app } = require('electron') as typeof import('electron')
  registerPluginApiServices({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPath: (_event: any, args: unknown) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return app.getPath(args as any)
      } catch {
        return ''
      }
    },
    getPrimaryDisplay: () => {
      const { screen } = require('electron') as typeof import('electron')
      return screen.getPrimaryDisplay()
    },
    getAllDisplays: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { screen } = require('electron') as any
      return screen.getAllDisplays()
    },
    getCursorScreenPoint: () => {
      const { screen } = require('electron') as typeof import('electron')
      return screen.getCursorScreenPoint()
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getWebContentsId: (event: any) => event.sender.id,
    'is-dev': () => process.env.NODE_ENV === 'development',
    'get-app-version': () => {
      const { app } = require('electron') as typeof import('electron')
      return app.getVersion()
    },
    getUser: () => null,
    getUserTempToken: async () => null,
    getThemeInfo: () => ({
      isDark: false,
      primaryColor: '#6366f1',
      customColor: null,
      windowMaterial: 'mica',
    }),
  })
}

/** 注册 Host 特有功能的 stub handler（防止插件调用时报错） */
function registerHostStubs(): void {
  const { ipcMain } = require('electron') as typeof import('electron')

  // ZBrowser
  ipcMain.handle('runZBrowser', async () => ({ success: false, error: '当前环境不支持 ZBrowser' }))
  ipcMain.on('getIdleZBrowsers', (event) => {
    event.returnValue = []
  })
  ipcMain.handle('setZBrowserProxy', async () => false)
  ipcMain.handle('clearZBrowserCache', async () => false)
  ipcMain.handle('ubrowserLogin', async () => ({ success: false }))

  // Provider：models 能力开启时暴露 AI 供应商；否则保持空 stub
  ipcMain.handle('providersGetProviders', async (_e, args?: { type?: string }) => {
    try {
      if (!isCapabilityEnabled('models')) return []
      const list = modelService.listPublicProviders()
      // type 过滤：llm/ai/chat 视为模型供应商；其余 type 仍返回空（留给插件 provider）
      const type = args?.type
      if (!type || type === 'llm' || type === 'ai' || type === 'chat' || type === 'model') {
        return list
      }
      return []
    } catch {
      return []
    }
  })
  ipcMain.handle('providersGetDefault', async () => {
    try {
      if (!isCapabilityEnabled('models')) return null
      const roles = modelService.getRoles()
      const assignment = roles['default-assistant']
      if (!assignment) return null
      const provider = modelService
        .listPublicProviders()
        .find((p) => p.id === assignment.providerId)
      if (!provider) return null
      return {
        providerId: provider.id,
        modelId: assignment.modelId,
        name: provider.name,
        type: provider.type,
      }
    } catch {
      return null
    }
  })
  ipcMain.handle('providersInvoke', async () => ({
    success: false,
    error: '模型调用由业务层实现',
  }))

  // FFmpeg
  ipcMain.handle('getFFmpegPath', async () => null)

  // 剪贴板历史（stub，需要原生模块实现监听）
  ipcMain.handle('clipboard:get-history', async () => ({ items: [], total: 0 }))
  ipcMain.handle('clipboard:search', async () => [])
  ipcMain.handle('clipboard:delete', async () => false)
  ipcMain.handle('clipboard:clear', async () => false)
  ipcMain.handle('clipboard:get-status', async () => ({ enabled: false }))
  ipcMain.handle('clipboard:write', async () => false)
  ipcMain.handle('clipboard:write-content', async () => false)
  ipcMain.handle('clipboard:update-config', async () => false)

  // 事件监听（stub，防止插件报错）
  ipcMain.on('main-push-query', (event) => {
    event.returnValue = []
  })
  ipcMain.on('main-push-select', (event) => {
    event.returnValue = false
  })
  ipcMain.on('hotkey-recorded', () => {})
  ipcMain.on('update-window-material', () => {})
  ipcMain.on('update-theme-info', () => {})
  ipcMain.on('log-entries', () => {})
  ipcMain.on('local-shortcuts-changed', () => {})
  ipcMain.on('apps-changed', () => {})
  ipcMain.on('command-aliases-changed', () => {})
  ipcMain.on('plugin-detach', () => {})
  ipcMain.on('call-plugin-method', (event) => {
    event.returnValue = null
  })
  ipcMain.on('get-plugin-mode', (event) => {
    event.returnValue = null
  })
  ipcMain.on('activate-list-mode', () => {})
  ipcMain.on('sub-input-change', () => {})
  ipcMain.on('sync:status-changed', () => {})
  ipcMain.on('sync:account-storage-changed', () => {})
}

/**
 * 初始化所有插件 API 模块
 * 每个模块的 init() 方法会注册各自的 IPC handler
 */
export function initPluginRuntime(): void {
  // 0. 加载原生模块（APP_ROOT 已就绪，.node 文件可正确定位）
  ensureNativeModule()
  // 1. 初始化统一分发器（plugin.api 通道）
  initPluginApiDispatcher()
  // 2. 注册 plugin.api 服务
  registerPluginApiServices_()
  // 3. 注册数据库 API
  registerDatabaseApis()
  // 4. 注册 Host 特有功能 stub
  registerHostStubs()
  // 5. 初始化各模块（直接 IPC 通道）
  clipboardAPI.init()
  deviceAPI.init()
  dialogAPI.init()
  httpAPI.init()
  inputAPI.init()
  lifecycleAPI.init()
  redirectAPI.init()
  screenAPI.init()
  shellAPI.init()
  toastAPI.init()
  toolsAPI.init()
  uiAPI.init()
  windowAPI.init()
}
