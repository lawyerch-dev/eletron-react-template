# capabilities

可抽插能力开关与路由聚合（薄层）。

- 开关真源：`packages/shared/src/capabilities/config.ts`（`@ert/shared/capabilities`）
- 本地 `config.ts` 仅 re-export，勿在此改布尔值
- `index.ts`：从 `@/features/*` 聚合路由与导航项

功能实现放在 `src/renderer/features/<name>/`，主进程对应 `src/main/features/capabilities/`。
