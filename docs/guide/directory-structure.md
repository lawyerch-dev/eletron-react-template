---
title: "目录结构"
description: "apps/desktop 进程优先：main / preload / renderer / shared + IPC 契约"
---

# 目录结构

```
apps/desktop/
├── src/
│   ├── main/                   # 主进程（后端）
│   │   ├── main.ts             # 入口装配
│   │   ├── app/                # protocols / window / logging
│   │   ├── services/           # window-state、update（可测业务）
│   │   └── features/           # plugin-host、capabilities
│   ├── preload/                # contextBridge
│   ├── renderer/               # 渲染进程（前端）
│   │   ├── app/                # bootstrap + providers + routes
│   │   ├── shell/              # AppLayout / Sidebar / TopBar
│   │   ├── features/           # plugins / home / settings / update / ocr
│   │   ├── services/           # plugin / logs / update（IPC 封装）
│   │   ├── capabilities/       # 开关 + 路由聚合
│   │   └── i18n/ styles/ assets/ lib/
│   └── shared/                 # 进程间契约（无 DOM / 无 electron）
│       ├── ipc/channels.ts     # IpcChannel
│       ├── types/
│       └── utils/
├── plugins/ build/ resources/
├── index.html / vite.config.ts / electron-builder.json

packages/                       # 真共享库预留
docs/ scripts/
```

## 架构规则

| 规则 | 说明 |
|------|------|
| 进程优先 | 先分 main / renderer / shared，再按 feature 分 |
| 依赖单向 | feature → services → shared/ipc ← main |
| 契约集中 | 通道名写在 `shared/ipc/channels.ts` |
| pages 禁止裸 IPC | 一律走 `renderer/services/*` |

## 加功能

| 要做的事 | 放哪 |
|----------|------|
| 新业务 UI | `src/renderer/features/<name>/` |
| 主进程能力 | `src/main/features/<name>/` 或 `main/services/` |
| 可开关裁剪 | 渲染 + 主进程 `capabilities/config.ts` |
| 新 IPC | `shared/ipc/channels.ts` + preload + service + handler |

运行时用户安装插件仍在 `userData/plugins/`，与仓库内 `apps/desktop/plugins/` 分离。
