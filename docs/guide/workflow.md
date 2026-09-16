---
title: "开发工作流"
description: "规划 → 设计 → 实现 → 文档 → 预检 → 提交；路径与约定以根目录 AGENTS.md 为准。"
---

# 开发工作流

权威约定见仓库根目录 [`AGENTS.md`](https://github.com/BluerAngala/electron-react-template/blob/main/AGENTS.md)。

## 1. 规划

任何新功能、页面、组件开发前，必须先做规划，谋定后动。

## 2. 设计

前端页面/组件开发前，必须先生成设计系统，禁止直接写代码。

**设计技能（`.agents/skills/`）优先级：**

1. `high-end-visual-design` — 高端视觉与设计系统
2. `gpt-taste` — Awwwards 级设计工程（GSAP、AIDA、Bento）
3. `design-taste-frontend` — 反模板化前端设计

**设计红线：**

- 禁止默认模板样式
- 禁止 Emoji 作为图标（用 SVG）
- 禁止硬编码颜色值（用语义化 Token）
- 必须有视觉层次、间距节奏、微交互动效

## 3. 实现

| 要做的事 | 放哪 |
|----------|------|
| 新业务 UI | `src/renderer/features/<name>/` |
| 类型 / IPC 契约 | `packages/shared/src/` |
| IPC 通道 | `packages/shared/src/ipc/channels.ts`（`kebab-case`） |
| 能力开关 | `packages/shared/src/capabilities/config.ts` |
| 内置插件 | `src/plugins/<name>/` |

## 4. 文档

更新 `docs/` 中对应的文档站文件。架构变更同步 `AGENTS.md` 与 `README.zh-CN.md`。

## 5. 预检

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

## 6. 提交

```bash
git add -A
git commit -m "feat/ fix/ chore/ docs/: 描述"
git push
```
