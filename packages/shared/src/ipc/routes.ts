import type {
  InstalledPluginInfo,
  MarketListResult,
  MarketPlugin,
  PluginDownloadProgress,
} from '../types/plugin'
import type { LogEntry, RendererLogInput } from '../types/log'
import type {
  CheckUpdateResult,
  UpdateErrorPayload,
  UpdateProgressInfo,
  UpdateVersionInfo,
} from '../types/update'
import type { OcrRecognizeInput, OcrRecognizeResult, OcrStatus } from '../types/ocr'
import type {
  McpCallToolResult,
  McpServerConfig,
  McpServerLogEntry,
  McpServerPreset,
  McpServerStatus,
  McpToolInfo,
} from '../types/mcp'

/**
 * 请求路由契约：route 为 resource.verb 点分 snake_case。
 * 新增能力 = 在此补 map + main 注册 handler，禁止另开裸通道。
 */
export interface IpcRequestMap {
  // plugin
  'plugin.market.list': { input: void; output: MarketListResult }
  'plugin.market.recommendations': {
    input: { limit?: number } | undefined
    output: MarketPlugin[]
  }
  'plugin.market.readme': {
    input: { pluginName: string }
    output: { success: boolean; content?: string; error?: string }
  }
  'plugin.market.clear_cache': { input: void; output: void }
  'plugin.market.install': {
    input: { name: string; downloadUrl?: string }
    output: { success: boolean; plugin?: InstalledPluginInfo; error?: string }
  }
  'plugin.market.cancel': {
    input: { name: string }
    output: { success: boolean; error?: string }
  }
  'plugin.import_from_file': {
    input: void
    output: {
      success: boolean
      plugin?: InstalledPluginInfo
      error?: string
      cancelled?: boolean
    }
  }
  'plugin.list': { input: void; output: InstalledPluginInfo[] }
  'plugin.delete': {
    input: { pluginPath: string }
    output: { success: boolean; error?: string }
  }
  'plugin.launch': {
    input: { pluginPath: string }
    output: { success: boolean; error?: string }
  }
  'plugin.close': {
    input: { pluginPath: string }
    output: { success: boolean; error?: string }
  }
  'plugin.running': {
    input: void
    output: Array<{ name: string; path: string; running: boolean }>
  }

  // logs
  'logs.get': { input: void; output: LogEntry[] }
  'logs.get_path': { input: void; output: string }
  'logs.clear': { input: void; output: boolean }
  'logs.from_renderer': { input: RendererLogInput; output: void }

  // update
  'update.check': { input: void; output: CheckUpdateResult }
  'update.start_download': { input: void; output: void }
  'update.cancel_download': { input: void; output: void }
  'update.quit_and_install': { input: void; output: void }

  // window
  'window.open': { input: { route: string }; output: void }

  // capabilities: ocr
  'ocr.status': { input: void; output: OcrStatus }
  'ocr.recognize': { input: OcrRecognizeInput; output: OcrRecognizeResult }

  // capabilities: mcp
  'mcp.list_servers': { input: void; output: McpServerStatus[] }
  'mcp.connect': { input: { serverId: string }; output: McpServerStatus }
  'mcp.disconnect': { input: { serverId: string }; output: McpServerStatus }
  'mcp.list_tools': {
    input: { serverId?: string } | undefined
    output: McpToolInfo[]
  }
  'mcp.call_tool': {
    input: { serverId: string; toolName: string; args?: Record<string, unknown> }
    output: McpCallToolResult
  }
  'mcp.save_servers': { input: { servers: McpServerConfig[] }; output: McpServerConfig[] }
  'mcp.list_presets': { input: void; output: McpServerPreset[] }
  'mcp.add_preset': {
    input: {
      presetId: string
      args?: string[]
      env?: Record<string, string>
    }
    output: { config: McpServerConfig; servers: McpServerConfig[] }
  }
  'mcp.set_active': {
    input: { serverId: string; active: boolean }
    output: McpServerStatus
  }
  'mcp.get_logs': {
    input: { serverId: string }
    output: McpServerLogEntry[]
  }
}

export type IpcRoute = keyof IpcRequestMap
export type IpcInput<R extends IpcRoute> = IpcRequestMap[R]['input']
export type IpcOutput<R extends IpcRoute> = IpcRequestMap[R]['output']

/** 主进程 → 渲染进程事件契约 */
export interface IpcEventMap {
  'log.entry': LogEntry
  'plugin.changed': void
  'plugin.download.progress': PluginDownloadProgress
  'plugin.toast': { message: string; type?: string }
  'update.can_available': UpdateVersionInfo
  'update.error': UpdateErrorPayload
  'update.progress': UpdateProgressInfo
  'update.downloaded': void
}

export type IpcEventName = keyof IpcEventMap
export type IpcEventPayload<E extends IpcEventName> = IpcEventMap[E]
