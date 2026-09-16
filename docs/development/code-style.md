---
title: "代码规范"
description: "使用严格模式编译，配置见 tsconfig.json。"
---

# 代码规范

## TypeScript

使用严格模式编译，配置见 `tsconfig.json`。

## ESLint

```bash
# 检查
pnpm lint

# 自动修复
pnpm lint:fix
```

## Prettier

```bash
# 格式化
pnpm format

# 检查格式
pnpm format:check
```

## 命名规范

- 组件文件：`PascalCase`（`PluginDetailModal.tsx`）
- 工具函数：`camelCase`（`formatT.ts`）
- IPC 通道：`kebab-case`（`plugin:market-list`）
- CSS 变量：`--token-*` 前缀

## 组件规范

- 新组件放 `apps/desktop/src/features/<name>/`
- 使用命名导出，而非默认导出
- 类型定义与组件同文件，或放 `src/types/`