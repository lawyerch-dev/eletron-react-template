---
title: "目录结构"
description: "apps/desktop 桌面应用、plugins 内置插件、docs/resources/packages 的 monorepo 组织方式"
---

# 目录结构

```
apps/desktop/                 # 桌面应用（workspace package: desktop）
├── index.html
├── public/
├── package.json
├── vite.config.ts / vitest.config.ts / playwright.config.ts
├── electron-builder.json
├── src/                      # 渲染进程
│   ├── shell/                # 壳（布局、主题、i18n、Home/Settings/About）
│   │   ├── layout/
│   │   ├── contexts/
│   │   ├── common/
│   │   └── pages/
│   ├── capabilities/         # 可开关能力（config + 路由聚合）
│   ├── components/           # 业务组件（plugin、log-viewer、update）
│   ├── pages/                # 能力页（PluginMarket、MyPlugins）
│   ├── styles/ i18n/ routes/ types/ utils/ assets/
│   └── main.tsx
└── electron/                 # 主进程
    ├── main/
    │   ├── index.ts          # 入口：shell → plugin → capabilities
    │   ├── shell/            # protocols / window / logging
    │   ├── capabilities/     # registry + ocr/mcp/agent
    │   └── plugin/           # 插件宿主（市场/安装/runner/security）
    └── preload/

plugins/                      # 内置插件源码（ocr-service、example-plugin）
resources/lib/                # 原生 .node / .dylib
resources/ocr/                # eng.traineddata
packages/                     # 共享库预留（shared-types）
docs/                         # VitePress 文档站
scripts/                      # 工程脚本（docs frontmatter 等）
package.json                  # 根：脚本编排 + 共享工具链
pnpm-workspace.yaml           # apps/* + packages/*
```

根目录仅保留：workspace 编排、文档站、内置插件与资源。应用源码与构建配置都在 `apps/desktop/`。

## 关键目录

| 路径 | 说明 |
|------|------|
| `apps/desktop/src/capabilities/config.ts` | 可抽插能力总开关（渲染） |
| `apps/desktop/electron/main/capabilities/config.ts` | 能力总开关（主进程，需同步） |
| `apps/desktop/electron/main/plugin/` | 插件宿主（安装、运行、安全协议） |
| `plugins/` | 随应用打包的内置插件，启动扫描注册 |
| `resources/lib/` | 原生 `.node` / `.dylib` |
| `resources/ocr/` | OCR 训练数据 |

运行时用户安装的插件仍写在 `userData/plugins/`，与仓库内 `plugins/` 分离。
