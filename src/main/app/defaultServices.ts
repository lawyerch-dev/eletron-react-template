import { initPluginSubsystem } from '../features/plugin-host'
import { initCapabilities, isCapabilityEnabled } from '../features/capabilities'
import { broadcastIpcEvent } from '../ipc'
import { registerService, type MainService } from './serviceRegistry'

/** 插件宿主：协议、运行时、内置插件扫描 */
export function createPluginHostService(): MainService {
  return {
    name: 'pluginHost',
    init() {
      initPluginSubsystem(() => {
        broadcastIpcEvent('plugin.changed', undefined as void)
      })
    },
  }
}

/** 可选能力（ocr/mcp/agent 业务初始化；IPC 路由在 initHostIpc） */
export function createCapabilitiesService(): MainService {
  return {
    name: 'capabilities',
    async init() {
      await initCapabilities()
    },
  }
}

/**
 * 按能力开关注册默认业务服务。
 * 在 initHostIpc 之后、打开主窗之前调用。
 */
export function registerDefaultServices(options: { pluginsEnabled: boolean }): void {
  if (options.pluginsEnabled) {
    registerService(createPluginHostService())
  }
  registerService(createCapabilitiesService())
}

export { isCapabilityEnabled }
