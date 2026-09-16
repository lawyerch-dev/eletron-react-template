/** 市场单个插件描述（与主进程 market 模块保持一致） */
interface MarketPlugin {
  name: string
  version: string
  title?: string
  description?: string
  logo?: string
  author?: string
  homepage?: string
  size?: number
  downloadCount?: number
  updatedAt?: number
  publishedAt?: number
  categoryId?: number | null
  categoryTitle?: string
  downloadUrl?: string
  [key: string]: unknown
}

interface MarketListResult {
  success: boolean
  data?: MarketPlugin[]
  categories?: MarketCategory[]
  error?: string
}

interface MarketCategory {
  id: number
  title: string
  description?: string
  logo?: string
  plugins: MarketPlugin[]
}

/** 已安装插件记录 */
interface InstalledPluginInfo {
  name: string
  title: string
  version: string
  description?: string
  author?: string
  homepage?: string
  logo: string
  main?: string
  features?: unknown[]
  path: string
  storageKind: 'directory' | 'asar'
  installedAt: string
  downloadUrl?: string
  downloadCount?: number
  isBuiltin?: boolean
}

interface PluginDownloadProgress {
  pluginName: string
  status: 'downloading' | 'installing' | 'success' | 'error' | 'cancelled'
  progress: number | null
  error?: string
}

interface PluginBridge {
  marketList: () => Promise<MarketListResult>
  marketRecommendations: (limit?: number) => Promise<MarketPlugin[]>
  marketReadme: (
    pluginName: string,
  ) => Promise<{ success: boolean; content?: string; error?: string }>
  marketClearCache: () => Promise<void>
  installFromMarket: (plugin: {
    name: string
    downloadUrl?: string
  }) => Promise<{ success: boolean; plugin?: InstalledPluginInfo; error?: string }>
  installFromFile: () => Promise<{
    success: boolean
    plugin?: InstalledPluginInfo
    error?: string
    cancelled?: boolean
  }>
  cancelDownload: (name: string) => Promise<{ success: boolean; error?: string }>
  listInstalled: () => Promise<InstalledPluginInfo[]>
  deletePlugin: (pluginPath: string) => Promise<{ success: boolean; error?: string }>
  launch: (pluginPath: string) => Promise<{ success: boolean; error?: string }>
  closePlugin: (pluginPath: string) => Promise<{ success: boolean; error?: string }>
  runningPlugins: () => Promise<Array<{ name: string; path: string; running: boolean }>>
  onPluginsChanged: (cb: () => void) => () => void
  onDownloadProgress: (cb: (payload: PluginDownloadProgress) => void) => () => void
  onToast: (cb: (payload: unknown) => void) => () => void
}

interface Window {
  plugin: PluginBridge
}
