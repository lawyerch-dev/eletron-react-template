---
title: "IPC 通信"
description: "宿主渲染层统一走 IpcApi；插件窗口经 plugin-preload.js 的 window.host。"
---

# IPC 通信

模板里有两套 IPC：

1. **宿主渲染层 IpcApi** — 类型化 RPC，唯一合法面是 `window.api.ipcApi`（页面应只用 `@/services` / `@/ipc`）
2. **插件沙箱通道** — 插件窗口经 `plugin-preload.js` 的 `window.host`，底层是 `plugin.api` 分发 + 各 API 模块注册的直接通道

---

## 宿主渲染层 IpcApi

### 契约真源

- 请求路由：`packages/shared/src/ipc/routes.ts` 的 `IpcRequestMap`
- 事件：同文件 `IpcEventMap`
- 传输通道：`ipc-api:request` / `ipc-api:event`（`IPC_API_REQUEST` / `IPC_API_EVENT`）

新能力顺序：

1. 在 `routes.ts` 补 request / event 类型
2. 在 `src/main/ipc/handlers/<domain>.ts` 用 `registerIpcHandler` 注册
3. 渲染层经 `src/renderer/services/` 或 `src/renderer/ipc` 调用

### 基本模式

```typescript
import { ipcApi } from '@/ipc'
// 或经 service：import { pluginService } from '@/services'

// 渲染进程
const list = await ipcApi.request('plugin.list', undefined as void)
const off = ipcApi.on('plugin.changed', () => {})

// 主进程
import { registerIpcHandler, broadcastIpcEvent } from '../IpcApiService'

registerIpcHandler('plugin.list', () => registry.list())
broadcastIpcEvent('plugin.changed', undefined as void)
```

错误模型：handler 抛出 `IpcError` 或普通 `Error`，渲染层 `request` 会 reject；`IpcError` 带 `code`。

### 路由一览（宿主）

| Route | 方向 | 说明 |
|---|---|---|
| `plugin.market.list` | R→M | 市场列表 |
| `plugin.market.recommendations` | R→M | 推荐插件 |
| `plugin.market.readme` | R→M | README |
| `plugin.market.clear_cache` | R→M | 清缓存 |
| `plugin.market.install` | R→M | 从市场安装 |
| `plugin.market.cancel` | R→M | 取消下载 |
| `plugin.import_from_file` | R→M | 本地导入 |
| `plugin.list` / `delete` / `launch` / `close` / `running` | R→M | 已安装插件管理 |
| `logs.get` / `get_path` / `clear` / `from_renderer` | R→M | 日志 |
| `update.check` / `start_download` / `cancel_download` / `quit_and_install` | R→M | 更新 |
| `window.open` | R→M | 打开子窗口 |
| `ocr.status` | R→M | OCR 能力状态 |

| Event | 方向 | 说明 |
|---|---|---|
| `log.entry` | M→R | 实时日志 |
| `plugin.changed` | M→R | 插件列表变更 |
| `plugin.download.progress` | M→R | 下载进度 |
| `plugin.toast` | M→R | Toast |
| `update.can_available` / `error` / `progress` / `downloaded` | M→R | 更新生命周期 |

### 边界约束

- 渲染层 **禁止** `window.ipcRenderer` / `window.plugin` / `window.logEvents`（eslint `no-restricted-properties`）
- preload 只暴露 `window.api.ipcApi`，不再透传完整 `ipcRenderer`
- 页面直接调用应走 `@/services`；`@/ipc` 的 `ipcApi` 供 service 与少量 hook 使用

---

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

插件沙箱内的通道 **不受** 宿主 IpcApi 约束；宿主新增能力仍必须进 `IpcRequestMap`。
