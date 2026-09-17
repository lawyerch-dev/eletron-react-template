/**
 * 渲染进程日志捕获
 * 拦截 console 方法，经 IpcApi 发送到主进程统一管理
 */
import { logsService } from '@/services'

const LOG_LEVEL_MAP: Record<string, string> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
}

const originalConsole: Partial<Record<keyof Console, (...args: unknown[]) => void>> = {}

function captureConsole(level: string): void {
  const method = level as keyof Console
  originalConsole[method] = console[method] as (...args: unknown[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(console as any)[method] = (...args: unknown[]) => {
    originalConsole[method]?.(...args)
    try {
      const message = args
        .map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
        .join(' ')
      void logsService.send({
        level: LOG_LEVEL_MAP[level] || 'info',
        message,
        data: args.length > 1 ? args.slice(1) : undefined,
      })
    } catch {
      // ignore
    }
  }
}

/** 初始化日志捕获（在应用启动时调用） */
export function initLogger(): void {
  if (typeof window === 'undefined' || !window.api?.ipcApi) return
  captureConsole('log')
  captureConsole('info')
  captureConsole('warn')
  captureConsole('error')
  captureConsole('debug')
}
