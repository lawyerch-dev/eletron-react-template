---
title: "快速开始"
description: "环境要求、安装依赖、启动开发的完整流程，三步跑通 Electron + React + TypeScript 桌面应用模板"
---

# 快速开始

## 环境要求

- Node.js >= 18
- pnpm >= 8

## 安装

```bash
# 克隆仓库
git clone https://github.com/lawyerch-dev/eletron-react-template.git
cd eletron-react-template

# 安装依赖
pnpm install
```

## 启动开发环境

```bash
pnpm dev
```

这会同时启动 Vite 开发服务器和 Electron 应用，支持热更新。

启动后，`plugins/` 下的内置插件自动注册，"我的插件"页面可查看。

## 构建

```bash
pnpm build
```

构建产物位于 `dist/` 和 `dist-electron/` 目录。

## 代码质量检查

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 格式化检查
pnpm format:check

# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e
```

## 提交前必检

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```