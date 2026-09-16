import { describe, it, expect } from 'vitest'

/** 与 market.ts 中 resolveRepoUrl / isAbsoluteUrl 保持一致的纯函数副本，便于单测 */
const GITHUB_RAW = 'https://raw.githubusercontent.com/lawyerch-dev/cc-ai-tools-plugins/main'

function resolveRepoUrl(relative: string): string {
  const trimmed = relative.replace(/^\.?\//, '')
  return `${GITHUB_RAW}/${trimmed}`
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function mapLogo(logo?: string): string | undefined {
  if (!logo) return undefined
  return isAbsoluteUrl(logo) ? logo : resolveRepoUrl(logo)
}

describe('market logo mapping', () => {
  it('resolves relative logo to raw github url', () => {
    expect(mapLogo('plugins/hello-world/logo.png')).toBe(
      'https://raw.githubusercontent.com/lawyerch-dev/cc-ai-tools-plugins/main/plugins/hello-world/logo.png',
    )
  })

  it('keeps absolute urls unchanged', () => {
    expect(mapLogo('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
  })

  it('handles leading ./', () => {
    expect(mapLogo('./plugins/x/logo.svg')).toBe(
      'https://raw.githubusercontent.com/lawyerch-dev/cc-ai-tools-plugins/main/plugins/x/logo.svg',
    )
  })

  it('returns undefined when missing', () => {
    expect(mapLogo(undefined)).toBeUndefined()
  })
})
