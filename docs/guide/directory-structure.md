---
title: "目录结构"
description: "monorepo：apps/desktop 宿主 + packages 共享契约 + 内置插件"
---

# 目录结构

```
apps/desktop/
├── src/
│   ├── main/                   # 主进程（后端）
│   │   ├── main.ts             # 入口装配
│   │   ├── app/                # protocols / window / logging
│   │   ├── services/           # window-state、update（可测业务）
│   │   └── features/           # plugin-host（window.host）、capabilities
│   ├── preload/                # contextBridge
│   └── renderer/               # 渲染进程（前端）
│       ├── app/                # bootstrap + providers + routes
│       ├── shell/              # AppLayout / Sidebar / TopBar
│       ├── features/           # plugins / home / settings / update / ocr
│       ├── services/           # plugin / logs / update（IPC 封装）
│       ├── capabilities/       # 路由/导航聚合（开关真源在 packages）
│       └── i18n/ styles/ assets/ lib/
├── plugins/                    # 内置插件源码（example-plugin、ocr-service）
├── build/ resources/ test/ scripts/
└── index.html / vite.config.ts / electron-builder.json

packages/
├── shared/                     # @ert/shared
│   └── src/
│       ├── ipc/channels.ts     # IpcChannel 真源
│       ├── types/              # 市场/安装/桥接类型
│       ├── utils/              # formatT / logoUrl / sanitizeHtml
│       └── capabilities/       # capabilities 总开关真源
└── plugin-api/                 # @ert/plugin-api — window.host 类型

docs/ scripts/
```

## 架构规则

| 规则 | 说明 |
|------|------|
| 进程优先 | 先分 main / renderer / packages，再按 feature 分 |
| 依赖单向 | feature → services → `@ert/shared/ipc` ← main |
| 契约集中 | 通道名写在 `packages/shared/src/ipc/channels.ts` |
| pages 禁止裸 IPC | 一律走 `renderer/services/*` |
| 能力开关唯一真源 | `packages/shared/src/capabilities/config.ts` |

## 加功能

| 要做的事 | 放哪 |
|----------|------|
| 新业务 UI | `apps/desktop/src/renderer/features/<name>/` |
| 主进程能力 | `apps/desktop/src/main/features/<name>/` 或 `main/services/` |
| 可开关裁剪 | 只改 `packages/shared/src/capabilities/config.ts` |
| 新 IPC | `packages/shared/src/ipc/channels.ts` + preload + service + handler |
| 跨项目工具 | 优先做成 `apps/desktop/plugins/<name>/` 插件，或抽到 `packages/*` |

运行时用户安装插件仍在 `userData/plugins/`，与仓库内 `apps/desktop/plugins/` 分离。
