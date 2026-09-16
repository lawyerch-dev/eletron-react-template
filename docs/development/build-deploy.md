---
title: "构建与部署"
description: "这会在 dist/ 生成前端构建产物，在 out/electron/ 生成主进程代码，并调用 electron-builder 打包。"
---

# 构建与部署

## 构建

```bash
pnpm build
```

这会在 `out/renderer/` 生成前端构建产物，在 `out/electron/` 生成主进程代码，并调用 electron-builder 打包。

## 打包配置

配置文件 `electron-builder.json` 包含：

- 应用名称、图标
- Windows / macOS / Linux 平台配置
- 文件包含/排除规则
- 自动更新 publish 配置

## CI/CD

GitHub Actions 工作流：

- `ci.yml`：PR 提交时运行类型检查、lint、测试
- `build.yml`：推送时构建并创建 Release
- `pr-guard.yml`：PR 安全检查

## 文档部署

文档站使用 VitePress 构建，通过 GitHub Actions 自动部署到 GitHub Pages。

```bash
# 本地预览文档
pnpm docs:dev

# 构建文档
pnpm docs:build
```