import { app } from 'electron'
import log from 'electron-log/main'
import type { LogEntry } from '@ert/shared/types'
import { broadcastIpcEvent } from '../ipc/IpcApiService'
import { createLogEntry, pushLogRing } from '../ipc/handlers/logStore'

export type { LogEntry }

function pushLog(entry: LogEntry): void {
  pushLogRing(entry)
  broadcastIpcEvent('log.entry', entry)
}

/** 初始化 electron-log 与主进程日志钩子（IPC 路由由 ipc/handlers/logs 注册）。 */
export function initLogging(): void {
  log.initialize()
  log.transports.file.level = app.isPackaged ? 'info' : 'silly'
  log.transports.console.level = app.isPackaged ? 'info' : 'silly'

  log.info('=== App starting ===')
  log.info(`Version: ${app.getVersion()}`)
  log.info(`Platform: ${process.platform} ${process.arch}`)
  log.info(`Electron: ${process.versions.electron}`)

  log.hooks.push((_message, transport) => {
    if (transport !== log.transports.console) return _message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (_message as any).data
    if (!Array.isArray(data) || data.length === 0) return _message
    const first = String(data[0])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const level = (_message as any).level || 'info'
    pushLog(createLogEntry(level as LogEntry['level'], 'main', first, data.slice(1)))
    return _message
  })
}

/** 向主进程日志环缓冲写入（供 plugin 等模块复用） */
export function logFromMain(level: LogEntry['level'], message: string, data?: unknown[]): void {
  pushLog(createLogEntry(level, 'main', message, data))
}
