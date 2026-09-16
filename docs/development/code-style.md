---
title: "代码规范"
description: "严格 TypeScript、语义 Token、feature 目录约定与预检命令。"
---

# 代码规范

## TypeScript

使用严格模式编译，配置见根目录 `tsconfig.json`。

## ESLint / Prettier

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
```

## 命名规范

- 组件文件：`PascalCase`（`PluginDetailModal.tsx`）
- 工具函数：`camelCase`（`formatT`）
- IPC 通道：`kebab-case`（`plugin:market-list`）
- CSS 变量：`--token-*` 前缀

## 目录与组件规范

- 新组件放 `src/renderer/features/<name>/`
- 使用命名导出，而非默认导出
- 跨进程类型/工具放 `packages/shared/src/`
- 渲染进程调主进程必须走 `src/renderer/services/`
- 样式只用语义 Token（`bg-surface`、`text-foreground`…），禁止硬编码颜色
- 用户可见文案必须走 i18n（`src/renderer/i18n/`）

## 提交前预检

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```
