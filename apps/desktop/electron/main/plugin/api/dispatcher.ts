import { ipcMain } from 'electron'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiHandler = (...args: any[]) => any

/**
 * 单一 API 注册表（与 utools pluginApiServices 一致）
 *
 * 所有插件 API handler 注册到同一个对象：
 * - 同步 API（由 ipcSendSync / ipcSend 触发 → ipcMain.on 分发）
 * - 异步 API（由 ipcInvoke 触发 → ipcMain.handle 分发）
 *
 * 每个 API name 只对应一种调用方式，没有冲突。
 */
const pluginApiServices: Record<string, ApiHandler> = {}

/**
 * 注册插件 API 服务
 * 多个模块各自调用此方法注册自己的 API，最终合并到同一个 pluginApiServices。
 */
export function registerPluginApiServices(services: Record<string, ApiHandler>): void {
  for (const key of Object.keys(services)) {
    if (pluginApiServices[key]) {
      console.warn(`[plugin.api:register] API "${key}" is being overwritten`)
    }
  }
  Object.assign(pluginApiServices, services)
}

/**
 * 初始化统一分发器
 *
 * 注册两个 plugin.api handler：
 * - ipcMain.on  → 处理 ipcSendSync / ipcSend 发来的同步请求
 * - ipcMain.handle → 处理 ipcInvoke 发来的异步请求
 *
 * 两者从同一个 pluginApiServices 查找 handler。
 */
export function initPluginApiDispatcher(): void {
  // 同步分发（ipcRenderer.sendSync / ipcRenderer.send → ipcMain.on）
  ipcMain.on('plugin.api', (event, apiName: string, args: unknown) => {
    const handler = pluginApiServices[apiName]
    if (!handler) {
      console.warn(`[plugin.api:dispatch] API "${apiName}" not found`)
      event.returnValue = new Error(`API "${apiName}" not found`)
      return
    }
    try {
      handler(event, args)
    } catch (e) {
      // 同步 handler 异常兜底：确保 event.returnValue 始终被设置
      if (event.returnValue === undefined || event.returnValue === null) {
        event.returnValue = e instanceof Error ? e : new Error(String(e))
      }
      console.error(`[plugin.api:sync] handler "${apiName}" threw:`, e)
    }
  })

  // 异步分发（ipcRenderer.invoke → ipcMain.handle）
  ipcMain.handle('plugin.api', async (event, apiName: string, args: unknown) => {
    const handler = pluginApiServices[apiName]
    if (!handler) {
      console.warn(`[plugin.api:dispatch] API "${apiName}" not found`)
      throw new Error(`API "${apiName}" not found`)
    }
    try {
      return await handler(event, args)
    } catch (e) {
      console.error(`[plugin.api:async] handler "${apiName}" threw:`, e)
      throw e
    }
  })
}
