# src

应用源码唯一入口（对齐 cherry-studio：业务代码不散落在仓库根）。

| 目录 | 说明 |
|------|------|
| `main/` | Electron 主进程（`app` 壳、`services` 可测业务、`features` 子系统） |
| `preload/` | contextBridge |
| `renderer/` | React UI（Vite root；含 `index.html`、`public/`） |
| `plugins/` | 内置插件源码（打包进 `resources/plugins`） |

跨进程契约在 `../packages/shared`，插件 API 类型在 `../packages/plugin-api`。
