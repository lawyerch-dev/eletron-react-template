---
title: "架构概览"
description: "三层插件来源 + 三层后端架构："
---

# 架构概览

## 整体架构

```
┌─────────────────────────────────────┐
│            Renderer Process          │
│  ┌─────────┐  ┌──────────┐         │
│  │  React   │  │  Vite    │         │
│  │  App     │  │  HMR     │         │
│  └────┬────┘  └──────────┘         │
│       │ contextBridge               │
│  ┌────▼────┐                        │
│  │ Preload │                        │
│  └────┬────┘                        │
├───────┼─────────────────────────────┤
│       │ IPC                         │
│  ┌────▼────┐                        │
│  │  Main   │                        │
│  │ Process │                        │
│  └────┬────┘                        │
│       │                             │
│  ┌────▼─────────────────────┐       │
│  │  Plugin Subsystem        │       │
│  │  ┌───────┬──────┬──────┐ │       │
│  │  │ API   │Instl │Runtm │ │       │
│  │  │Modules│aller │  e   │ │       │
│  │  └───────┴──────┴──────┘ │       │
│  │         Native Module    │       │
│  │         (.node / .dylib) │       │
│  └──────────────────────────┘       │
└─────────────────────────────────────┘
```

## 技术栈

| 层面 | 技术选型 |
|---|---|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 桌面框架 | Electron 42 |
| 样式 | Tailwind CSS 4 + 语义化 Token |
| 路由 | React Router 7 |
| 测试 | Vitest + Playwright |
| 代码质量 | ESLint + Prettier |

## 插件子系统

三层插件来源 + 三层后端架构：

### 插件来源

| 来源 | 路径 | 说明 |
|------|------|------|
| 内置插件 | `plugins/` | 随应用打包，自动注册，不可卸载 |
| 市场插件 | 在线下载 | 从 Host 市场安装到 `userData/plugins/` |
| 本地导入 | `.zpx`/`.zip` | 用户手动选择文件导入 |

### 后端架构

| 模块 | 目录 | 职责 |
|------|------|------|
| API | `api/` | 14 个模块，每个自注册 IPC handler，提供 Host 兼容 API |
| 安装 | `installer/` | 市场下载、本地导入、ZPX 解析、安装回写 |
| 运行时 | `runtime/` | 注册表、运行器、HTTP 客户端 |
| 原生 | `api/native/` | 加载 `.node` 原生模块，提供模拟输入/剪贴板监听等能力 |

### 通信流程

```
插件窗口 (plugin-preload.js)
  → window.host.xxx()
  → ipcRenderer.sendSync/invoke('channel-name', args)
  → 主进程 API 模块处理
  → 返回结果
```

## 日志系统

主进程日志通过 `electron-log` hook 实时推送到渲染进程，渲染进程 `console.*` 被拦截后也经主进程广播。前后端日志统一展示，支持 5 级颜色标签、3 类来源标签、多选复制，内存上限 2000 条环形缓冲区。