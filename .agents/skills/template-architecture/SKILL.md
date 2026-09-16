---
name: template-architecture
description: Electron React Template 架构约定。用于目录放哪、import 路径、IPC 契约、capabilities 开关、插件宿主、跨项目复用包等问题。改结构、加功能、抽包前必须加载。
---

# Template Architecture

本 skill 描述 **electron-react-template** 的架构契约。与根目录 `AGENTS.md` 冲突时以 `AGENTS.md` 为准。

## 1. 目录分层（closed set）

```
src/main/          主进程：app / services / features
src/preload/       contextBridge
src/renderer/      渲染进程源码（index.html、public 在此）
src/plugins/       内置插件源码
packages/shared/   @ert/shared — IPC、类型、工具、capabilities
packages/plugin-api/ @ert/plugin-api — window.host 类型
resources/         原生库、OCR 等打包资源
tests/             单测 + e2e
```

**根目录只放配置**，不要在根新建业务目录。

### Vite root 红线

`vite.config.ts` 的 `root` **必须是仓库根**。

`vite-plugin-electron` 以 `config.root` 作为：

1. Electron 进程的 `cwd`
2. `package.json` 查找根

若设成 `src/renderer`，开发启动会报：

```text
Unable to find Electron app at .../src/renderer
Cannot find module '.../src/renderer'
```

Renderer 入口通过 `build.rollupOptions.input = src/renderer/index.html` + dev middleware 映射 `/` 实现；打包后路径为 `dist/src/renderer/index.html`（见 `src/main/app/window.ts` 的 `getIndexHtmlPath`）。

## 2. 依赖方向

```
renderer/features → renderer/services → @ert/shared/ipc ← main/*
```

禁止：

- 页面里裸 `window.ipcRenderer`
- `@ert/shared` / `@ert/plugin-api` import electron 或 React
- 主进程 import React
- 从 `src/plugins/*` 反向 import 宿主业务代码

## 3. 新功能落点

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

## 4. Capabilities

唯一真源：`packages/shared/src/capabilities/config.ts`。

```ts
export const capabilities = {
  ocr: true,
  mcp: false,
  agent: false,
  plugins: true,
} as const
```

- 主进程：`src/main/features/capabilities/` 只 re-export + registry 懒加载
- 渲染：`src/renderer/capabilities/` 只 re-export + 路由聚合
- **禁止**在 main/renderer 的 config 里改布尔值

## 5. Import 别名

```ts
import { IpcChannel } from '@ert/shared/ipc'
import { formatT } from '@ert/shared/utils/plugin'
import { isCapabilityEnabled } from '@ert/shared/capabilities'
import type { HostApi } from '@ert/plugin-api'
import { Foo } from '@/features/foo'
```

配置见 `vite.config.ts` / `tsconfig.json` / `vitest.config.ts`（三者需同步）。

## 6. 插件宿主

- 全局 API：`window.host`（实现：`src/main/features/plugin-host/plugin-preload.js`）
- 类型：`@ert/plugin-api`
- 内置插件扫描根：开发 `src/plugins/`，打包 `resources/plugins/`（extraResources）
- 用户安装插件：`userData/plugins/`（运行时，不入库）
- 图标：`plugin-icon://`（本地）/ `market-icon://`（远程 GitHub 系）

## 7. 跨项目复用

1. 契约/工具 → `packages/*`（workspace 包）
2. 完整工具能力 → 插件，拷到新项目 `src/plugins/`
3. 新项目克隆后改：`package.json` name、`electron-builder.json` appId/productName/publish
4. 用 capabilities 开关裁剪壳能力

## 8. 预检

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

架构/目录变更后必须跑完整预检，并同步：

- `AGENTS.md`
- `README.zh-CN.md` / `README.md`
- `docs/guide/directory-structure.md`
