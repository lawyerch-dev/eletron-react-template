function slug(value: string): string {
  const ascii = value
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
  return ascii || 'x'
}

function shortHash(input: string): string {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 8)
}

/** 对齐 Cherry 的 mcp__server__tool wire id */
export function buildMcpToolWireId(input: {
  serverId: string
  serverName: string
  toolName: string
}): string {
  const serverPart = slug(input.serverName)
  const toolPart = slug(input.toolName)
  const suffix = '_' + shortHash(input.serverId + '\0' + input.toolName)
  const body = ('mcp__' + serverPart + '__' + toolPart)
    .slice(0, 63 - suffix.length)
    .replace(/_+$/, '')
  return body + suffix
}
