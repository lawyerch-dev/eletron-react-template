export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose'
export type LogSource = 'main' | 'renderer' | 'plugin'

export interface LogEntry {
  id: number
  level: LogLevel
  source: LogSource
  timestamp: string
  message: string
  data?: unknown[]
}

export interface RendererLogInput {
  level: string
  message: string
  data?: unknown[]
}
