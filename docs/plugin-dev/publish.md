---
title: "发布插件"
description: "要将插件发布到线上插件市场，你需要使用 Host 插件 CLI 工具。"
---

# 发布插件

## 发布到插件市场

要将插件发布到线上插件市场，你需要使用 Host 插件 CLI 工具。

### 安装 CLI

```bash
npm install -g @ert/plugin-cli
# 或
pnpm add -g @ert/plugin-cli
```

### 发布流程

```bash
# 1. 确保已初始化 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 2. 发布插件
host publish
```

首次发布时，CLI 会自动完成：
1. GitHub OAuth 认证
2. Fork 中心仓库
3. 创建 Pull Request

### 发布要求

- 项目包含 `plugin.json` 文件
- 已初始化 Git 仓库并至少有一次提交
- 工作区干净（没有未提交的改动）

## 手动安装

### 导入插件文件

1. 将插件目录打包为 `.zip` 或 `.zpx` 文件
2. 在宿主应用中点击 **"导入插件"** 按钮
3. 选择打包好的插件文件

### 开发模式

开发中的插件可以直接通过目录导入，无需打包。

## 发布检查清单

- [ ] `plugin.json` 的 `name` / `title` / `version` / `description` / `author` 字段均已检查
- [ ] 已移除调试日志、未使用文件、敏感信息（`.env`、token、密钥等）
- [ ] 已在本地宿主应用实际加载并测试过此插件，主要功能正常