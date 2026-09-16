---
title: "插件目录结构"
description: "一个最简单的插件只需要以下几个文件："
---

# 插件目录结构

## 基本结构

一个最简单的插件只需要以下几个文件：

```
my-plugin/
├── plugin.json          # 插件配置文件（必需）
├── index.html           # 插件入口页面（或 main 字段指定的文件）
├── logo.png             # 插件图标（必需）
└── preload.js           # Node.js 预加载脚本（可选）
```

## 完整项目结构

使用前端框架开发时，典型的项目结构：

```
my-plugin/
├── plugin.json          # 插件配置文件
├── package.json         # 项目依赖配置
├── tsconfig.json        # TypeScript 配置（如使用 TS）
├── vite.config.js       # Vite 构建配置
├── preload.js           # Preload 脚本
├── src/                 # 源代码目录
│   ├── main.js          # 前端入口
│   ├── style.css        # 样式文件
│   └── ...              # 其他源文件
├── public/              # 静态资源
│   └── logo.png         # 插件 Logo
└── dist/                # 构建输出目录（构建后生成）
```

## 源码编译

宿主应用仅识别标准的 `html + css + javascript` 文件。如果你使用 Vue、React 等框架开发，需要先将源码编译为普通的前端文件：

```bash
# 使用 Vite 构建
npm run build
```

构建产物通常输出到 `dist/` 目录，然后将 `dist/` 目录打包为插件应用。

## 第三方依赖

### 前端依赖
在项目根目录下安装，正常编译输出到 `dist/` 即可。

### Node.js 依赖
在 `preload.js` 同级目录下安装，**不要**对它们进行编译，保持源码清晰可读。

## 打包

将插件目录打包为 `.zip` 文件即可导入：

```bash
cd dist
zip -r ../my-plugin.zip .
```

或使用 `.zpx` 格式（Host 插件包格式）。