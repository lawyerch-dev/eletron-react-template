import { useEffect } from 'react'
import type { IpcEventName, IpcEventPayload } from '@ert/shared/ipc'
import { ipcApi } from './index'

/**
 * 订阅 IpcApi 事件；listener 变化会重订阅。
 * 返回的 cleanup 在卸载时自动执行。
 */
export function useIpcOn<E extends IpcEventName>(
  event: E,
  listener: (payload: IpcEventPayload<E>) => void,
): void {
  useEffect(() => {
    return ipcApi.on(event, listener)
  }, [event, listener])
}
