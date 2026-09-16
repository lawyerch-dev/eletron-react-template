import { describe, it, expect } from 'vitest'

/** 与 installer.validateConfig 规则对齐的纯函数 */
function validateConfig(
  config: Record<string, unknown>,
  existingInstalled: Array<{ name: string; title?: string }>,
): { valid: boolean; error?: string } {
  const name = config.name as string
  const version = config.version as string
  if (!name || !version) return { valid: false, error: '缺少必填字段: name/version' }
  const hasFeatures = Array.isArray(config.features) && config.features.length > 0
  const hasTools = !!config.tools
  if (!hasFeatures && !hasTools && !config.main) {
    return { valid: false, error: '插件必须声明 features、tools 或 main 之一' }
  }
  const titleConflict = existingInstalled.find((p) => p.title === config.title && p.name !== name)
  if (titleConflict) {
    return {
      valid: false,
      error: `插件标题 "${config.title}" 已被插件 "${titleConflict.name}" 使用`,
    }
  }
  return { valid: true }
}

describe('installer validateConfig', () => {
  it('requires name and version', () => {
    expect(validateConfig({ name: 'a' }, []).valid).toBe(false)
    expect(validateConfig({ version: '1.0.0' }, []).valid).toBe(false)
  })

  it('requires features/tools/main', () => {
    expect(validateConfig({ name: 'a', version: '1.0.0' }, []).valid).toBe(false)
    expect(validateConfig({ name: 'a', version: '1.0.0', main: 'index.html' }, []).valid).toBe(true)
    expect(
      validateConfig({ name: 'a', version: '1.0.0', features: [{ code: 'x' }] }, []).valid,
    ).toBe(true)
  })

  it('rejects title conflict with different name', () => {
    const existing = [{ name: 'other', title: 'Hello' }]
    expect(
      validateConfig({ name: 'a', version: '1', title: 'Hello', main: 'i.html' }, existing).valid,
    ).toBe(false)
  })

  it('allows same name reinstall', () => {
    const existing = [{ name: 'a', title: 'Hello' }]
    expect(
      validateConfig({ name: 'a', version: '2', title: 'Hello', main: 'i.html' }, existing).valid,
    ).toBe(true)
  })
})
