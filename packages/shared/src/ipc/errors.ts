export type IpcErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'INTERNAL' | 'CANCELLED' | 'UNSUPPORTED'

export class IpcError extends Error {
  readonly code: IpcErrorCode
  readonly details?: unknown

  constructor(code: IpcErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'IpcError'
    this.code = code
    this.details = details
  }
}

export interface SerializedIpcError {
  code: IpcErrorCode
  message: string
  details?: unknown
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: SerializedIpcError }

export function toSerializedIpcError(error: unknown): SerializedIpcError {
  if (error instanceof IpcError) {
    return { code: error.code, message: error.message, details: error.details }
  }
  if (error instanceof Error) {
    return { code: 'INTERNAL', message: error.message }
  }
  return { code: 'INTERNAL', message: String(error) }
}

/**
 * 解包主进程 IpcResult：成功返回 data，失败抛 IpcError。
 * preload 的 request 必须调用本函数，禁止把 `{ ok, data }` 原样交给渲染层。
 */
export function unwrapIpcResult<T>(result: IpcResult<T>): T {
  if (result && typeof result === 'object' && 'ok' in result) {
    if (result.ok) return result.data
    const err = result.error
    throw new IpcError(
      err?.code ?? 'INTERNAL',
      err?.message ?? 'IpcApi request failed',
      err?.details,
    )
  }
  // 兼容旧 handler 直接返回业务数据的情况
  return result as T
}
