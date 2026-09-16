import { IpcChannel } from '@shared/ipc'

export const logsService = {
  getAll: () => window.ipcRenderer.invoke(IpcChannel.GetLogs) as Promise<LogEntry[]>,
  getPath: () => window.ipcRenderer.invoke(IpcChannel.GetLogPath) as Promise<string>,
  clear: () => window.ipcRenderer.invoke(IpcChannel.LogClear) as Promise<boolean>,
  onEntry: (cb: (entry: LogEntry) => void) => window.logEvents.onLogEntry(cb),
  send: (entry: { level: string; message: string; data?: unknown[] }) =>
    window.logEvents.sendLog(entry),
}
