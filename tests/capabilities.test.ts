import { describe, expect, it } from 'vitest'
import { capabilities, enabledCapabilities, isCapabilityEnabled } from '@ert/shared/capabilities'

describe('capabilities config', () => {
  it('is the single source of truth object', () => {
    expect(typeof capabilities).toBe('object')
    expect(Object.keys(capabilities).length).toBeGreaterThan(0)
  })

  it('isCapabilityEnabled matches the map', () => {
    for (const [id, on] of Object.entries(capabilities)) {
      expect(isCapabilityEnabled(id as keyof typeof capabilities)).toBe(on)
    }
  })

  it('enabledCapabilities only returns true flags', () => {
    const ids = enabledCapabilities()
    for (const id of ids) {
      expect(capabilities[id]).toBe(true)
    }
  })
})
