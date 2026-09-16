---
title: "插件开发快速开始"
description: "插件是运行在独立窗口中的 Web 应用，结合了 HTML/CSS/JavaScript 前端技术 和 Node.js 本地能力，可以："
---

# 插件开发快速开始

## 插件是什么

插件是运行在独立窗口中的 Web 应用，结合了 **HTML/CSS/JavaScript 前端技术** 和 **Node.js 本地能力**，可以：

- 🎨 使用 HTML、CSS、JavaScript 构建美观的用户界面
- ⚡ 通过 Preload 脚本访问系统原生能力（文件系统、网络、进程等）
- 🔌 使用丰富的 `window.host` API（通知、剪贴板、窗口管理、数据库等）
- 📦 支持 Vue、React 等现代前端框架
- 🌍 跨平台运行

## 插件结构

一个最简单的插件只需要几个文件：

```
my-plugin/
├── plugin.json          # 插件配置文件（必需）
├── index.html           # 插件入口页面
├── preload.js           # Node.js 预加载脚本（可选）
└── logo.svg             # 插件图标（推荐 SVG，支持 PNG）
```

## 快速创建

### 使用模板

在 `src/plugins/` 目录下有一个示例插件模板，可以直接复制使用：

```bash
cp -r src/plugins/example-plugin my-plugin
cd my-plugin
```

### 手动创建

1. 创建项目目录并添加 `plugin.json`：

```json
{
  "name": "my-plugin",
  "title": "我的插件",
  "description": "插件描述",
  "version": "1.0.0",
  "main": "index.html",
  "logo": "logo.png",
  "preload": "preload.js",
  "features": [
    {
      "code": "hello",
      "explain": "hello world",
      "cmds": ["hello", "你好"]
    }
  ]
}
```

2. 创建 `index.html` 作为插件入口页面
3. 创建 `preload.js` 使用 Node.js API（可选）
4. 添加一个 `logo.png` 图标文件

## 导入插件

将插件目录或 `.zip` 包通过以下方式导入：

- **插件市场页面** → 点击"导入插件"按钮
- **我的插件页面** → 点击"导入插件"按钮

选择你的插件目录或 `.zip`/`.zpx` 文件即可完成安装。

## 插件生命周期

1. **安装** → 插件被复制到插件目录并注册
2. **启动** → 以独立窗口加载 `index.html`，注入 `preload.js`
3. **运行** → 插件通过 `window.host` 调用宿主 API
4. **停止** → 关闭插件窗口

## 下一步

- 📖 [plugin.json 配置详解](./plugin-json.md)
- 🔌 [插件 API 参考](./plugin-api.md)
- ⚡ [Preload 脚本指南](./preload-js.md)
- 📁 [插件目录结构](./file-structure.md)
- 📦 [发布插件](./publish.md)