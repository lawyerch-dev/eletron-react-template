---
name: template-architecture
description: electron-react-template 架构约定的实战 reference 附录。补充 AGENTS.md 的出错信息、示例代码、跨项目复用步骤；规则与契约以 AGENTS.md 为唯一权威。
---

# Template Architecture — Reference Appendix

> **AGENTS.md 是唯一权威。** 本文件是它的实战 reference 附录，补充：
> - Vite/Electron 的具体出错信息与排查路径
> - 新功能落点的细分路径（services vs features vs types vs utils）
> - Capabilities 配置的完整代码示例
> - 跨项目复用的具体步骤
>
> 与 AGENTS.md 冲突时以 AGENTS.md 为准。规则、禁止清单、依赖方向等不要在本文件复述——以 AGENTS.md 为准。

## 1. Vite root 出错信息

`vite-plugin-electron` 以 `vite.config.ts` 的 `root` 作为：

1. Electron 进程的 `cwd`
2. `package.json` 查找根

若误把 `root` 设成 `src/renderer`，开发启动会报：

```text
Unable to find Electron app at .../src/renderer
Cannot find module '.../src/renderer'
```

正确做法：`root` 保持仓库根，Renderer 入口通过 `build.rollupOptions.input = src/renderer/index.html` + dev middleware 映射 `/`。打包后 HTML 路径为 `dist/src/renderer/index.html`，由 `src/main/app/window.ts` 的 `getIndexHtmlPath` 解析。

## 2. 新功能落点（细分）

| 类型 | 路径 |
|------|------|
| 业务页面/组件 | `src/renderer/features/<name>/` |
| 渲染 IPC 封装 | `src/renderer/services/<name>.ts` |
| 主进程可测业务 | `src/main/services/` |
| 主进程重量级子系统 | `src/main/features/<name>/` |
| IPC 通道常量 | `packages/shared/src/ipc/channels.ts` |
| 跨进程类型 | `packages/shared/src/types/` |
| 纯工具 | `packages/shared/src/utils/` |
| 能力开关 | `packages/shared/src/capabilities/config.ts` |
| 插件 | `src/plugins/<name>/`（含 `plugin.json`） |

区分原则：能放进 `packages/shared` 的纯类型/纯工具，不要塞进 `src/main` 或 `src/renderer`——前者跨进程可复用，后两者只能各自用到。

## 3. Capabilities 完整示例

唯一真源：`packages/shared/src/capabilities/config.ts`。

```ts
export const capabilities = {
  ocr: true,
  mcp: false,
  agent: false,
  plugins: true,
} as const
```

- 主进程：`src/main/features/capabilities/` 只做 re-export + registry 懒加载
- 渲染：`src/renderer/capabilities/` 只做 re-export + 路由聚合
- **禁止**在 main/renderer 的 config 里改布尔值（lint 已拦）

新增 capability 时按 AGENTS.md §3「能力集成约定」的 3 步走：先在 `config.ts` 开关，再补 IPC 契约，再放页面。

## 4. 跨项目复用具体步骤

本仓库是可克隆模板。新项目：

1. **改标识符**
   - `package.json` 的 `name`、`version`、`description`
   - `electron-builder.json` 的 `appId`、`productName`、`publish` 字段
2. **裁 capabilities**：`packages/shared/src/capabilities/config.ts` 把不需要的能力置 `false`
3. **拷贝工具**
   - 完整工具能力 → 整目录拷到新项目 `src/plugins/`
   - 纯契约/类型/工具 → 抽到 `packages/*`，新项目以 workspace 包形式复用
4. **更新文档**：`AGENTS.md`、`README.zh-CN.md`、`docs/guide/directory-structure.md` 改项目名、链接、示例
5. **跑预检**：`pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`

不建议把业务代码（`src/renderer/features/*`、`src/main/features/*`）整目录拷过去——业务应在新项目里重写，模板只承载壳与能力。