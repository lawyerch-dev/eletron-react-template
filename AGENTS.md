# Agent Instructions

本文件是 AI 编码代理与协作者的**唯一权威约定**。`CLAUDE.md` 通过 `@AGENTS.md` 引用本文件。

根目录只放构建配置；源码一律进 `src/`；可复用契约进 `packages/`。

---

## Guiding Principles

### Think Before Coding

- 不确定时先问，不要静默选一种解释。
- 有更简单方案时直接指出，必要时反对过度设计。
- 多方案并存时列出取舍，让用户决策。

### Simplicity First

- 只写解决问题所需的最小代码，不预留未要求的抽象。
- 注释只解释 *why*，不复述 *what*；导出 API 的 TSDoc 除外。
- 200 行能压成 50 行就重写。

### Surgical Changes

- 只碰任务相关文件，不顺手重构无关代码。
- 与现有风格保持一致，即使你会写得不一样。
- 自己改动导致的孤儿 import/变量要删掉；既有死代码只报告不删。

### Goal-Driven Execution

多步任务先写可验证计划：

```
1. [步骤] → verify: [检查项]
2. [步骤] → verify: [检查项]
```

---

## 开发工作流（必须遵守）

### 1. 规划

任何新功能、页面、组件开发前，必须先做规划，谋定后动。

### 2. 设计

前端页面/组件开发前，**必须先用设计技能生成设计系统**，禁止直接写代码。

**技能优先级**（`.agents/skills/`）：

1. **`high-end-visual-design`** — 高端视觉与设计系统
2. **`gpt-taste`** — Awwwards 级设计工程（GSAP、AIDA、Bento）
3. **`design-taste-frontend`** — 反模板化前端设计

**设计红线**：

- ❌ 禁止默认模板样式（无设计感的卡片、无聊的布局）
- ❌ 禁止 Emoji 作为图标（用 SVG）
- ❌ 禁止硬编码颜色值（用语义化 Token）
- ❌ 禁止 6 行以上的标题文字墙
- ✅ 必须有视觉层次、间距节奏、微交互动效
- ✅ 必须遵循 AIDA 结构（Attention → Interest → Desire → Action）

架构与约定类改动可直接读 `.agents/skills/template-architecture/SKILL.md`。

### 3. 实现

| 要做的事 | 放哪 |
|----------|------|
| 新业务 UI | `src/renderer/features/<name>/` |
| 渲染层 IPC 调用 | `src/renderer/services/` + `src/renderer/ipc/`（禁止直接 `window.api`） |
| 主进程能力 | `src/main/features/<name>/` 或 `src/main/services/` |
| IPC 通道契约 | `packages/shared/src/ipc/routes.ts`（request/event map） |
| 跨进程类型/工具 | `packages/shared/src/` |
| 插件 API 类型 | `packages/plugin-api/src/`（`window.host`） |
| 能力开关 | `packages/shared/src/capabilities/config.ts`（唯一真源） |
| 内置插件 | `src/plugins/<name>/` |
| 静态/二进制资源 | `resources/` |

**依赖方向**：`renderer/features` → `renderer/services` → `@ert/shared/ipc` ← `main/*`

禁止：

- 渲染层散落 `window.ipcRenderer` / `window.plugin` / `window.logEvents`
- `@ert/shared` import electron / React
- 主进程 import React 或 `@/`（渲染层别名）
- 渲染层 import `src/main/**`
- 主进程业务直接 `app.getPath`（走 `src/main/app/paths.ts`）
- 组件硬编码颜色（必须用语义 Token）
- 组件硬编码用户可见文案（必须走 i18n）

### 4. 文档

更新 `docs/` 中对应文件，保持与代码同步。架构/环境约定变更须同步本文件与 `README.zh-CN.md`。

### 5. 预检

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

### 6. 提交

```bash
git add -A
git commit -m "feat/fix/chore/docs/refactor: 描述"
# 用户明确要求时再 push
```

---

## 目录规范

```
electron-react-template/
  package.json / vite.config.ts / electron-builder.json / tsconfig*
  src/
    main/                     # 主进程
      main.ts
      app/                    # 协议、主窗、日志、paths、window/、serviceRegistry
      services/               # window-state 等轻量模块
      features/
        plugin-host/          # 插件宿主（window.host）
        capabilities/         # 能力注册（读 @ert/shared 开关）
      ipc/                    # IpcApi 路由与 handlers
    preload/                  # contextBridge
    renderer/                 # 渲染进程源码（index.html / public 在此）
      index.html / public/
      app/                    # bootstrap、providers、routes、contexts
      shell/                  # 布局 chrome
      features/               # 业务页面
      services/               # IPC 封装
      capabilities/           # 路由/导航聚合
      i18n/ styles/ assets/ lib/
    plugins/                  # 内置插件源码
  packages/
    shared/                   # @ert/shared
    plugin-api/               # @ert/plugin-api
  resources/                  # 原生库、OCR 等打包资源
  build/                      # electron-builder 图标
  tests/                      # 单测 + e2e
  scripts/ docs/ .agents/
```

**裁剪方式**：只改 `packages/shared/src/capabilities/config.ts`。跨项目复用的契约优先 `packages/*`，业务工具优先 `src/plugins/*`。

---

## 路径约定

主进程路径一律经 `src/main/app/paths.ts`（`initAppRoot` + `paths.*`）。禁止业务代码直接 `app.getPath` / 手拼 `process.resourcesPath`（eslint 已拦；`paths.ts` 与插件 API 透传除外）。详见 `docs/architecture/boundaries.md`。

---

## 窗口与服务

### WindowManager

所有 `BrowserWindow` 经 `windowManager.open(type, options)`：

| type | mode | 说明 |
|------|------|------|
| `main` | singleton | 全局唯一，persist bounds |
| `subWindow` | default | 每次新建，hash 路由 |

```ts
// 业务禁止 new BrowserWindow
await windowManager.openMain()
await windowManager.open('subWindow', { hash: '/settings' })
windowManager.focusMain()
```

类型在 `src/main/app/window/windowRegistry.ts` 登记。

### serviceRegistry

有长资源 / 持久副作用的服务实现 `MainService` 并注册：

```ts
import { registerService, bootstrapServices, disposeServices } from './app'

registerService({
  name: 'myService',
  init() { /* 注册协议、定时器… */ },
  dispose() { /* 清理 */ },
})
await bootstrapServices() // 按序 init，失败会逆序 dispose
```

启动顺序（`main.ts`）：preboot → `initHostIpc` → `registerDefaultServices` + `bootstrapServices` → `windowManager.openMain()`。退出时 `before-quit` 调 `disposeServices()`。

无状态工具仍用具名导出，不必注册。

---

## 运行时环境边界

| 角色 | 需要什么 | 说明 |
|------|----------|------|
| **最终用户（安装包）** | **不需要系统 Node.js** | Electron 内嵌 Chromium + Node |
| **开发者** | Node ≥ 20.19 / ≥ 22.12 + pnpm | 构建、Vite、测试、electron-builder |
| **RapidOCR（可选）** | 本机 [uv](https://docs.astral.sh/uv/) | sidecar 拉起，不把 Python 包打进应用 |
| **插件 Node 依赖** | 随插件目录打包 | `src/plugins/*/node_modules` 经 `extraResources` 分发，**禁止**用户机上 `npm install` |

原则：

- 不给最终用户装 Node/nvm；打包应用自带 Node。
- 不在应用启动时 `npm/pnpm install`。
- Python 侧只通过 uv / 可选 `.venv` / `RAPIDOCR_PYTHON`，见 `src/plugins/ocr-service/scripts/README.md`。

---

## IPC 约定

通道契约集中在 `packages/shared/src/ipc/`（`IpcRequestMap` / `IpcEventMap`）。新能力顺序：

1. 在 `packages/shared/src/ipc/routes.ts` 补 request/event 类型
2. 在 `src/main/ipc/handlers/<domain>.ts` `registerIpcHandler`
3. 渲染层经 `src/renderer/ipc` 的 `ipcApi.request` / `ipcApi.on`（或 `@/services` 封装）

```ts
// 渲染进程（经 service 或 ipcApi，勿碰 window.api 底层）
const result = await ipcApi.request('plugin.list', undefined as void)
const off = ipcApi.on('plugin.changed', () => {})

// 主进程
registerIpcHandler('plugin.list', () => registry.list())
broadcastIpcEvent('plugin.changed', undefined as void)
```

**禁止**：渲染层使用 `window.ipcRenderer` / `window.plugin` / `window.logEvents`（eslint 已拦）。插件沙箱内的 `plugin-preload.js` 通道不在本约定范围。

参考：`src/main/ipc/`、`src/preload/index.ts`、`src/renderer/ipc/`。

---

## 插件运行约定

1. **启动注入两层 preload**
   - 宿主：`src/main/features/plugin-host/plugin-preload.js` → `window.host`（`webPreferences.preload`）
   - 插件自身：`plugin.json` 的 `preload` 字段 → 如 `window.ocrService`（`session.registerPreloadScript`）
2. **图标协议**
   - 本地：`plugin-icon://proxy/<encodeURIComponent(绝对路径)>`，仅允许插件目录内图片
   - 远程：`market-icon://proxy/<url>`，仅 GitHub 系域名 + 体积上限
3. **安装列表**统一由 `registry` 写入，installer 不得双写。
4. 卸载/覆盖安装前必须 `runner.forceClose` 运行中实例。
5. 插件作者可用类型：`@ert/plugin-api`（`window.host`）。

---

## 主题系统（语义化 Token）

**组件只用语义类名，不写死颜色。** 加新主题只改 CSS 变量，组件零改动。

```
src/renderer/styles/tokens.css  →  --token-*
src/renderer/styles/tailwind.css → @theme 注册
组件 → bg-surface、text-foreground、border-border-default
```

| Tailwind 类名 | 用途 | 变量 |
|---|---|---|
| `bg-background` | 页面背景 | `--token-bg` |
| `bg-surface` / `bg-surface-hover` | 卡片/侧边栏 | `--token-surface` |
| `text-foreground` / `-secondary` / `-muted` | 文字层级 | `--token-text*` |
| `border-border-default` | 边框 | `--token-border` |
| `bg-accent` / `text-accent` | 强调 | `--token-accent` |

```tsx
// ❌
<div className="bg-white dark:bg-slate-800">
// ✅
<div className="bg-surface text-foreground">
```

主题切换：`ThemeContext` 切 `html` class；`src/renderer/index.html` 内联脚本防 FOUC。

---

## 国际化

```
src/renderer/i18n/
  index.ts
  locales/zh-CN.ts
  locales/en-US.ts
```

```tsx
const { t } = useLanguage()
t('home.hero.title')
```

新增键**必须同时**写入 `zh-CN.ts` 与 `en-US.ts`。禁止组件硬编码用户可见中英文。

---

## 代码质量工具

| 工具 | 命令 |
|------|------|
| TypeScript | `pnpm typecheck` |
| ESLint | `pnpm lint` / `pnpm lint:fix` |
| Prettier | `pnpm format` / `pnpm format:check` |
| Vitest | `pnpm test` |
| Playwright | `pnpm test:e2e` |

提交前预检：

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

---

## 配置文件索引

| 文件 | 用途 |
|------|------|
| [`pnpm-workspace.yaml`](pnpm-workspace.yaml) | workspace：`packages/*` |
| [`vite.config.ts`](vite.config.ts) | Vite + Electron（**root 必须是仓库根**；html 在 `src/renderer`；alias `@` / `@ert/*`） |
| [`tsconfig.json`](tsconfig.json) | 严格 TS + paths |
| [`electron-builder.json`](electron-builder.json) | 打包发布 |
| [`eslint.config.js`](eslint.config.js) | main/renderer 规则分离 |
| [`vitest.config.ts`](vitest.config.ts) | 单测（`tests/`） |
| [`playwright.config.ts`](playwright.config.ts) | E2E（`tests/e2e/`） |
| [`src/plugins/ocr-service/scripts/`](src/plugins/ocr-service/scripts/) | RapidOCR sidecar |
| [`.agents/skills/`](.agents/skills/) | 项目内 AI 技能 |

---

## 跨项目复用指引

本仓库是**可克隆模板**。新项目：

1. 克隆后改 `package.json` name / `electron-builder.json` appId、productName、publish。
2. 用 `packages/shared` 的 capabilities 开关裁掉不需要的能力。
3. 工具做成 `src/plugins/*` 或抽到 `packages/*`，避免拷贝业务代码。
4. 插件全局 API 统一为 `window.host`，类型见 `@ert/plugin-api`。
