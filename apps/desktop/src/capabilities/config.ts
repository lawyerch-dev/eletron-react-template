/**
 * 可抽插能力开关（壳应用裁剪入口）。
 * - 主进程：electron/main/capabilities/registry.ts 按开关懒加载
 * - 渲染进程：capabilities/index.ts 聚合 features 下各模块 routes
 * 与 electron/main/capabilities/config.ts 保持同步。
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

export function enabledCapabilities(): CapabilityId[] {
  return (Object.keys(capabilities) as CapabilityId[]).filter((id) => capabilities[id])
}
