/// <reference types="vite/client" />
import type { HostApi } from '@ert/shared/ipc'
import type { LogEntry as SharedLogEntry } from '@ert/shared/types'

declare global {
  interface Window {
    /** preload 注入的唯一宿主 API 面（禁止扩展为完整 ipcRenderer） */
    api: HostApi
  }

  /** 兼容既有组件里的全局 LogEntry 引用；实现见 @ert/shared/types */
  type LogEntry = SharedLogEntry
}

export {}
