import { BrowserWindow, app, ipcMain } from 'electron'
import log from 'electron-log/main'
import { IpcChannel } from '@ert/shared/ipc'

export interface LogEntry {
  id: number
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
  source: 'main' | 'renderer' | 'plugin'
  timestamp: string
  message: string
  data?: unknown[]
}

const MAX_LOG_ENTRIES = 2000
const logRingBuffer: LogEntry[] = []
let logBufferId = 0

function pushLog(entry: LogEntry): void {
  logRingBuffer.push(entry)
  if (logRingBuffer.length > MAX_LOG_ENTRIES) {
    logRingBuffer.splice(0, logRingBuffer.length - MAX_LOG_ENTRIES)
  }
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) {
      w.webContents.send(IpcChannel.LogEntry, entry)
    }
  }
}

function createLogEntry(
  level: LogEntry['level'],
  source: LogEntry['source'],
  message: string,
  data?: unknown[],
): LogEntry {
  return {
    id: ++logBufferId,
    level,
    source,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 23),
    message,
    data,
  }
}

/** 初始化 electron-log 与渲染进程日志 IPC */
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

  ipcMain.handle(IpcChannel.GetLogs, async () => logRingBuffer)
  ipcMain.handle(IpcChannel.GetLogPath, () => log.transports.file.getFile().path)
  ipcMain.handle(IpcChannel.LogClear, () => {
    logRingBuffer.length = 0
    return true
  })
  ipcMain.handle(
    IpcChannel.LogFromRenderer,
    (_event, entry: { level: string; message: string; data?: unknown[] }) => {
      const level = ['error', 'warn', 'info', 'debug', 'verbose'].includes(entry.level)
        ? (entry.level as LogEntry['level'])
        : 'info'
      pushLog(createLogEntry(level, 'renderer', entry.message, entry.data))
    },
  )
}

/** 向主进程日志环缓冲写入（供 plugin 等模块复用） */
export function logFromMain(level: LogEntry['level'], message: string, data?: unknown[]): void {
  pushLog(createLogEntry(level, 'main', message, data))
}
