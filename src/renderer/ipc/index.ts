import type {
  IpcApiBridge,
  IpcEventName,
  IpcEventPayload,
  IpcInput,
  IpcOutput,
  IpcRoute,
} from '@ert/shared/ipc'

let warned = false

function getBridge(): IpcApiBridge | null {
  if (typeof window === 'undefined' || !window.api?.ipcApi) {
    if (!warned) {
      warned = true
      console.warn('[ipcApi] bridge is not available (preload not loaded)')
    }
    return null
  }
  return window.api.ipcApi
}

function noopUnsubscribe(): () => void {
  return () => {}
}

/**
 * 类型化 IPC 门面。
 * preload 未加载时 request 会 reject、on 返回 no-op，避免渲染层在 bridge 失败时整页崩溃。
 */
export const ipcApi: IpcApiBridge = {
  request<R extends IpcRoute>(route: R, input: IpcInput<R>): Promise<IpcOutput<R>> {
    const bridge = getBridge()
    if (!bridge) {
      return Promise.reject(new Error(`IpcApi bridge is not available (route: ${route})`))
    }
    return bridge.request(route, input)
  },
  on<E extends IpcEventName>(
    event: E,
    listener: (payload: IpcEventPayload<E>) => void,
  ): () => void {
    const bridge = getBridge()
    if (!bridge) {
      return noopUnsubscribe()
    }
    return bridge.on(event, listener)
  },
}
