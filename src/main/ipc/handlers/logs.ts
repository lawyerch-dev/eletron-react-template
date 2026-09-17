import log from 'electron-log/main'
import type { LogEntry } from '@ert/shared/types'
import { broadcastIpcEvent, registerIpcHandler } from '../IpcApiService'
import { clearLogRingBuffer, createLogEntry, getLogRingBuffer, pushLogRing } from './logStore'

const LOG_LEVELS: ReadonlySet<string> = new Set(['error', 'warn', 'info', 'debug', 'verbose'])

/** 向环缓冲写入并广播到所有窗口（供 main / plugin 复用）。 */
export function logFromMain(level: LogEntry['level'], message: string, data?: unknown[]): void {
  const entry = createLogEntry(level, 'main', message, data)
  pushLogRing(entry)
  broadcastIpcEvent('log.entry', entry)
}

export function registerLogsIpcHandlers(): void {
  registerIpcHandler('logs.get', () => getLogRingBuffer())
  registerIpcHandler('logs.get_path', () => log.transports.file.getFile().path)
  registerIpcHandler('logs.clear', () => clearLogRingBuffer())
  registerIpcHandler('logs.from_renderer', (_e, input) => {
    const level = LOG_LEVELS.has(input.level) ? (input.level as LogEntry['level']) : 'info'
    logFromMain(level, input.message, input.data)
  })
}
