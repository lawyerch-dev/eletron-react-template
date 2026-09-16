import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/fake-userData', isPackaged: false },
}))

vi.mock('../../electron/main/plugin/shared', () => ({
  getPluginsRoot: () => '/tmp/fake-plugins',
}))

vi.mock('../../electron/main/plugin/builtin', () => ({
  resolveBuiltinPluginsRoot: () => '/tmp/fake-builtin-plugins',
}))

import {
  isAllowedMarketIconUrl,
  isSafeExternalUrl,
  isSafePluginIconPath,
  MARKET_ICON_MAX_BYTES,
} from '../../electron/main/plugin/security'

describe('security helpers', () => {
  describe('isAllowedMarketIconUrl', () => {
    it('allows GitHub raw icon hosts', () => {
      expect(isAllowedMarketIconUrl('https://raw.githubusercontent.com/a/b/main/logo.png')).toBe(
        true,
      )
      expect(isAllowedMarketIconUrl('https://github.com/a/b/raw/main/logo.png')).toBe(true)
    })

    it('rejects non-http protocols and unknown hosts', () => {
      expect(isAllowedMarketIconUrl('file:///etc/passwd')).toBe(false)
      expect(isAllowedMarketIconUrl('https://evil.example.com/x.png')).toBe(false)
      expect(isAllowedMarketIconUrl('not-a-url')).toBe(false)
      expect(isAllowedMarketIconUrl('')).toBe(false)
    })
  })

  describe('isSafeExternalUrl', () => {
    it('allows http/https/mailto only', () => {
      expect(isSafeExternalUrl('https://example.com')).toBe(true)
      expect(isSafeExternalUrl('http://example.com')).toBe(true)
      expect(isSafeExternalUrl('mailto:a@b.com')).toBe(true)
      expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false)
      expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
      expect(isSafeExternalUrl('')).toBe(false)
    })
  })

  describe('isSafePluginIconPath', () => {
    it('rejects empty, null-byte, and non-image paths', () => {
      expect(isSafePluginIconPath('')).toBe(false)
      expect(isSafePluginIconPath('/tmp/fake-plugins/a/logo.txt')).toBe(false)
      expect(isSafePluginIconPath('/tmp/fake-plugins/a/logo.png\0')).toBe(false)
    })

    it('rejects paths outside plugin roots even with image extension', () => {
      expect(isSafePluginIconPath('/etc/passwd.png')).toBe(false)
      expect(isSafePluginIconPath('/tmp/other/logo.png')).toBe(false)
    })
  })

  it('exposes a positive market icon size cap', () => {
    expect(MARKET_ICON_MAX_BYTES).toBeGreaterThan(0)
  })
})
