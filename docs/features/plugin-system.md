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

市场源为 GitHub 仓库（`electron/main/plugin/installer/market.ts` 中 `GITHUB_REPO` 配置），采用「清单 + 源码目录」模式：

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

市场远程图标经 `market-icon://` 协议代理到主进程，主进程按文件头字节嗅探并修正 MIME。即使插件把 SVG 内容存成 `logo.png`（GitHub raw 会以 `text/plain` + `nosniff` 返回导致 `<img>` 拒绝渲染），也能正确显示。

## 我的插件

- 启动/停止（独立 BrowserWindow，背景色固定白色）
- 卸载 / 导入 `.zpx`/`.zip`
- 内置插件显示 `内置` 标签

## 插件格式

- **ZPX**: ASAR 压缩格式，支持版本管理
- **ZIP**: 普通压缩包，根目录必须包含 `plugin.json`

## ZTools 兼容

插件通过 `window.ztools` 调用宿主 API，接口与 ZTools 完全一致：

```javascript
// 截图 → OCR
ztools.screenCapture(async (base64) => {
  const text = await ztools.ai({ prompt: '识别图片文字', messages: [...] })
  ztools.copyText(text)
})
```

支持的全部 API 见 [插件 API 参考](/plugin-dev/plugin-api)。

## 插件窗口

独立 BrowserWindow 运行，`backgroundColor: '#ffffff'` 不受宿主主题影响。