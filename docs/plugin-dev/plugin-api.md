---
title: "插件 API 参考"
description: "插件通过全局对象 window.host 访问宿主应用提供的 API。"
---

# 插件 API 参考

插件通过全局对象 `window.host` 访问宿主应用提供的 API。

## 基础 API

### `host.getAppName()`
获取应用名称。

- **返回**: `string` — 固定返回 `'Host'`。

### `host.getAppVersion()`
获取应用版本号。

- **返回**: `string` — 应用版本号。

### `host.getPlatform()`
获取当前操作系统平台。

- **返回**: `string` — `'darwin'` | `'win32'` | `'linux'`。

### `host.isMacOs()` / `host.isMacOS()`
检测当前是否为 macOS 系统。

- **返回**: `boolean`

### `host.isWindows()`
检测当前是否为 Windows 系统。

- **返回**: `boolean`

### `host.isLinux()`
检测当前是否为 Linux 系统。

- **返回**: `boolean`

### `host.isDev()`
检查当前插件是否处于开发模式。

- **返回**: `boolean`

### `host.getWebContentsId()`
获取当前 WebContents ID。

- **返回**: `number`

### `host.getPathForFile(file)`
获取拖放文件的真实路径。

- **file**: `File` — 拖放事件中的 File 对象。
- **返回**: `string` — 文件的本地路径。

### `host.getPath(name)`
获取系统特殊路径。

- **name**: `string` — 路径名称（如 `'home'`、`'desktop'`、`'documents'` 等）。
- **返回**: `string` — 路径。

## 通知 API

### `host.showNotification(body)`
显示系统通知。

- **body**: `string` — 通知内容。

### `host.showToast(message, options)`
显示 Toast 提示。

- **message**: `string` — 提示消息。
- **options**: `object` — (可选) 配置项。

## 剪贴板 API

### `host.copyText(text)`
复制文本到剪贴板。

- **text**: `string` — 要复制的文本。
- **返回**: `boolean`

### `host.copyImage(image)`
复制图片到剪贴板。

- **image**: `string` — 图片 base64 Data URL 或文件路径。
- **返回**: `boolean`

### `host.copyFile(filePath)`
复制文件到剪贴板。

- **filePath**: `string` — 文件路径。
- **返回**: `boolean`

### `host.getCopyedFiles()`
获取已复制的文件列表。

- **返回**: `string[]`

## Shell API

### `host.shellOpenExternal(url)`
使用系统默认程序打开 URL。

- **url**: `string` — 要打开的 URL。
- **返回**: `boolean`

### `host.shellOpenPath(fullPath)`
使用系统默认方式打开文件或文件夹。

- **fullPath**: `string` — 文件或文件夹路径。
- **返回**: `boolean`

### `host.shellShowItemInFolder(fullPath)`
在文件管理器中显示文件。

- **fullPath**: `string` — 文件路径。
- **返回**: `boolean`

### `host.shellBeep()`
播放系统提示音。

## 对话框 API

### `host.showOpenDialog(options)`
弹出文件打开对话框。

- **options**: `object` — 对话框配置，与 Electron `showOpenDialogSync` 保持一致。
- **返回**: `string[] | undefined` — 选择的文件路径数组。用户取消则返回 `undefined`。

### `host.showSaveDialog(options)`
弹出文件保存对话框。

- **options**: `object` — 对话框配置，与 Electron `showSaveDialogSync` 保持一致。
- **返回**: `string | undefined` — 选择的路径。用户取消则返回 `undefined`。

## 窗口 API

### `host.createBrowserWindow(url, options, callback)`
创建独立子窗口。

- **url**: `string` — 窗口加载的 URL。
- **options**: `object` — 窗口选项，与 Electron `BrowserWindow` 构造函数选项保持一致。
- **callback**: `() => void` — (可选) 窗口加载完成后的回调函数。
- **返回**: `number | null` — 窗口 ID，创建失败返回 `null`。

### `host.outPlugin(isKill)`
退出插件应用。

- **isKill**: `boolean` — (可选) 为 `true` 时将结束进程。
- **返回**: `Promise<boolean>`

## 事件 API

### `host.onPluginEnter(callback)`
监听插件进入事件。当用户打开插件时触发。

- **callback**: `(param: LaunchParam) => void`

**LaunchParam 结构**:
- `payload`: `any` — 传递的数据
- `type`: `'text' | 'regex' | 'over'` — 命令类型
- `code`: `string` — 插件 Feature Code

### `host.onPluginReady(callback)`
兼容旧 API，功能与 `onPluginEnter` 相同。

### `host.onPluginOut(callback)`
监听插件退出事件。

- **callback**: `(isKill: boolean) => void`

## 显示器 API

### `host.getPrimaryDisplay()`
获取主显示器信息。

- **返回**: `object`

### `host.getAllDisplays()`
获取所有显示器。

- **返回**: `object[]`

### `host.getCursorScreenPoint()`
获取鼠标光标的屏幕坐标。

- **返回**: `{ x: number, y: number }`

## 数据库 API

插件拥有独立的数据库存储空间（Bucket），以插件名称隔离。

### `host.db.put(doc)`
保存数据。

- **doc**: `object` — 必须包含 `_id` 字段。
- **返回**: `object`

### `host.db.get(id)`
获取数据。

- **id**: `string` — 文档 ID。
- **返回**: `object | null`

### `host.db.remove(docOrId)`
删除数据。

- **docOrId**: `object | string` — 文档对象或文档 ID。
- **返回**: `object`

### `host.db.bulkDocs(docs)`
批量操作文档。

- **docs**: `object[]`
- **返回**: `object[]`

### `host.db.allDocs(key)`
获取所有文档或按 key 前缀查询。

- **key**: `string` — (可选) 文档 ID 前缀。
- **返回**: `object[]`

### `host.db.postAttachment(id, attachment, type)`
为文档添加附件。

- **id**: `string` — 文档 ID。
- **attachment**: `string | Buffer` — 附件内容。
- **type**: `string` — MIME 类型。

### `host.db.getAttachment(id)`
获取文档附件。

- **id**: `string` — 文档 ID。
- **返回**: `Buffer`

### `host.db.getAttachmentType(id)`
获取文档附件的 MIME 类型。

- **id**: `string` — 文档 ID。
- **返回**: `string`

### Promise API

数据库 API 还提供了 Promise 版本，位于 `window.host.db.promises` 下：

```javascript
await window.host.db.promises.put(doc)
await window.host.db.promises.get(id)
await window.host.db.promises.remove(docOrId)
await window.host.db.promises.bulkDocs(docs)
await window.host.db.promises.allDocs(key)
```

## 简易存储 API

类似 `localStorage` 的简化接口。

### `host.dbStorage.setItem(key, value)`
保存数据。

- **key**: `string` — 键名。
- **value**: `any` — 会自动序列化为 JSON。

### `host.dbStorage.getItem(key)`
获取数据。

- **key**: `string` — 键名。
- **返回**: `any`

### `host.dbStorage.removeItem(key)`
删除数据。

- **key**: `string` — 键名。

## 屏幕截图

### `host.screenCapture(callback)`
屏幕截图，进入截图模式后回调返回 base64 图片。

- **callback**: `(image: string, bounds?: object) => void`

### `host.screenColorPick(callback)`
屏幕取色。

- **callback**: `(result: { hex: string, rgb: string }) => void`

## 模拟输入

| API | 说明 |
|-----|------|
| `simulateKeyboardTap(key, ...modifiers)` | 模拟键盘按键 |
| `simulateMouseMove(x, y)` | 模拟鼠标移动 |
| `simulateMouseClick(x, y)` | 模拟鼠标单击 |
| `simulateMouseDoubleClick(x, y)` | 模拟鼠标双击 |
| `simulateMouseRightClick(x, y)` | 模拟鼠标右击 |
| `sendInputEvent(event)` | 发送输入事件 |
| `hideMainWindowPasteText(text)` | 粘贴文本到外部应用 |
| `hideMainWindowPasteImage(image)` | 粘贴图片到外部应用 |
| `hideMainWindowPasteFile(path)` | 粘贴文件到外部应用 |

## 剪贴板历史

```javascript
host.clipboard.getHistory(page, pageSize, filter)
host.clipboard.search(keyword)
host.clipboard.write(id, shouldPaste)
host.clipboard.writeContent(data, shouldPaste)
host.clipboard.delete(id)
host.clipboard.clear(type)
host.clipboard.onChange(callback)
```

## 页面内查找

| API | 说明 |
|-----|------|
| `findInPage(text, options)` | 在当前页面中查找文本 |
| `stopFindInPage(action)` | 停止查找 |
| `onFindInPageResult(callback)` | 监听查找结果 |

## 窗口管理

| API | 说明 |
|-----|------|
| `createBrowserWindow(url, options, callback)` | 创建独立子窗口，返回 Proxy 对象 |
| `showMainWindow()` | 显示主窗口 |
| `hideMainWindow(isRestorePreWindow)` | 隐藏主窗口 |
| `outPlugin(isKill)` | 退出插件 |
| `sendToParent(channel, ...args)` | 子窗口→父窗口通信 |

## 显示器

| API | 说明 |
|-----|------|
| `getPrimaryDisplay()` | 主显示器信息 |
| `getAllDisplays()` | 所有显示器 |
| `getCursorScreenPoint()` | 鼠标屏幕坐标 |
| `getDisplayNearestPoint(point)` | 最近的显示器 |
| `desktopCaptureSources(options)` | 桌面捕获源 |
| `dipToScreenPoint(point)` | DIP→物理坐标 |
| `screenToDipPoint(point)` | 物理→DIP 坐标 |
| `dipToScreenRect(rect)` | DIP→物理区域 |

## 动态 Feature

| API | 说明 |
|-----|------|
| `getFeatures(codes)` | 获取动态 features |
| `setFeature(feature)` | 设置动态 feature |
| `removeFeature(code)` | 删除动态 feature |

## HTTP 请求头

| API | 说明 |
|-----|------|
| `http.setHeaders(headers)` | 设置请求头 |
| `http.getHeaders()` | 获取请求头 |
| `http.clearHeaders()` | 清除请求头 |

## 文件操作

| API | 说明 |
|-----|------|
| `getFileIcon(path)` | 获取文件图标（base64） |
| `shellTrashItem(path)` | 文件移到废纸篓 |
| `readCurrentFolderPath()` | 读取当前文件夹路径 |
| `readCurrentBrowserUrl()` | 读取当前浏览器 URL |

## 基础信息

| API | 说明 |
|-----|------|
| `getNativeId()` | 设备唯一标识（32位） |
| `getWindowType()` | 窗口类型 |
| `isDarkColors()` | 是否深色主题 |
| `getThemeInfo()` | 主题信息 |
| `getUser()` | 当前用户信息 |

## 插件上下文

插件可以通过 `window.__PLUGIN_CONTEXT__` 获取自身信息：

```javascript
console.log(window.__PLUGIN_CONTEXT__)
// { name: "my-plugin", path: "/path/to/plugin" }
```