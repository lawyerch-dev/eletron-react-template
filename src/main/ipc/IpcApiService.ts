import { BrowserWindow, ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron'
import {
  IPC_API_EVENT,
  IPC_API_REQUEST,
  toSerializedIpcError,
  type IpcEventName,
  type IpcEventPayload,
  type IpcInput,
  type IpcOutput,
  type IpcResult,
  type IpcRoute,
} from '@ert/shared/ipc'

export type IpcHandler<R extends IpcRoute> = (
  event: IpcMainInvokeEvent,
  input: IpcInput<R>,
) => IpcOutput<R> | Promise<IpcOutput<R>>

const handlers = new Map<string, IpcHandler<IpcRoute>>()
let transportRegistered = false

/** 注册一条 IpcApi 路由；重复注册直接抛错，避免静默覆盖。 */
export function registerIpcHandler<R extends IpcRoute>(route: R, handler: IpcHandler<R>): void {
  if (handlers.has(route)) {
    throw new Error(`IpcApi route already registered: ${route}`)
  }
  handlers.set(route, handler as unknown as IpcHandler<IpcRoute>)
}

/** 注册唯一传输通道（ipc-api:request）。须在任何 window 创建前调用。 */
export function initIpcApiTransport(): void {
  if (transportRegistered) return
  transportRegistered = true

  ipcMain.handle(
    IPC_API_REQUEST,
    async (event, route: string, input: unknown): Promise<IpcResult<unknown>> => {
      const handler = handlers.get(route)
      if (!handler) {
        return {
          ok: false,
          error: toSerializedIpcError(new Error(`Unknown IpcApi route: ${route}`)),
        }
      }
      try {
        const data = await handler(event, input as never)
        return { ok: true, data }
      } catch (error) {
        return { ok: false, error: toSerializedIpcError(error) }
      }
    },
  )
}

/** 广播到所有窗口（事件名 + payload，经 ipc-api:event）。 */
export function broadcastIpcEvent<E extends IpcEventName>(
  event: E,
  payload: IpcEventPayload<E>,
): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_API_EVENT, event, payload)
    }
  }
}

/** 定向发送到单个 WebContents。 */
export function sendIpcEvent<E extends IpcEventName>(
  webContents: WebContents,
  event: E,
  payload: IpcEventPayload<E>,
): void {
  if (!webContents.isDestroyed()) {
    webContents.send(IPC_API_EVENT, event, payload)
  }
}
