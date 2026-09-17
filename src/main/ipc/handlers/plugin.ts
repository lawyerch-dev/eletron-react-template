import { dialog } from 'electron'
import { pluginMarket } from '../../features/plugin-host/installer/market'
import { installer } from '../../features/plugin-host/installer/installer'
import { registry } from '../../features/plugin-host/runtime/registry'
import { runner } from '../../features/plugin-host/runtime/runner'
import { registerIpcHandler } from '../IpcApiService'

/** 插件域 IpcApi 路由（市场 / 安装 / 运行）。须在 initPluginSubsystem 之后调用。 */
export function registerPluginIpcHandlers(): void {
  registerIpcHandler('plugin.market.list', () => pluginMarket.fetchPluginMarket())
  registerIpcHandler('plugin.market.recommendations', (_e, input) =>
    pluginMarket.fetchRecommendations(input?.limit),
  )
  registerIpcHandler('plugin.market.readme', (_e, input) =>
    pluginMarket.fetchReadme(input.pluginName),
  )
  registerIpcHandler('plugin.market.clear_cache', () => {
    pluginMarket.clearCache()
  })
  registerIpcHandler('plugin.market.install', (_e, input) => installer.installFromMarket(input))
  registerIpcHandler('plugin.market.cancel', (_e, input) => installer.cancelDownload(input.name))
  registerIpcHandler('plugin.import_from_file', async () => {
    const result = await dialog.showOpenDialog({
      title: '导入插件',
      filters: [{ name: 'Host 插件', extensions: ['zpx', 'zip'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true }
    }
    return installer.installFromPath(result.filePaths[0])
  })
  registerIpcHandler('plugin.list', () => registry.list())
  registerIpcHandler('plugin.delete', async (_e, input) => {
    await runner.forceClose(input.pluginPath)
    return registry.delete(input.pluginPath)
  })
  registerIpcHandler('plugin.launch', (_e, input) => {
    const plugin = registry.list().find((p) => p.path === input.pluginPath)
    if (!plugin) return { success: false, error: '插件不存在' }
    return runner.launch(plugin)
  })
  registerIpcHandler('plugin.close', (_e, input) => runner.closePlugin(input.pluginPath))
  registerIpcHandler('plugin.running', () => runner.getRunningPlugins())
}
