/**
 * 主进程能力开关。与 src/capabilities/config.ts 保持同步。
 */
export const capabilities = {
  ocr: true,
  mcp: false,
  agent: false,
  plugins: true,
} as const

export type CapabilityId = keyof typeof capabilities

export function isCapabilityEnabled(id: CapabilityId): boolean {
  return capabilities[id] === true
}
