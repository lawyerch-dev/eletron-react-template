# .agents

项目内 AI 协作资产。编码代理优先读根目录 [`AGENTS.md`](../AGENTS.md)。

## skills/

| Skill | 用途 |
|-------|------|
| [`template-architecture`](skills/template-architecture/SKILL.md) | AGENTS.md 的实战参考附录：出错信息、capabilities 示例、跨项目复用步骤（**AGENTS.md 为唯一权威**） |
| [`high-end-visual-design`](skills/high-end-visual-design/SKILL.md) | 高端视觉与设计系统 |
| [`gpt-taste`](skills/gpt-taste/SKILL.md) | Awwwards 级设计工程（GSAP、AIDA、Bento） |
| [`design-taste-frontend`](skills/design-taste-frontend/SKILL.md) | 反模板化前端设计 |
| [`full-output-enforcement`](skills/full-output-enforcement/SKILL.md) | 强制完整输出 |

## 约定

- 架构规则以 `AGENTS.md` 为唯一权威；实战细节（出错信息、capabilities 示例、跨项目复用步骤）按需读 `template-architecture`；目录树细节读 `docs/guide/directory-structure.md`
- UI 类问题先读设计技能，再遵守 `AGENTS.md` 设计红线与语义 Token
- 插件开发读 `src/plugins/AGENTS.md` 与 `docs/plugin-dev/`
