# eletron-react-template

[![GitHub stars](https://img.shields.io/github/stars/lawyerch-dev/eletron-react-template?color=fa6470)](https://github.com/lawyerch-dev/eletron-react-template/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/lawyerch-dev/eletron-react-template?color=d8b22d)](https://github.com/lawyerch-dev/eletron-react-template/issues)
[![GitHub license](https://img.shields.io/github/license/lawyerch-dev/eletron-react-template)](https://github.com/lawyerch-dev/eletron-react-template/blob/main/LICENSE)
[![Required Node.js >= 20.19.0 || >= 22.12.0](https://img.shields.io/static/v1?label=node&message=%3E=20.19.0%20||%20%3E=22.12.0&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

[English](README.md) | 简体中文

## 概览

基于 Electron + React + TypeScript 的桌面应用，内置插件系统、主题引擎和国际化支持。基于 [electron-vite-react](https://github.com/electron-vite/electron-vite-react) 模板二次开发。

### 特性

- 🧩 **插件系统** — 在线插件市场、本地导入、一键安装和启动
- 🎨 **语义化主题引擎** — CSS 自定义属性 Token，浅色/暗色主题，可扩展
- 🌐 **国际化** — 中英文双语支持，易于扩展
- ⚡ **Vite + React 19** — 快速 HMR，TypeScript 严格模式
- 🔄 **自动更新** — 基于 electron-updater
- 🧪 **测试** — Vitest 单元测试 + Playwright E2E
- 📦 **CI/CD** — GitHub Actions + electron-builder + GitHub Pages 文档站

## 快速开始

```sh
git clone https://github.com/lawyerch-dev/eletron-react-template.git
cd eletron-react-template
pnpm install
pnpm dev
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

```
src/
├── styles/              样式文件（Token、Tailwind、基础样式）
├── i18n/                国际化
│   └── locales/         zh-CN.ts, en-US.ts
├── components/
│   ├── common/          通用组件（ErrorBoundary）
│   ├── layout/          布局组件（Sidebar、AppLayout）
│   ├── plugin/          插件 UI（PluginDetailModal、ImportPluginButton）
│   └── update/          自动更新 UI
├── contexts/            React Context（主题、语言）
├── pages/               页面组件（首页、插件市场、我的插件）
├── routes/              路由定义
├── types/               TypeScript 类型定义
├── assets/              SVG 与图片
electron/
├── main/
│   ├── plugin/          插件子系统（市场、安装、注册、运行）
│   ├── index.ts         主进程入口
│   └── update.ts        自动更新
└── preload/             Preload 脚本（contextBridge）
docs/                    VitePress 文档站
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

## IPC 通信

```typescript
// 渲染进程 → 主进程
const result = await window.ipcRenderer.invoke('channel-name', ...args)

// 主进程监听
ipcMain.handle('channel-name', (event, ...args) => { ... })
```

主要通道：`plugin:market-list`、`plugin:market-install`、`plugin:import-from-file`、`plugin:launch`、`plugin:list` 等。

## 文档站

完整文档：[https://bluerangala.github.io/eletron-react-template/](https://bluerangala.github.io/eletron-react-template/)，基于 VitePress 构建，GitHub Actions 自动部署。

## 许可证

[MIT](LICENSE)