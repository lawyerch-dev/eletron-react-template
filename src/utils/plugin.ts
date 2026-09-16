/** 简易插值：formatT('key {count}', { count: 3 }) */
export type Vars = Record<string, string | number>

export function formatT(raw: string, vars?: Vars): string {
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : ''))
}

/** 本地路径 → plugin-icon://proxy/<encoded>；远程 http(s) 走 market-icon 代理 */
export function logoUrl(url: string | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return `market-icon://proxy/${encodeURIComponent(url)}`
  if (url.startsWith('plugin-icon://')) return url
  // file:///abs → plugin-icon://proxy/encoded
  if (url.startsWith('file://')) {
    try {
      const p = decodeURIComponent(url.replace(/^file:\/\//, ''))
      return `plugin-icon://proxy/${encodeURIComponent(p)}`
    } catch {
      return url.replace(/^file:\/\//, 'plugin-icon://proxy/')
    }
  }
  return url
}

/**
 * 轻量 HTML 消毒：用于渲染市场 README。
 * 纯字符串实现，不依赖 DOMParser，便于在渲染进程与测试环境共用。
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  let out = html
  // 去掉危险整块标签（含内容）
  out = out.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
  out = out.replace(/<iframe\b[\s\S]*?<\/iframe\s*>/gi, '')
  out = out.replace(/<object\b[\s\S]*?<\/object\s*>/gi, '')
  out = out.replace(/<embed\b[^>]*>/gi, '')
  out = out.replace(/<form\b[\s\S]*?<\/form\s*>/gi, '')
  out = out.replace(/<(link|meta|base)\b[^>]*>/gi, '')
  // 去掉 on* 事件属性
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  // 去掉 javascript: 协议
  out = out.replace(/\s(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*("|')?/gi, '')
  return out
}
