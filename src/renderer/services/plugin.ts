import type {
  InstalledPluginInfo,
  MarketListResult,
  MarketPlugin,
  PluginDownloadProgress,
} from '@ert/shared/types'
import { ipcApi } from '@/ipc'

async function asArray<T>(promise: Promise<T[]>): Promise<T[]> {
  const value = await promise
  return Array.isArray(value) ? value : []
}

/** 插件市场 / 安装运行 —— 渲染进程 service（经 IpcApi） */
export const pluginService = {
  marketList: (): Promise<MarketListResult> =>
    ipcApi.request('plugin.market.list', undefined as void),
  marketRecommendations: (limit?: number): Promise<MarketPlugin[]> =>
    asArray(ipcApi.request('plugin.market.recommendations', { limit })),
  marketReadme: (pluginName: string) => ipcApi.request('plugin.market.readme', { pluginName }),
  marketClearCache: () => ipcApi.request('plugin.market.clear_cache', undefined as void),
  installFromMarket: (plugin: { name: string; downloadUrl?: string }) =>
    ipcApi.request('plugin.market.install', plugin),
  installFromFile: () => ipcApi.request('plugin.import_from_file', undefined as void),
  cancelDownload: (name: string) => ipcApi.request('plugin.market.cancel', { name }),
  listInstalled: (): Promise<InstalledPluginInfo[]> =>
    asArray(ipcApi.request('plugin.list', undefined as void)),
  deletePlugin: (pluginPath: string) => ipcApi.request('plugin.delete', { pluginPath }),
  launch: (pluginPath: string) => ipcApi.request('plugin.launch', { pluginPath }),
  closePlugin: (pluginPath: string) => ipcApi.request('plugin.close', { pluginPath }),
  runningPlugins: () => asArray(ipcApi.request('plugin.running', undefined as void)),
  onPluginsChanged: (cb: () => void) =>
    ipcApi.on('plugin.changed', () => {
      cb()
    }),
  onDownloadProgress: (cb: (payload: PluginDownloadProgress) => void) =>
    ipcApi.on('plugin.download.progress', cb),
  onToast: (cb: (payload: { message: string; type?: string }) => void) =>
    ipcApi.on('plugin.toast', cb),
}
