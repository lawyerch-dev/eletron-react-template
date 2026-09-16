import { describe, it, expect } from 'vitest'
import { formatT, logoUrl, sanitizeHtml } from '../src/utils/plugin'

describe('formatT', () => {
  it('replaces placeholders', () => {
    expect(formatT('共 {count} 个', { count: 3 })).toBe('共 3 个')
  })

  it('returns raw string without vars', () => {
    expect(formatT('hello')).toBe('hello')
  })

  it('leaves unknown placeholders empty', () => {
    expect(formatT('a {x} b', { y: 1 })).toBe('a  b')
  })
})

describe('logoUrl', () => {
  it('proxies remote http(s) via market-icon', () => {
    expect(logoUrl('https://raw.githubusercontent.com/a/b/logo.png')).toBe(
      `market-icon://proxy/${encodeURIComponent('https://raw.githubusercontent.com/a/b/logo.png')}`,
    )
  })

  it('rewrites file:// to plugin-icon proxy', () => {
    expect(logoUrl('file:///tmp/plugins/x/logo.png')).toBe(
      `plugin-icon://proxy/${encodeURIComponent('/tmp/plugins/x/logo.png')}`,
    )
  })

  it('passes through plugin-icon:// as-is', () => {
    expect(logoUrl('plugin-icon://proxy/' + encodeURIComponent('/tmp/x/logo.png'))).toBe(
      'plugin-icon://proxy/' + encodeURIComponent('/tmp/x/logo.png'),
    )
  })

  it('returns empty for missing url', () => {
    expect(logoUrl(undefined)).toBe('')
  })
})

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const out = sanitizeHtml('<p>ok</p><script>alert(1)</script>')
    expect(out).toContain('<p>ok</p>')
    expect(out).not.toContain('script')
  })

  it('strips on* handlers', () => {
    const out = sanitizeHtml('<img src="x.png" onerror="alert(1)">')
    expect(out).not.toContain('onerror')
    expect(out).toContain('src="x.png"')
  })

  it('strips javascript: hrefs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })
})
