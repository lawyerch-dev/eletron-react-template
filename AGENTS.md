
## 开发工作流（必须遵守）

### 1. 规划

任何新功能、页面、组件开发前，必须先做规划，谋定后动。

### 2. 设计

前端页面/组件开发前，**必须先用设计技能生成设计系统**，禁止直接写代码。

**技能优先级**：
1. **`ui-ux-pro-max`** — 生成设计系统（配色、排版、风格、UX 规范）
2. **`gpt-taste`** — Awwwards 级别的设计工程（GSAP 动效、AIDA 结构、Bento 网格）
3. **`design-taste-frontend`** — 反模板化前端设计

**设计红线**：
- ❌ 禁止默认模板样式（无设计感的卡片、无聊的布局）
- ❌ 禁止 Emoji 作为图标（用 SVG）
- ❌ 禁止硬编码颜色值（用语义化 Token）
- ❌ 禁止 6 行以上的标题文字墙
- ✅ 必须有视觉层次、间距节奏、微交互动效
- ✅ 必须遵循 AIDA 结构（Attention → Interest → Desire → Action）

### 3. 实现

- 新组件放 `apps/desktop/src/components/<Name>/`
- 类型定义集中放 `apps/desktop/src/types/`
- IPC 通道命名：`kebab-case`
- 样式：使用语义化 Token，禁止硬编码颜色
- 插件相关工具函数放 `apps/desktop/src/utils/plugin.ts`，不要定义在页面里再被组件反向 import

### 4. 文档

更新 `docs/` 中对应的文档站文件，保持与代码变更同步。架构/环境约定变更须同步本文件与 `README.zh-CN.md`。

### 5. 预检

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

### 6. 推送

```bash
git add -A
git commit -m "feat/ fix/ chore: 描述"
git push
```

---

## 运行时环境边界（重要）

| 角色 | 需要什么 | 说明 |
|------|----------|------|
| **最终用户（安装包）** | **不需要系统 Node.js** | Electron 发行包内嵌 Chromium + Node，应用与插件 preload 都跑在这套内嵌运行时上 |
| **开发者** | Node.js ≥ 20.19 / ≥ 22.12 + pnpm | 构建、Vite、测试、electron-builder |
| **RapidOCR 引擎（可选）** | 本机 [uv](https://docs.astral.sh/uv/) | 宿主用 `uv run` 按需拉起 Python sidecar，**不把 Python 包打进应用** |
| **插件 Node 依赖** | 随插件目录打包 | 如 `plugins/ocr-service/node_modules`（tesseract.js、原生模块），经 `extraResources` 分发，**禁止**在用户机器上现场 `npm install` |

**原则**：
- 不要引入「给最终用户安装 Node/nvm」的方案；打包应用自带 Node。
- 不要在应用启动时执行 `npm/pnpm install`。
- Python 侧只通过 uv / 可选 `.venv` / `RAPIDOCR_PYTHON` 使用，见 `plugins/ocr-service/scripts/README.md`。

---

## 目录规范

```
apps/desktop/                 # 桌面应用（pnpm workspace package: desktop）
  package.json / vite.config.ts / electron-builder.json / tsconfig*
  src/
    shell/                    # 壳 UI（布局、主题、i18n、Home/Settings/About）
      layout/                 # AppLayout、Sidebar、TopBar
      contexts/               # ThemeContext、LanguageContext
      common/                 # ErrorBoundary
      pages/                  # Home、Settings、About
    capabilities/             # 可抽插能力（config 开关 + 路由）
      config.ts               # ocr / mcp / agent / plugins
      plugin-routes.tsx
    components/               # 业务组件（plugin/、log-viewer/、update/）
    pages/                    # 能力页（PluginMarket、MyPlugins）
    routes/ styles/ i18n/ types/ utils/ assets/
  electron/
    main/
      index.ts                # 入口：shell → plugin → capabilities
      shell/                  # 协议、主窗、日志
      capabilities/           # registry + ocr/mcp/agent（与 src 开关同步）
      plugin/                 # 插件宿主（市场/安装/运行/安全）
    preload/
plugins/                      # 内置插件（ocr-service、example-plugin）
resources/lib/                # 原生模块
resources/ocr/                # OCR 训练数据
packages/                     # 共享库预留（shared-types 等）
docs/                         # VitePress 文档站
```

**裁剪方式**：改 `apps/desktop/src/capabilities/config.ts`（主进程同步改 `electron/main/capabilities/config.ts`）；关闭后路由与侧边栏不再出现对应入口。

---

## 插件运行约定

1. **启动注入两层 preload**
   - 宿主：`plugin-preload.js` → `window.ztools`（`webPreferences.preload`）
   - 插件自身：`plugin.json` 的 `preload` 字段 → 如 `window.ocrService`（`session.registerPreloadScript`）
2. **图标协议**
   - 本地：`plugin-icon://proxy/<encodeURIComponent(绝对路径)>`，仅允许插件目录内图片
   - 远程：`market-icon://proxy/<url>`，仅 GitHub 系域名 + 体积上限
3. **安装列表**统一由 `registry` 写入，installer 不得双写。
4. 卸载/覆盖安装前必须 `runner.forceClose` 运行中实例。

---

## 主题系统（语义化 Token 架构）

### 核心原则

**组件只用语义类名，不写死颜色值。** 加新主题只需改 CSS 变量，组件零改动。

### Token 流转

```
styles/tokens.css    →  --token-* 变量（按主题 class 切换）
styles/tailwind.css  →  @theme 注册为 Tailwind 值（--color-surface 等）
组件                 →  bg-surface、text-foreground、border-border-default
```

### 可用 Token

| Tailwind 类名 | 用途 | 对应变量 |
|---|---|---|
| `bg-background` | 页面背景 | `--token-bg` |
| `bg-surface` | 卡片/侧边栏 | `--token-surface` |
| `bg-surface-hover` | 悬停状态 | `--token-surface-hover` |
| `text-foreground` | 主文字 | `--token-text` |
| `text-foreground-secondary` | 次要文字 | `--token-text-secondary` |
| `text-foreground-muted` | 弱化文字 | `--token-text-muted` |
| `border-border-default` | 边框 | `--token-border` |
| `bg-accent` / `text-accent` | 强调色 | `--token-accent` |
| `text-accent-foreground` | 强调色上文字 | `--token-accent-text` |
| `bg-accent-subtle` | 强调色浅底 | `--token-accent-subtle` |

### 新增主题

在 `styles/tokens.css` 添加 class 块：

```css
html.sepia {
  --token-bg: #f5f0e8;
  --token-surface: #faf5ed;
  --token-surface-hover: #f0e8d8;
  --token-text: #433422;
  --token-text-secondary: #5c4a38;
  --token-text-muted: #8a7560;
  --token-border: #e0d5c5;
  --token-accent: #b08947;
  --token-accent-text: #ffffff;
  --token-accent-subtle: #faf3e8;
}
```

### 主题切换机制

- `ThemeContext` 切换 `html` 上的 class（`dark` / 自定义）
- `index.html` 内联脚本防 FOUC
- `document.startViewTransition()` + `clip-path` 圆弧动画

### ❌ 禁止的写法

```tsx
// 硬编码颜色 — 禁止
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">

// ✅ 正确 — 使用语义 Token
<div className="bg-surface text-foreground">
```

---

## 国际化

### 文件结构

```
apps/desktop/src/i18n/
  index.ts          →  导出 Language 类型、translations、LANGUAGES
  locales/
    zh-CN.ts        →  中文翻译
    en-US.ts        →  英文翻译
```

### 使用方式

```tsx
import { useLanguage } from '@/shell/contexts/LanguageContext'

const { t } = useLanguage()
t('home.hero.title')
```

### 新增翻译键

**必须**同时添加到 `zh-CN.ts` 和 `en-US.ts`：

```ts
// zh-CN.ts
'home.new.key': '中文文案',

// en-US.ts
'home.new.key': 'English text',
```

禁止在组件里硬编码用户可见中文/英文（ErrorBoundary 等 class 组件需读 i18n 字典）。

---

## 代码质量工具

| 工具 | 命令 | 用途 |
|------|------|------|
| ESLint | `pnpm lint` / `pnpm lint:fix` | 代码检查 |
| Prettier | `pnpm format` / `pnpm format:check` | 格式化 |
| TypeScript | `pnpm typecheck` | 类型检查 |
| Vitest | `pnpm test` | 单元测试 |
| Playwright | `pnpm test:e2e` | E2E 测试 |

**提交前预检**：
```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

---

## IPC 通信约定

```typescript
// 渲染进程 → 主进程
const result = await window.ipcRenderer.invoke('channel-name', ...args)

// 主进程监听
ipcMain.handle('channel-name', (event, ...args) => { ... })
```

> 参考：`apps/desktop/electron/main/update.ts`、`apps/desktop/electron/preload/index.ts`、`apps/desktop/src/components/update/index.tsx`

---

## 配置文件索引

| 文件 | 用途 |
|------|------|
| [`pnpm-workspace.yaml`](pnpm-workspace.yaml) | monorepo 包列表（apps/*、packages/*） |
| [`apps/desktop/vite.config.ts`](apps/desktop/vite.config.ts) | Vite + Electron 构建配置 |
| [`apps/desktop/tsconfig.json`](apps/desktop/tsconfig.json) | TypeScript 严格编译选项 |
| [`apps/desktop/electron-builder.json`](apps/desktop/electron-builder.json) | 打包发布配置（plugins/resources 经 `../../` 引用） |
| [`eslint.config.js`](eslint.config.js) | ESLint 配置 |
| [`.prettierrc`](.prettierrc) | Prettier 配置 |
| [`.github/workflows/`](.github/workflows/) | CI/CD 流水线 |
| [`plugins/ocr-service/scripts/`](plugins/ocr-service/scripts/) | RapidOCR sidecar（uv + pyproject） |
