# electron-react-template

[![GitHub stars](https://img.shields.io/github/stars/lawyerch-dev/electron-react-template?color=fa6470)](https://github.com/lawyerch-dev/electron-react-template/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/lawyerch-dev/electron-react-template?color=d8b22d)](https://github.com/lawyerch-dev/electron-react-template/issues)
[![GitHub license](https://img.shields.io/github/license/lawyerch-dev/electron-react-template)](https://github.com/lawyerch-dev/electron-react-template/blob/main/LICENSE)
[![Required Node.js >= 20.19.0 || >= 22.12.0](https://img.shields.io/static/v1?label=node&message=%3E=20.19.0%20||%20%3E=22.12.0&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

[English](README.md) | 简体中文

## 概览

基于 Electron + React + TypeScript 的桌面应用，内置插件系统、主题引擎和国际化支持。基于 [electron-vite-react](https://github.com/electron-vite/electron-vite-react) 模板二次开发。

### 特性

- 🧩 **插件系统** — 在线插件市场、本地导入、一键安装和启动
- 🔍 **内置 OCR 服务** — RapidOCR（uv sidecar）/ 系统原生 / Tesseract.js 多引擎
- 🎨 **语义化主题引擎** — CSS 自定义属性 Token，浅色/暗色主题，可扩展
- 🌐 **国际化** — 中英文双语支持，易于扩展
- ⚡ **Vite + React 19** — 快速 HMR，TypeScript 严格模式
- 🔄 **自动更新** — 基于 electron-updater
- 🧱 **生产级主进程骨架** — IpcApi 类型化 IPC、paths 路径注册、WindowManager、serviceRegistry
- 🚫 **进程/包边界由 lint 强制** — 禁止裸 `ipcRenderer`、跨进程乱 import、散落 `app.getPath`
- 🧪 **测试** — Vitest 单元测试 + Playwright E2E
- 📦 **CI/CD** — GitHub Actions + electron-builder + GitHub Pages 文档站

## 环境要求

| 场景 | 需要 |
|------|------|
| **安装并使用应用** | **不需要系统 Node.js**（Electron 包内自带 Chromium + Node） |
| 开发本仓库 | Node.js ≥ 20.19 或 ≥ 22.12 + [pnpm](https://pnpm.io) |
| 启用 RapidOCR 引擎（可选） | [uv](https://docs.astral.sh/uv/)；无 uv 时回退系统 OCR / Tesseract.js |

插件若依赖 npm 包（如 `tesseract.js`、原生模块），须在开发机安装后**随插件目录一起打包**（`electron-builder` 的 `extraResources`），最终用户机器上**不会**执行 `npm install`。

## 快速开始

```sh
git clone https://github.com/lawyerch-dev/electron-react-template.git
cd electron-react-template
pnpm install
pnpm dev
```

可选启用 RapidOCR：

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建并打包 |
| `pnpm test` | 单元测试 |
| `pnpm test:e2e` | E2E 测试 |
| `pnpm typecheck` | 类型检查 |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm docs:dev` | 本地预览文档 |
| `pnpm docs:build` | 构建文档站 |

## 项目结构

对齐 cherry-studio：源码只进 `src/`，可复用包进 `packages/`，静态资源进 `resources/`。

```
electron-react-template/
├── src/
│   ├── main/                 主进程
│   ├── preload/              contextBridge
│   ├── renderer/             前端（含 index.html、public）
│   └── plugins/              内置插件源码
├── packages/
│   ├── shared/               @ert/shared
│   └── plugin-api/           @ert/plugin-api
├── resources/ build/ tests/ scripts/ docs/
└── package.json / vite.config.ts / electron-builder.json
```

## 插件系统

### 插件市场
在线浏览和安装插件，支持：
- 分类筛选和关键词搜索
- 插件详情弹窗（README、元数据、指令列表）
- 5 分钟缓存，减少重复请求
- 下载量显示

### 我的插件
管理已安装的插件：启动、停止、卸载，或从本地 `.zpx` / `.zip` 文件导入。

### 插件窗口
每个插件在独立 BrowserWindow 中运行，背景色固定为白色，不受宿主应用主题影响。

启动时会注入：
1. 宿主 `plugin-preload.js`（提供 `window.host`）
2. 插件自身 `preload`（若 `plugin.json` 声明，如 OCR 的 `window.ocrService`）

### OCR 服务
见 [`src/plugins/ocr-service/README.md`](src/plugins/ocr-service/README.md)。默认优先 RapidOCR（需 uv），否则系统 OCR / Tesseract.js。

## 主题系统

使用 **CSS 自定义属性**作为语义化 Token，组件引用 Token（`bg-surface`、`text-foreground`），不写死颜色值。

### Token 流转

```
styles/tokens.css    →  定义 --token-* 变量（按主题 class）
styles/tailwind.css  →  注册为 Tailwind @theme 值
组件                 →  使用 bg-surface、text-foreground、border-border-default
```

### 新增主题

在 `styles/tokens.css` 添加一个 class 块：

```css
html.sepia {
  --token-bg: #f5f0e8;
  --token-surface: #faf5ed;
  --token-accent: #b08947;
  /* ... */
}
```

组件无需任何改动。

### 主题切换

- 位置：侧边栏底部（主题切换按钮）
- 选项：浅色 / 暗色 / 跟随系统
- 动画：`document.startViewTransition()` + `clip-path` 圆弧扩散
- 防闪烁：`index.html` 内联脚本

## 国际化

- 语言：`zh-CN`、`en-US`
- 使用：`const { t } = useLanguage(); t('home.hero.title')`
- 新增翻译键**必须**同时添加到两个语言文件

## 架构

详见 `docs/development/architecture.md` 与 `docs/architecture/`：

- 主进程：`docs/architecture/main.md`（paths / WindowManager / serviceRegistry / IpcApi）
- 渲染层：`docs/architecture/renderer.md`（features / services / ipc）
- 边界约束：`docs/architecture/boundaries.md`

### IPC 通信

宿主渲染层统一走 **IpcApi**（类型化 RPC），契约在 `packages/shared/src/ipc/routes.ts`。

```typescript
// 渲染进程（经 service，禁止 window.ipcRenderer）
import { pluginService } from '@/services'
const list = await pluginService.listInstalled()

// 或底层
import { ipcApi } from '@/ipc'
await ipcApi.request('plugin.list', undefined as void)

// 主进程
registerIpcHandler('plugin.list', () => registry.list())
```

详见 `docs/development/ipc.md`。

## 文档站

完整文档：[https://bluerangala.github.io/electron-react-template/](https://bluerangala.github.io/electron-react-template/)，基于 VitePress 构建，GitHub Actions 自动部署。

## 许可证

[MIT](LICENSE)