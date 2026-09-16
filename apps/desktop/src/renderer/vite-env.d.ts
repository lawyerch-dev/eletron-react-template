/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
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
