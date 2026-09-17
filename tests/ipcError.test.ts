import { describe, expect, it } from 'vitest'
import { IpcError, toSerializedIpcError, unwrapIpcResult } from '@ert/shared/ipc'

describe('IpcError', () => {
  it('serializes IpcError with code and details', () => {
    const err = new IpcError('VALIDATION', 'bad input', { field: 'route' })
    const s = toSerializedIpcError(err)
    expect(s).toEqual({
      code: 'VALIDATION',
      message: 'bad input',
      details: { field: 'route' },
    })
  })

  it('maps plain Error to INTERNAL', () => {
    const s = toSerializedIpcError(new Error('oops'))
    expect(s.code).toBe('INTERNAL')
    expect(s.message).toBe('oops')
  })

  it('maps unknown values to INTERNAL', () => {
    expect(toSerializedIpcError('nope')).toEqual({
      code: 'INTERNAL',
      message: 'nope',
    })
  })
})

describe('unwrapIpcResult', () => {
  it('returns data on ok envelope', () => {
    expect(unwrapIpcResult({ ok: true, data: [1, 2, 3] })).toEqual([1, 2, 3])
  })

  it('throws IpcError on failure envelope', () => {
    expect(() =>
      unwrapIpcResult({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'nope', details: { x: 1 } },
      }),
    ).toThrow(IpcError)
    try {
      unwrapIpcResult({ ok: false, error: { code: 'VALIDATION', message: 'bad' } })
    } catch (e) {
      expect(e).toBeInstanceOf(IpcError)
      expect((e as IpcError).code).toBe('VALIDATION')
      expect((e as IpcError).message).toBe('bad')
    }
  })

  it('passes through non-envelope values (legacy handlers)', () => {
    expect(unwrapIpcResult([{ name: 'p' }] as never)).toEqual([{ name: 'p' }])
    expect(unwrapIpcResult(undefined as never)).toBeUndefined()
  })
})
