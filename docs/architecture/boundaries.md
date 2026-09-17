# 架构边界

模板用 **eslint 强制** 进程与包边界，不靠自觉。

## 进程边界

```
src/main  ──禁止──▶  src/renderer（含别名 @/）
src/renderer ──禁止──▶  src/main
src/preload ──禁止──▶  src/renderer
```

跨进程共享类型与纯逻辑只进 `packages/shared`。

## 包边界

| 包 | 禁止 |
|----|------|
| `@ert/shared` | electron、react、`@/`、src/main、src/renderer |
| `@ert/plugin-api` | electron、react、宿主进程代码 |

## 渲染层 API 面

| 禁止 | 改用 |
|------|------|
| `window.ipcRenderer` | `@/ipc` 的 `ipcApi` 或 `@/services` |
| `window.plugin` | `pluginService` |
| `window.logEvents` | `logsService` |
| 页面直接 `window.api` | `@/services` / `@/ipc` |

## 主进程路径

| 禁止 | 改用 |
|------|------|
| 业务代码 `app.getPath` | `paths.userData` / `paths.temp` / … |
| 手拼 `process.resourcesPath` | `paths.resources*` |
| 手写 `APP_ROOT` | `initAppRoot` + `paths.appRoot()` |
| 业务 `new BrowserWindow` | `windowManager.open(type)` |

例外：`src/main/app/paths.ts` 自身，以及插件 API 对 Electron path 名的透传（`api/services.ts`、`api/dialog.ts`）。

## 相关

- `docs/development/ipc.md` — IpcApi
- `AGENTS.md` — 开发工作流（含 WindowManager / serviceRegistry）
