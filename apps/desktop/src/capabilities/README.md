# capabilities

可抽插能力开关与路由聚合（薄层）。

- `config.ts`：总开关，关闭后路由/侧边栏不出现对应入口
- `index.ts`：从 `@/features/*` 聚合路由与导航项

功能实现放在 `src/features/<name>/`，主进程对应 `electron/main/capabilities/`。
