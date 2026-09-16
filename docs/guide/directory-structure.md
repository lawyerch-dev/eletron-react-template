---
title: "目录结构"
description: "apps/desktop feature 模块化：app/shell/features/shared + plugin-host 的组织方式"
---

# 目录结构

```
apps/desktop/                 # 桌面应用（workspace package: desktop）
├── src/
│   ├── app/                  # 壳装配（薄）
│   │   ├── main.tsx
│   │   ├── providers.tsx
│   │   ├── routes.tsx
│   │   ├── contexts/         # Theme / Language
│   │   └── ErrorBoundary.tsx
│   ├── shell/                # 布局 chrome（AppLayout / Sidebar / TopBar）
│   ├── features/             # ★ 功能按业务分包
│   │   ├── plugins/          # 市场 + 我的产品
│   │   ├── home/ about/ settings/ update/ ocr/
│   ├── capabilities/         # config 开关 + 聚合 feature 路由（薄）
│   └── shared/               # i18n / lib / types / styles / assets
├── electron/
│   ├── main/
│   │   ├── index.ts          # 入口：app → plugin-host → capabilities
│   │   ├── app/              # protocols / window / logging
│   │   ├── capabilities/     # registry + ocr/mcp/agent
│   │   └── plugin-host/      # 插件宿主（市场/安装/runner/security）
│   └── preload/
├── plugins/                  # 内置插件（ocr-service、example-plugin）
├── build/                    # electron-builder 图标
├── resources/
│   ├── lib/                  # 原生 .node / .dylib
│   └── ocr/                  # eng.traineddata
├── package.json / vite.config.ts / electron-builder.json

packages/                     # 真共享库预留（多 app 复用时再抽）
docs/                         # VitePress 文档站
scripts/                      # 工程脚本
package.json                  # 根：脚本编排 + 共享工具链
pnpm-workspace.yaml           # apps/* + packages/*
```

根目录只放 workspace 编排、文档、`packages/` 预留。应用自包含在 `apps/desktop/`。

## 加功能怎么放

| 要做的事 | 放哪 |
|----------|------|
| 新业务页 / 市场类功能 | `src/features/<name>/` |
| 跨 feature 的展示组件或工具 | `src/shared/ui` 或 `shared/lib` |
| 要开关裁剪的能力 | `src/capabilities/config.ts` + `features/<name>/routes` + 主进程 `capabilities/` |
| 内置插件内容 | `apps/desktop/plugins/<id>/` |

## 关键路径

| 路径 | 说明 |
|------|------|
| `src/capabilities/config.ts` | 渲染进程能力开关 |
| `electron/main/capabilities/config.ts` | 主进程能力开关（需同步） |
| `electron/main/plugin-host/` | 插件宿主 |
| `plugins/` | 随应用打包的内置插件 |
| `resources/lib|ocr/` | 原生库与 OCR 资源 |

运行时用户安装的插件仍在 `userData/plugins/`，与仓库内 `apps/desktop/plugins/` 分离。
