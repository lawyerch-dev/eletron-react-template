import { describe, expect, it } from 'vitest'
import { MODEL_ROLES, MODEL_PROVIDER_PRESETS, findModelProviderPreset } from '@ert/shared'
import { capabilities } from '@ert/shared/capabilities'

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

  it('enables AI toolchain capabilities by default', () => {
    expect(capabilities.models).toBe(true)
    expect(capabilities.prompts).toBe(true)
    expect(capabilities.skills).toBe(true)
    expect(capabilities.webSearch).toBe(true)
    expect(capabilities.docs).toBe(true)
    expect(capabilities.embedding).toBe(true)
    expect(capabilities.env).toBe(true)
    expect(capabilities.agent).toBe(true)
  })
})
