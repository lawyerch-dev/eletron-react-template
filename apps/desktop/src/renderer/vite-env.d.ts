/// <reference types="vite/client" />
import type { PluginBridge } from '@ert/shared/types'

declare global {
  interface Window {
    /** preload/index.ts 注入 */
    ipcRenderer: import('electron').IpcRenderer
    plugin: PluginBridge
    logEvents: {
      onLogEntry: (cb: (entry: LogEntry) => void) => () => void
      sendLog: (entry: { level: string; message: string; data?: unknown[] }) => void
    }
  }

  interface LogEntry {
    id: number
    level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
    source: 'main' | 'renderer' | 'plugin'
    timestamp: string
    message: string
    data?: unknown[]
  }
}

export {}
