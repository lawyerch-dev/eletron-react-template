/**
 * 可抽插能力开关（壳应用裁剪入口）。
 * - 主进程：electron/main/capabilities/registry.ts 按开关懒加载
 * - 渲染进程：路由 / 侧边栏
 * 与 electron/main/capabilities/config.ts 保持同步。
 */
export const capabilities = {
  /** OCR：内置 ocr-service 插件 + 宿主 status IPC */
  ocr: true,
  /** MCP 客户端/工具桥（占位） */
  mcp: false,
  /** AI Agent 运行时（占位） */
  agent: false,
  /** 插件市场与「我的产品」 */
  plugins: true,
} as const

export type CapabilityId = keyof typeof capabilities

export function isCapabilityEnabled(id: CapabilityId): boolean {
  return capabilities[id] === true
}

export function enabledCapabilities(): CapabilityId[] {
  return (Object.keys(capabilities) as CapabilityId[]).filter((id) => capabilities[id])
}
