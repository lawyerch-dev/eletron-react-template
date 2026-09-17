import { describe, expect, it } from 'vitest'
import { MODEL_ROLES, MODEL_PROVIDER_PRESETS, findModelProviderPreset } from '@ert/shared'

describe('models shared contracts', () => {
  it('exposes default roles', () => {
    expect(MODEL_ROLES).toContain('default-assistant')
    expect(MODEL_ROLES).toContain('translate')
    expect(MODEL_ROLES.length).toBeGreaterThan(0)
  })

  it('includes china-ready and local presets', () => {
    const ollama = findModelProviderPreset('ollama')
    expect(ollama?.requiresApiKey).toBe(false)
    expect(MODEL_PROVIDER_PRESETS.some((p) => p.chinaReady)).toBe(true)
  })
})
