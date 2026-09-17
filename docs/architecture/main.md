# 主进程架构（src/main）

## 顶层集合（封闭）

| 目录 | 职责 |
|------|------|
| `app/` | 应用运行时：paths、logging、protocols、window/、serviceRegistry、defaultServices |
| `ipc/` | IpcApi：`IpcApiService` + `handlers/<domain>` |
| `features/` | 大型业务域：`plugin-host`、`capabilities` |
| `services/` | 轻量模块（如 `window-state`） |
| `main.ts` | 胶水：preboot → IPC → services → openMain |

**新能力不新建顶层目录**，按性质落入既有类别。

## 依赖方向

```
main.ts
  → app/*（运行时）
  → ipc/*（边界）
  → features/*（业务）

features → app/paths · ipc · services
ipc/handlers → features · app/window
禁止：main → src/renderer 或 @/
```

## 关键模块

### paths（`app/paths.ts`）

- `initAppRoot` 在 `main.ts` 最早调用
- 业务用 `paths.userData/temp/resources/userPluginsRoot/...`
- 禁止散落 `app.getPath`（eslint 拦截）

### window（`app/window/`）

- `windowRegistry`：`main`（singleton + persist bounds）、`subWindow`（default）
- `windowManager.openMain()` / `open('subWindow', { hash })` / `focusMain()`
- 禁止业务 `new BrowserWindow`

### serviceRegistry（`app/serviceRegistry.ts`）

- `MainService`：`name` + 可选 `init`/`dispose`
- `registerService` → `bootstrapServices`（失败逆序 dispose）→ 运行 → `disposeServices`
- 默认服务：`pluginHost`（可选）、`capabilities`

### IpcApi（`ipc/`）

- 唯一传输：`ipc-api:request` / `ipc-api:event`
- 加路由：shared `IpcRequestMap` → `registerIpcHandler`
- 事件：`broadcastIpcEvent` / `sendIpcEvent`

## 加新能力 checklist

1. 若跨进程类型 → `packages/shared`
2. 命令式 IPC → 补 `routes.ts` + `handlers/<domain>.ts`
3. 需要长资源 → 实现 `MainService` 并 `registerService`
4. 需要新窗口类型 → `windowRegistry` 登记
5. 需要路径 → 扩展 `paths.ts`，勿手拼
6. `pnpm typecheck && pnpm lint && pnpm test`
