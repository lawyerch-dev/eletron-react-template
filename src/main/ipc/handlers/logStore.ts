import type { LogEntry } from '@ert/shared/types'

const MAX_LOG_ENTRIES = 2000
const logRingBuffer: LogEntry[] = []
let logBufferId = 0

export function getLogRingBuffer(): LogEntry[] {
  return logRingBuffer
}

export function clearLogRingBuffer(): boolean {
  logRingBuffer.length = 0
  return true
}

export function createLogEntry(
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

export function pushLogRing(entry: LogEntry): void {
  logRingBuffer.push(entry)
  if (logRingBuffer.length > MAX_LOG_ENTRIES) {
    logRingBuffer.splice(0, logRingBuffer.length - MAX_LOG_ENTRIES)
  }
}
