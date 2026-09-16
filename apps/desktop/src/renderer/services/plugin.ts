import { IpcChannel } from '@shared/ipc'

/** 插件市场 / 安装运行 —— 渲染进程 service（经 preload window.plugin） */
export const pluginService = {
  marketList: () => window.plugin.marketList(),
  marketRecommendations: (limit?: number) => window.plugin.marketRecommendations(limit),
  marketReadme: (pluginName: string) => window.plugin.marketReadme(pluginName),
  marketClearCache: () => window.plugin.marketClearCache(),
  installFromMarket: (plugin: { name: string; downloadUrl?: string }) =>
    window.plugin.installFromMarket(plugin),
  installFromFile: () => window.plugin.installFromFile(),
  cancelDownload: (name: string) => window.plugin.cancelDownload(name),
  listInstalled: () => window.plugin.listInstalled(),
  deletePlugin: (pluginPath: string) => window.plugin.deletePlugin(pluginPath),
  launch: (pluginPath: string) => window.plugin.launch(pluginPath),
  closePlugin: (pluginPath: string) => window.plugin.closePlugin(pluginPath),
  runningPlugins: () => window.plugin.runningPlugins(),
  onPluginsChanged: (cb: () => void) => window.plugin.onPluginsChanged(cb),
  onDownloadProgress: (cb: (payload: PluginDownloadProgress) => void) =>
    window.plugin.onDownloadProgress(cb as (payload: unknown) => void),
  onToast: (cb: (payload: { message: string; type?: string }) => void) =>
    window.plugin.onToast(cb as (payload: unknown) => void),
} as const

/** 与 IpcChannel 对齐，便于排查通道名 */
export const pluginChannels = {
  marketList: IpcChannel.PluginMarketList,
  listInstalled: IpcChannel.PluginList,
} as const
