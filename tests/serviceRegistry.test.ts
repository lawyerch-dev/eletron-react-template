import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron-log/main', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

import {
  __resetServiceRegistryForTests,
  bootstrapServices,
  disposeServices,
  getService,
  listServices,
  registerService,
  type MainService,
} from '../src/main/app/serviceRegistry'

describe('serviceRegistry', () => {
  beforeEach(() => {
    __resetServiceRegistryForTests()
  })

  afterEach(() => {
    __resetServiceRegistryForTests()
  })

  it('registers and inits services in order', async () => {
    const order: string[] = []
    registerService({
      name: 'a',
      init: () => {
        order.push('a')
      },
    })
    registerService({
      name: 'b',
      init: () => {
        order.push('b')
      },
    })

    await bootstrapServices()
    expect(order).toEqual(['a', 'b'])
    expect(listServices().map((s) => s.name)).toEqual(['a', 'b'])
    expect(getService('a')?.name).toBe('a')
  })

  it('rejects duplicate service names', () => {
    registerService({ name: 'dup', init: () => {} })
    expect(() => registerService({ name: 'dup', init: () => {} })).toThrow(/already registered/)
  })

  it('rejects register after bootstrap', async () => {
    registerService({ name: 'early' })
    await bootstrapServices()
    expect(() => registerService({ name: 'late' })).toThrow(/after bootstrap/)
  })

  it('disposes started services in reverse when a later init fails', async () => {
    const disposed: string[] = []
    const make = (name: string, fail = false): MainService => ({
      name,
      init: () => {
        if (fail) throw new Error(`${name} boom`)
      },
      dispose: () => {
        disposed.push(name)
      },
    })

    registerService(make('ok1'))
    registerService(make('ok2'))
    registerService(make('bad', true))

    await expect(bootstrapServices()).rejects.toThrow('bad boom')
    expect(disposed).toEqual(['ok2', 'ok1'])
  })

  it('disposeServices is idempotent and reverse order', async () => {
    const disposed: string[] = []
    registerService({
      name: 'x',
      dispose: () => {
        disposed.push('x')
      },
    })
    registerService({
      name: 'y',
      dispose: () => {
        disposed.push('y')
      },
    })
    await bootstrapServices()
    disposeServices()
    disposeServices()
    expect(disposed).toEqual(['y', 'x'])
  })
})
