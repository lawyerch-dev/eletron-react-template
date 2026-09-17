---
title: "架构概览"
description: "Electron 进程模型、IpcApi、WindowManager、serviceRegistry 与目录分层"
---

# 架构概览

模板对齐 Cherry Studio 的**精简生产骨架**：进程边界清晰、IPC 契约单一、路径与窗口集中管理。

## 进程模型

```
═══ Main · Node.js · src/main/ ═══════════════════════════════
  app/        paths · logging · protocols · window/ · serviceRegistry
  ipc/        IpcApi 传输 + 各域 handlers
  features/   plugin-host · capabilities
  services/   window-state 等轻量模块

              ↕  ipc-api:request / ipc-api:event  ·  src/preload/

═══ Renderer · Chromium · src/renderer/ ══════════════════════
  app/        bootstrap · providers · routes · contexts
  shell/      布局 chrome
  features/   home · plugins · update · settings · about · ocr
  services/   类型化 IPC 门面
  ipc/        ipcApi · useIpcOn
  capabilities/  能力路由/导航聚合
```

## 典型数据流

```
用户操作 (React)
  │
  ├─ 命令 ──→ @/services ──→ window.api.ipcApi.request
  │                              │
  │                              ▼
  │                         main IpcRouter
  │                              │
  │                              ▼
  │                         handler → 业务模块
  │                              │
  │                    broadcast/send 事件
  │                              │
  └─ 读状态 ←─ useIpcOn / service.onXxx ←─┘

设置/窗口尺寸 → electron-store（window-state）
插件安装/运行 → plugin-host → 插件窗口 + window.host
```

## 五大约定（强制）

| 约定 | 位置 |
|------|------|
| IPC 契约 | `packages/shared/src/ipc/routes.ts` |
| 路径 | `src/main/app/paths.ts` |
| 窗口 | `windowManager.open(type)`，类型在 `windowRegistry` |
| 服务 | `registerService` + `bootstrapServices` / `disposeServices` |
| 边界 | eslint `no-restricted-imports` / `no-restricted-properties` |

## 目录职责

| 目录 | 职责 |
|------|------|
| `src/main` | 主进程：窗口、日志、插件宿主、capabilities、IpcApi |
| `src/preload` | 唯一暴露 `window.api.ipcApi` |
| `src/renderer` | React UI（含 `index.html` / `public`） |
| `src/plugins` | 内置插件源码 |
| `packages/shared` | 跨进程类型/契约/纯逻辑 |
| `packages/plugin-api` | 插件 `window.host` 契约 |
| `resources` | 原生库等打包资源 |
| `tests` | 单测 + E2E |

## 启动时序

```
initAppRoot → initLogging → protocols → single-instance lock
app.whenReady
  → initHostIpc（传输 + handlers）
  → registerDefaultServices + bootstrapServices
  → windowManager.openMain()
before-quit → disposeServices
```

## 技术栈

| 层面 | 选型 |
|---|---|
| 前端 | React 19 + TypeScript + React Router 7 |
| 构建 | Vite 8 + electron-vite 插件 |
| 桌面 | Electron 42 |
| 样式 | Tailwind CSS 4 + 语义 Token |
| 测试 | Vitest + Playwright |
| 质量 | ESLint + Prettier |

## 相关文档

- [IPC 通信](./ipc.md)
- [架构边界](../architecture/boundaries.md)
- [插件子系统](#插件子系统)（见下）

## 插件子系统

三层插件来源：

| 来源 | 路径 | 说明 |
|------|------|------|
| 内置插件 | `src/plugins/` | 随应用打包，自动注册，不可卸载 |
| 市场插件 | 在线下载 | 安装到 `userData/plugins/` |
| 本地导入 | `.zpx`/`.zip` | 用户手动导入 |

宿主模块：`api/`（window.host 能力）· `installer/` · `runtime/`。详见 `src/plugins/README.md` 与 `AGENTS.md`。
