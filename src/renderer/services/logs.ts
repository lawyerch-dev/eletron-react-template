import type { LogEntry, RendererLogInput } from '@ert/shared/types'
import { ipcApi } from '@/ipc'

export const logsService = {
  getAll: async (): Promise<LogEntry[]> => {
    const list = await ipcApi.request('logs.get', undefined as void)
    return Array.isArray(list) ? list : []
  },
  getPath: (): Promise<string> => ipcApi.request('logs.get_path', undefined as void),
  clear: (): Promise<boolean> => ipcApi.request('logs.clear', undefined as void),
  onEntry: (cb: (entry: LogEntry) => void) => ipcApi.on('log.entry', cb),
  send: (entry: RendererLogInput) => ipcApi.request('logs.from_renderer', entry),
}
