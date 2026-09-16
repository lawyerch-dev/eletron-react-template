---
title: "插件系统"
description: "三层插件来源：内置插件（随应用打包）→ 插件市场（GitHub 清单仓库）→ 本地导入（.zpx/.zip）。"
---

# 插件系统

三层插件来源：**内置插件**（随应用打包）→ **插件市场**（GitHub 清单仓库）→ **本地导入**（`.zpx`/`.zip`）。

## 插件来源

| 来源 | 路径 | 说明 |
|------|------|------|
| 内置插件 | `plugins/` | 随应用打包，自动注册，不可卸载 |
| 市场插件 | 在线下载 | 从 GitHub 插件仓库安装到 `userData/plugins/` |
| 本地导入 | `.zpx`/`.zip` | 用户手动选择文件导入 |

同名插件，用户安装的版本优先于内置版本。

## 插件市场

- 分类浏览、搜索、一键安装/卸载
- 详情弹窗（README、指令列表）
- 5 分钟缓存，手动刷新清缓存

### 市场仓库结构

市场源为 GitHub 仓库（`electron/main/plugin-host/installer/market.ts` 中 `GITHUB_REPO` 配置），采用「清单 + 源码目录」模式：

```
manifest.json          # 插件清单（name/version/title/logo/downloadUrl）
plugins/<name>/        # 每个插件的源码目录
  plugin.json          # 插件配置
  index.html           # 入口页面
  logo.png             # 插件图标
  README.md            # 详情弹窗展示的文档
```

`manifest.json` 示例：

```json
{
  "plugins": [
    {
      "name": "hello-world",
      "version": "1.0.0",
      "title": "Hello World",
      "logo": "plugins/hello-world/logo.png",
      "downloadUrl": "plugins/hello-world"
    }
  ]
}
```

安装流程：下载仓库归档 → 提取 `plugins/<name>` 子目录 → 打包为 zip → 走标准 ZIP 安装流程。若 `downloadUrl` 是 `.zip`/`.zpx` 的完整地址，则直接下载该文件安装（兼容历史 Release 模式）。

### 图标加载

| 类型 | 协议 | 说明 |
|------|------|------|
| 本地插件图标 | `plugin-icon://proxy/<encodeURIComponent(绝对路径)>` | 仅允许插件根目录内图片扩展名，防任意文件读 |
| 市场远程图标 | `market-icon://proxy/<url>` | 仅 GitHub 系域名；按文件头嗅探修正 MIME；体积上限 2MB |

即使插件把 SVG 内容存成 `logo.png`（GitHub raw 会以 `text/plain` + `nosniff` 返回导致 `<img>` 拒绝渲染），市场代理也能正确显示。

### Preload 注入

启动插件窗口时会加载两层脚本：

1. **宿主** `plugin-preload.js` → `window.host`（IPC / Provider）
2. **插件自身** `plugin.json` 的 `preload` 字段 → 例如 OCR 服务的 `window.ocrService`

未声明 `preload` 的插件只有 host API。

### 运行时依赖

- 最终用户**不需要**系统 Node.js：Electron 发行包内嵌 Node/Chromium。
- 插件的 `node_modules`（含原生模块）随插件目录经 `extraResources` 分发。
- OCR 的 RapidOCR 引擎可选依赖本机 [uv](https://docs.astral.sh/uv/)，应用内不打包 Python 包。

## 我的插件

- 启动/停止（独立 BrowserWindow，背景色固定白色）
- 卸载 / 导入 `.zpx`/`.zip`（卸载前会强制关闭运行中实例）
- 内置插件显示 `内置` 标签

## 内置 OCR 服务

`apps/desktop/plugins/ocr-service` 通过 Provider 注册 `ocr`，其他插件可调用：

```javascript
const result = await host.ocr(image, { engine: 'rapidocr', lang: 'chi_sim' })
```

引擎优先级：RapidOCR（uv）→ 系统原生 → Tesseract.js。详见插件目录 README。

## 插件格式

- **ZPX**: ASAR 压缩格式，支持版本管理
- **ZIP**: 普通压缩包，根目录必须包含 `plugin.json`

## Host 兼容

插件通过 `window.host` 调用宿主 API，接口与 Host 完全一致：

```javascript
// 截图 → OCR
host.screenCapture(async (base64) => {
  const text = await host.ai({ prompt: '识别图片文字', messages: [...] })
  host.copyText(text)
})
```

支持的全部 API 见 [插件 API 参考](/plugin-dev/plugin-api)。

## 插件窗口

独立 BrowserWindow 运行，`backgroundColor: '#ffffff'` 不受宿主主题影响。