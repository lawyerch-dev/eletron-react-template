# 插件开发指南

> 本文档供 AI Agent 开发新插件时参考，请严格遵循规范。

## 概述

插件是运行在独立窗口中的 Web 应用，结合 HTML/CSS/JavaScript 前端技术和 Node.js 本地能力。每个插件在独立 BrowserWindow 中运行，背景色固定为白色，不受宿主应用主题影响。

## 技术栈

**不限制 UI 框架**，支持任何前端技术栈：

- ✅ 原生 HTML/CSS/JavaScript
- ✅ React / Vue / Svelte / Angular
- ✅ TypeScript
- ✅ 任何 UI 库（Tailwind CSS、Ant Design、Element Plus 等）

宿主应用仅识别标准的 `html + css + javascript` 文件。使用框架开发时，需要先构建为普通前端文件：

```bash
# 使用 Vite / Webpack 等工具构建
npm run build
# 构建产物输出到 dist/ 目录，然后打包为插件
```

### 使用框架的项目结构

```
my-react-plugin/
├── plugin.json          # 插件配置（main 指向 dist/index.html）
├── package.json         # 依赖配置
├── vite.config.js       # 构建配置
├── preload.js           # Node.js 预加载脚本
├── src/
│   ├── App.tsx          # React 组件
│   ├── main.tsx         # 入口文件
│   └── index.css        # 样式
├── index.html           # Vite 入口模板
└── dist/                # 构建产物（打包时使用此目录）
    ├── index.html
    └── assets/
```

**关键点**：`plugin.json` 的 `main` 字段应指向构建后的 `dist/index.html`。

## 目录结构

```
plugins/
├── AGENTS.md              # 本文件 - 插件开发指南
├── example-plugin/        # 示例插件（可复制作为模板）
│   ├── plugin.json        # 插件配置（必需）
│   ├── index.html         # 入口页面（必需）
│   ├── preload.js         # Node.js 预加载脚本（可选）
│   ├── package.json       # npm 依赖配置（可选）
│   ├── vite.config.js     # Vite 构建配置（可选）
│   ├── logo.svg           # 插件图标（推荐 SVG）
│   └── src/
│       ├── main.js        # 前端逻辑
│       └── style.css      # 样式文件
└── your-plugin/           # 自定义插件目录
```

## 文件说明

### 1. plugin.json（必需）

插件核心配置文件，定义插件元数据和功能入口。

```json
{
  "name": "my-plugin",
  "title": "我的插件",
  "description": "插件功能描述",
  "version": "1.0.0",
  "main": "index.html",
  "logo": "logo.svg",
  "preload": "preload.js",
  "features": [
    {
      "code": "feature-code",
      "explain": "功能说明",
      "cmds": ["触发词1", "触发词2"]
    }
  ]
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 插件唯一标识，小写英文+连字符（如 `my-plugin`） |
| `title` | string | ✅ | 插件显示名称 |
| `description` | string | ❌ | 插件描述 |
| `version` | string | ❌ | 版本号，语义化版本（如 `1.0.0`） |
| `main` | string | ✅ | 入口文件，相对路径或在线 URL |
| `logo` | string | ✅ | 图标文件，推荐 SVG，支持 PNG/JPG |
| `preload` | string | ✅ | 预加载脚本，可调用 Node.js API |
| `features` | array | ❌ | 功能列表，定义触发方式 |

**features 配置：**

```json
{
  "code": "hello",
  "explain": "hello world",
  "cmds": ["hello", "你好"],
  "platform": "darwin"
}
```

- `code`: 功能唯一标识
- `explain`: 功能说明，显示在搜索结果
- `cmds`: 触发指令数组（字符串或正则对象）
- `platform`: 可选，支持平台 `win32`/`darwin`/`linux`

### 2. index.html（必需）

插件入口页面，加载到独立窗口中。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>插件标题</title>
  <link rel="stylesheet" href="./src/style.css" />
</head>
<body>
  <div id="app">
    <!-- 插件内容 -->
  </div>
  <script src="./src/main.js"></script>
</body>
</html>
```

### 3. preload.js（可选）

预加载脚本，可调用 Node.js 和 Electron API，通过 `window` 对象暴露给前端。

```javascript
const fs = require('fs')
const path = require('path')

window.myPluginApi = {
  readFile: (filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch (e) {
      return null
    }
  },
  writeFile: (filePath, content) => {
    try {
      const dir = path.dirname(filePath)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, content, 'utf-8')
      return true
    } catch (e) {
      return false
    }
  }
}
```

### 4. package.json（可选）

当插件需要 npm 依赖时使用。

```json
{
  "name": "ztools-plugin-my-plugin",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

### 5. vite.config.js（可选）

使用 Vite 构建时的配置。

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
```

## ztools API

前端通过 `window.ztools` 访问宿主 API：

### 基础 API

```javascript
// 应用信息
ztools.getAppVersion()      // 获取应用版本
ztools.getPlatform()        // 获取平台 'darwin'/'win32'/'linux'
ztools.isMacOs()            // 是否 macOS
ztools.isWindows()          // 是否 Windows
ztools.isLinux()            // 是否 Linux
ztools.isDev()              // 是否开发模式

// 路径
ztools.getPath('home')      // 获取系统路径（home/desktop/documents 等）
ztools.getPathForFile(file) // 获取拖放文件路径
```

### 通知 API

```javascript
ztools.showNotification('通知内容')           // 系统通知
ztools.showToast('提示消息', { duration: 2000 }) // Toast 提示
```

### 剪贴板 API

```javascript
ztools.copyText('文本')          // 复制文本
ztools.copyImage(base64Url)     // 复制图片
ztools.copyFile('/path/to/file') // 复制文件
ztools.getCopyedFiles()         // 获取已复制文件列表
```

### 对话框 API

```javascript
// 打开文件对话框
const files = ztools.showOpenDialog({
  properties: ['openFile', 'multiSelections'],
  filters: [{ name: 'Images', extensions: ['jpg', 'png'] }]
})

// 保存文件对话框
const savePath = ztools.showSaveDialog({
  filters: [{ name: 'Text', extensions: ['txt'] }]
})
```

### Shell API

```javascript
ztools.shellOpenExternal('https://example.com')  // 打开 URL
ztools.shellOpenPath('/path/to/file')            // 打开文件
ztools.shellShowItemInFolder('/path/to/file')    // 在文件管理器显示
ztools.shellBeep()                               // 系统提示音
```

### 窗口 API

```javascript
// 创建子窗口
const windowId = ztools.createBrowserWindow('https://example.com', {
  width: 800,
  height: 600
})

// 退出插件
ztools.outPlugin(false)  // false=不杀进程，true=杀进程
```

### 插件生命周期

```javascript
// 监听插件进入事件（接收启动参数）
window.ztools?.onPluginEnter((params) => {
  console.log('启动参数:', params.payload)
})
```

## 开发规范

### 命名规范

- 插件目录名：小写英文 + 连字符（`my-plugin`）
- `plugin.json.name`：与目录名一致
- `package.json.name`：`ztools-plugin-{name}`

### 样式规范

- 插件窗口背景固定为白色
- 不依赖宿主主题变量
- 使用独立样式系统

### 安全规范

- 不访问宿主应用数据
- 文件操作需用户授权
- 网络请求需明确告知用户

## 插件间调用（Provider 机制）

插件可以通过 **Provider 机制** 相互调用服务，避免重复造轮子。

### 注册服务（提供者）

```javascript
// 插件 A - 在 preload.js 中注册 OCR 服务
ztools.registerProvider('ocr', async (input) => {
  const { image, lang } = input
  // 实现 OCR 逻辑
  const text = await recognizeText(image, lang)
  return { text, confidence: 95 }
})
```

### 调用服务（消费者）

```javascript
// 插件 B - 调用 OCR 服务
const result = await ztools.ocr(image, { lang: 'chi_sim' })
console.log(result.text)

// 或使用通用 Provider API
const result = await ztools.providers.invokeProvider('ocr', { image, lang: 'eng' })

// 查询可用的 provider
const providers = await ztools.providers.getProviders('ocr')
```

### 内置服务插件

| 插件 | 服务类型 | 调用方式 |
|------|----------|----------|
| `ocr-service` | `ocr` | `ztools.ocr(image, options)` |

### 最佳实践

1. **优先调用现有服务** - 开发新功能前，先查询是否有可用的 provider
2. **声明式注册** - 在 `plugin.json` 的 `providers` 字段声明提供的服务
3. **统一接口** - 遵循标准的输入输出格式，方便其他插件调用
4. **错误处理** - 捕获并处理 provider 调用失败的情况

```javascript
// 查询是否有 OCR 服务
const ocrProviders = await ztools.providers.getProviders('ocr')
if (ocrProviders.length > 0) {
  // 有可用的 OCR 服务，直接调用
  const result = await ztools.ocr(image)
} else {
  // 没有 OCR 服务，提示用户安装
  ztools.showToast('请先安装 OCR 服务插件')
}
```

## 构建发布

1. 开发完成后运行 `npm run build`
2. 将插件目录或打包为 `.zip`/`.zpx` 文件
3. 通过宿主应用导入安装

## 快速开始

```bash
# 1. 复制示例插件
cp -r plugins/example-plugin plugins/my-plugin

# 2. 修改配置
# 编辑 plugins/my-plugin/plugin.json

# 3. 开发功能
# 编辑 plugins/my-plugin/src/main.js

# 4. 导入测试
# 在宿主应用中导入 plugins/my-plugin 目录
```

## 参考文档

- [插件开发快速开始](../docs/plugin-dev/getting-started.md)
- [plugin.json 配置详解](../docs/plugin-dev/plugin-json.md)
- [插件 API 参考](../docs/plugin-dev/plugin-api.md)
- [Preload 脚本指南](../docs/plugin-dev/preload-js.md)
- [发布插件](../docs/plugin-dev/publish.md)
