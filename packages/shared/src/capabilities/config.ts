/**
 * 能力裁剪总开关（主进程与渲染进程共用唯一真源）。
 * - 主进程：features/capabilities/registry.ts 按开关懒加载
 * - 渲染进程：renderer/capabilities/index.ts 聚合路由与导航
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
