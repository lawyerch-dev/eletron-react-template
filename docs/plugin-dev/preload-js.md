---
title: "Preload 脚本指南"
description: "Preload 是插件中一个特殊的 JavaScript 文件，它在插件窗口加载时预先执行，可以调用 Node.js 和 Electron 的原生 API。"
---

# Preload 脚本指南

## 什么是 Preload

Preload 是插件中一个特殊的 JavaScript 文件，它在插件窗口加载时预先执行，**可以调用 Node.js 和 Electron 的原生 API**。

在 `plugin.json` 中通过 `preload` 字段指定：

```json
{
  "preload": "preload.js"
}
```

## 为什么需要 Preload

在传统 Web 开发中，JavaScript 运行在沙箱环境中，无法访问本地文件、系统资源等。通过 Preload 机制，插件可以：

- 读写本地文件
- 执行系统命令
- 访问操作系统信息
- 使用 Electron 原生 API
- 引入第三方 Node.js 模块

## 基本用法

Preload 文件遵循 **CommonJS 规范**，使用 `require` 引入模块：

```javascript
// preload.js
const fs = require('fs')
const path = require('path')

// 通过 window 对象暴露给前端
window.myPluginApi = {
  readFile: (filePath) => {
    return fs.readFileSync(filePath, 'utf-8')
  },
  getFileInfo: (filePath) => {
    const stat = fs.statSync(filePath)
    return {
      size: stat.size,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
    }
  },
}
```

在前端代码中直接调用：

```javascript
// 前端代码
const content = window.myPluginApi.readFile('/path/to/file.txt')
console.log(content)
```

## 引入 Node.js 原生模块

```javascript
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execSync } = require('node:child_process')

window.services = {
  getOSInfo: () => ({
    arch: os.arch(),
    cpus: os.cpus(),
    release: os.release(),
  }),
  execCommand: (command) => execSync(command).toString(),
}
```

## 引入 Electron API

```javascript
const { clipboard, nativeImage } = require('electron')

window.services = {
  copyImage: (imageFilePath) => {
    clipboard.writeImage(nativeImage.createFromPath(imageFilePath))
  },
}
```

## 引入第三方模块

1. 在 `preload.js` 同级目录创建 `package.json`：

```json
{
  "type": "commonjs",
  "dependencies": {
    "colord": "^2.0.0"
  }
}
```

2. 安装依赖：

```bash
npm install
```

3. 在 preload 中使用：

```javascript
const { colord } = require('colord')

window.services = {
  darkenColor: (color) => colord(color).darken(0.1).toHex(),
}
```

## 与 `window.host` 的关系

宿主应用自动为每个插件窗口注入 `window.host` 全局对象，提供剪贴板、截图、数据库、通知等 50+ API，接口与 Host 完全兼容。插件无需额外配置即可使用。

```javascript
// 前端代码中直接调用，无需在 preload 中额外暴露
host.copyText('hello')
host.showNotification('任务完成')
const image = await host.screenCapture()
```

Preload 脚本仅用于需要 **自定义 Node.js 原生能力** 的场景，如文件系统操作、子进程等。

## 规范要求

- Preload 文件**不能进行打包/压缩/混淆**，要保证每一行代码清晰可读
- 引入的第三方模块也必须清晰可读，不允许压缩/混淆
- Preload 应与 `plugin.json` 位于同一目录或其子目录下