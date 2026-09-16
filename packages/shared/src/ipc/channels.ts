/**
 * 主进程 ↔ 渲染进程 IPC 通道名（契约）。
 * 主进程注册 handler、preload invoke、renderer service 都必须引用此处。
 */
export const IpcChannel = {
  // logs
  GetLogs: 'get-logs',
  GetLogPath: 'get-log-path',
  LogClear: 'log:clear',
  LogFromRenderer: 'log:from-renderer',
  LogEntry: 'log-entry',

  // update
  CheckUpdate: 'check-update',
  StartDownload: 'start-download',
  CancelDownload: 'cancel-download',
  QuitAndInstall: 'quit-and-install',
  UpdateCanAvailable: 'update-can-available',
  UpdateError: 'update-error',
  DownloadProgress: 'download-progress',
  UpdateDownloaded: 'update-downloaded',

  // plugin market / host
  PluginMarketList: 'plugin:market-list',
  PluginMarketRecommendations: 'plugin:market-recommendations',
  PluginMarketReadme: 'plugin:market-readme',
  PluginMarketClearCache: 'plugin:market-clear-cache',
  PluginMarketInstall: 'plugin:market-install',
  PluginImportFromFile: 'plugin:import-from-file',
  PluginMarketCancel: 'plugin:market-cancel',
  PluginList: 'plugin:list',
  PluginDelete: 'plugin:delete',
  PluginLaunch: 'plugin:launch',
  PluginClose: 'plugin:close',
  PluginRunning: 'plugin:running',
  PluginsChanged: 'plugins-changed',
  PluginMarketDownloadProgress: 'plugin-market-download-progress',
  PluginToast: 'plugin-toast',

  // capabilities
  OcrStatus: 'ocr:status',

  // shell
  OpenWin: 'open-win',
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]
