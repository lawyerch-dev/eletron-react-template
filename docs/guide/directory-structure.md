---
title: "目录结构"
description: "对齐 cherry-studio：源码只进 src/，契约进 packages/，静态资源进 resources/"
---

# 目录结构

```
electron-react-template/     # 根只放构建配置与文档
├── src/                     # ★ 全部应用源码
│   ├── main/                # 主进程
│   │   ├── main.ts
│   │   ├── app/             # protocols / window / logging
│   │   ├── services/        # window-state、update
│   │   └── features/        # plugin-host、capabilities
│   ├── preload/             # contextBridge
│   ├── renderer/            # 渲染进程源码（Vite 入口 html 在此，非 vite root）
│   │   ├── index.html
│   │   ├── public/          # favicon 等静态资源
│   │   ├── app/ shell/ features/ services/ capabilities/
│   │   └── i18n/ styles/ assets/ lib/
│   └── plugins/             # 内置插件源码（example、ocr-service）
├── packages/                # 跨项目可复用 workspace 包
│   ├── shared/              # @ert/shared
│   └── plugin-api/          # @ert/plugin-api
├── resources/               # 打包进应用的二进制/数据（native lib、OCR）
├── build/                   # electron-builder 图标等
├── tests/                   # 单元测试 + e2e
├── scripts/                 # 工程脚本
├── docs/                    # VitePress 文档站
├── out/                     # ★ 构建产物（gitignore）：electron/ + renderer/
└── package.json / vite.config.ts / electron-builder.json / tsconfig*
```

## 架构规则（对齐 cherry-studio）

| 规则 | 说明 |
|------|------|
| 根目录只放配置 | 源码不散落在根；`index.html` 在 `src/renderer/` |
| **Vite root = 仓库根** | `vite-plugin-electron` 用 `config.root` 作 Electron cwd；设成 `src/renderer` 会启动失败 |
| 源码单入口 | 一切业务代码进 `src/` |
| 可复用契约进 packages | IPC / 类型 / host API 不进业务目录 |
| 静态资源与源码分离 | 原生库、OCR 模型等放 `resources/` |
| 测试集中 | `tests/`（单测 + e2e），不混在 src |
| 能力开关唯一真源 | `packages/shared/src/capabilities/config.ts` |

## 加功能

| 要做的事 | 放哪 |
|----------|------|
| 新业务 UI | `src/renderer/features/<name>/` |
| 主进程能力 | `src/main/features/<name>/` 或 `src/main/services/` |
| 新 IPC | `packages/shared/src/ipc/channels.ts` + preload + service + handler |
| 内置工具/插件 | `src/plugins/<name>/` |
| 跨项目复用库 | `packages/<name>/` |

运行时用户安装插件在 `userData/plugins/`，与仓库内 `src/plugins/` 分离。
