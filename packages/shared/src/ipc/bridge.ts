import type { IpcEventName, IpcEventPayload, IpcInput, IpcOutput, IpcRoute } from './routes'

/** preload 暴露的类型化 IPC 桥（window.api.ipcApi） */
export interface IpcApiBridge {
  request<R extends IpcRoute>(route: R, input: IpcInput<R>): Promise<IpcOutput<R>>
  on<E extends IpcEventName>(event: E, listener: (payload: IpcEventPayload<E>) => void): () => void
}

/** 宿主渲染层唯一 preload 面 */
export interface HostApi {
  ipcApi: IpcApiBridge
}
