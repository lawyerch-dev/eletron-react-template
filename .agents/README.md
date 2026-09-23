# .agents

项目内 AI 协作资产。编码代理优先读根目录 [`AGENTS.md`](../AGENTS.md)。

## skills/

| Skill | 用途 | 触发场景 |
|-------|------|----------|
| [`template-architecture`](skills/template-architecture/SKILL.md) | AGENTS.md 的实战参考附录：出错信息、capabilities 示例、跨项目复用步骤（**AGENTS.md 为唯一权威**） | 改结构、加功能、抽包前 |
| [`high-end-visual-design`](skills/high-end-visual-design/SKILL.md) | 品牌站、agency-style 落地页的高端视觉与动效 | **仅营销/品牌/agency landing**；不触发于工具 UI |
| [`gpt-taste`](skills/gpt-taste/SKILL.md) | Awwwards 级设计工程（GSAP、AIDA、Bento） | **仅 Awwwards 级营销页**；不触发于 Electron 桌面工具 |
| [`design-taste-frontend`](skills/design-taste-frontend/SKILL.md) | 反模板化 landing / portfolio / redesign | **仅 landing/portfolio/redesign**；不触发于 dashboard / data table / product UI |
| [`full-output-enforcement`](skills/full-output-enforcement/SKILL.md) | 强制完整输出 | 默认开启 |

## 约定

- 架构规则以 `AGENTS.md` 为唯一权威；实战细节（出错信息、capabilities 示例、跨项目复用步骤）按需读 `template-architecture`；目录树细节读 `docs/guide/directory-structure.md`
- UI 类问题先按 `AGENTS.md` §2 决策表判断是否触发设计 skill；触发了再读对应 skill；不触发直接走 `AGENTS.md`「主题系统」+「国际化」
- 插件开发读 `src/plugins/AGENTS.md` 与 `docs/plugin-dev/`
