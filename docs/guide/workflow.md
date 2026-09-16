---
title: "开发工作流"
description: "任何新功能、页面、组件开发前，必须先做规划，谋定后动。"
---

# 开发工作流

## 1. 规划

任何新功能、页面、组件开发前，必须先做规划，谋定后动。

## 2. 设计

前端页面/组件开发前，必须先生成设计系统，禁止直接写代码。

**设计技能优先级：**
1. `ui-ux-pro-max` — 生成设计系统（配色、排版、风格、UX 规范）
2. `gpt-taste` — Awwwards 级别的设计工程（GSAP 动效、AIDA 结构、Bento 网格）
3. `design-taste-frontend` — 反模板化前端设计

**设计红线：**
- 禁止默认模板样式（无设计感的卡片、无聊的布局）
- 禁止 Emoji 作为图标（用 SVG）
- 禁止硬编码颜色值（用语义化 Token）
- 必须有视觉层次、间距节奏、微交互动效

## 3. 实现

- 新组件放 `apps/desktop/src/features/<name>/`
- 类型定义集中放 `src/types/`
- IPC 通道命名：`kebab-case`
- 样式：使用语义化 Token，禁止硬编码颜色

## 4. 文档

更新 `docs/` 中对应的文档站文件，保持与代码变更同步。

## 5. 预检

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

## 6. 推送

```bash
git add -A
git commit -m "feat/ fix/ chore: 描述"
git push
```