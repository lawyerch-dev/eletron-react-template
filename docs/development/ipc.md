---
title: "IPC 通信"
description: "插件通过 plugin-preload.js 中的 window.host 对象调用，底层走 plugin.api 统一分发通道和直接 IPC 通道。"
---

# IPC 通信

## 基本模式

```typescript
// 渲染进程 → 主进程
const result = await window.ipcRenderer.invoke('channel-name', ...args)

// 主进程监听
ipcMain.handle('channel-name', (event, ...args) => { ... })
```

## 插件管理

| 通道 | 方向 | 说明 |
|---|---|---|
| `plugin:market-list` | 渲染 → 主 | 获取插件市场列表 |
| `plugin:market-install` | 渲染 → 主 | 安装插件 |
| `plugin:market-cancel` | 渲染 → 主 | 取消下载 |
| `plugin:market-readme` | 渲染 → 主 | 获取插件 README |
| `plugin:list` | 渲染 → 主 | 列出已安装插件 |
| `plugin:delete` | 渲染 → 主 | 卸载插件 |
| `plugin:launch` | 渲染 → 主 | 启动插件 |
| `plugin:close` | 渲染 → 主 | 关闭插件 |
| `plugin:running` | 渲染 → 主 | 获取运行中插件 |
| `plugin:import-from-file` | 渲染 → 主 | 从文件导入插件 |

## 插件 API（预留给插件窗口调用）

插件通过 `plugin-preload.js` 中的 `window.host` 对象调用，底层走 `plugin.api` 统一分发通道和直接 IPC 通道。

**统一分发通道**：`plugin.api`（同步 + 异步），服务名包括 `getPath`、`getUser`、`getThemeInfo` 等。

**直接 IPC 通道**（由各 API 模块注册）：

| 模块 | 通道 |
|------|------|
| clipboard | `copy-text`、`copy-image`、`copy-file`、`get-copyed-files` |
| dialog | `get-path`、`show-save-dialog`、`show-open-dialog` |
| shell | `shell-open-external`、`shell-open-path`、`shell-show-item-in-folder`、`shell-beep`、`shell-trash-item`、`get-file-icon`、`get-os-type`、`get-window-type`、`is-dark-colors` |
| screen | `screen-capture`、`screen-color-pick`、`get-primary-display`、`get-all-displays`、`get-cursor-screen-point`、`dip-to-screen-point`、`screen-to-dip-point`、`dip-to-screen-rect`、`desktop-capture-sources`、`get-display-nearest-point` |
| input | `send-input-event`、`simulate-keyboard-tap`、`simulate-mouse-move/click/double-click/right-click`、`find-in-page`、`stop-find-in-page`、`hide-main-window-paste-text/image/file/type-string`、`is-dev`、`get-web-contents-id` |
| window | `createBrowserWindow`、`pluginBrowserWindowMethod`、`pluginBrowserWindowInvoke`、`send-to-parent`、`ipc-send-to`、`show-main-window`、`hide-main-window` |
| lifecycle | `out-plugin` |
| device | `get-native-id`、`get-app-version` |
| http | `http-set-headers`、`http-get-headers`、`http-clear-headers` |
| redirect | `redirect`、`host-redirect`、`host-redirect-hotkey-setting`、`host-redirect-ai-models-setting` |
| feature | `get-features`、`set-feature`、`remove-feature` |
| toast | `plugin:show-toast` |
| db | `db:put/get/remove/bulkDocs/allDocs/postAttachment/getAttachment/getAttachmentType`（同步+异步） |
| db-storage | `db-storage:set-item/get-item/remove-item` |

## 日志系统

| 通道 | 方向 | 说明 |
|---|---|---|
| `log-entry` | 主 → 渲染 | 实时推送单条日志 |
| `get-logs` | 渲染 → 主 | 批量获取日志缓冲区 |
| `get-log-path` | 渲染 → 主 | 获取日志文件路径 |
| `log:clear` | 渲染 → 主 | 清空日志缓冲区 |
| `log:from-renderer` | 渲染 → 主 | 渲染进程发送日志到主进程 |

## 事件广播

| 事件 | 方向 | 说明 |
|---|---|---|
| `plugins-changed` | 主 → 渲染 | 插件列表变更通知 |
| `plugin-market-download-progress` | 主 → 渲染 | 下载进度更新 |
| `plugin-toast` | 主 → 渲染 | Toast 提示 |