
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

- 新组件放 `src/components/<name>/index.tsx`
- 类型定义集中放 `src/types/`
- IPC 通道命名：`kebab-case`
- 样式：使用语义化 Token，禁止硬编码颜色

### 4. 文档

更新 `docs/` 中对应的文档站文件，保持与代码变更同步。

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

## 目录规范

```
src/
  styles/             样式文件（Token、基础、动画、滚动条）
  i18n/               国际化（locales/ 下按语言拆分）
  components/
    common/           通用组件（ErrorBoundary）
    layout/           布局组件（Sidebar、TopBar、AppLayout）
    log-viewer/       实时日志查看器
    plugin/           插件组件（PluginDetailModal、ImportPluginButton）
    update/           自动更新 UI
  contexts/           React Context（ThemeContext、LanguageContext）
  pages/              页面组件
  routes/             路由定义
  types/              TypeScript 类型定义（.d.ts）
  utils/              工具函数（logger.ts）
  assets/             静态资源（SVG、图片）
electron/
  main/               主进程逻辑（窗口、IPC、自动更新）
    plugin/
      api/            插件 API 模块（dispatcher/clipboard/input/screen 等）
      installer/      插件安装（installer/download/market/zpx）
      runtime/        插件运行时（registry/runner/http）
  preload/            Preload 脚本（contextBridge）
plugins/               内置插件源码（详见 plugins/AGENTS.md）  ocr-service/         内置 OCR 服务（为其他插件提供文字识别能力）
  example-plugin/      示例插件模板resources/lib/         原生模块（.node / .dylib）
test/
  e2e/                Playwright E2E
  *.test.ts           Vitest 单元测试
public/               公共静态资源
```

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
src/i18n/
  index.ts          →  导出 Language 类型、translations、LANGUAGES
  locales/
    zh-CN.ts        →  中文翻译
    en-US.ts        →  英文翻译
```

### 使用方式

```tsx
import { useLanguage } from '@/contexts/LanguageContext'

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

> 参考：`electron/main/update.ts`、`electron/preload/index.ts`、`src/components/update/index.tsx`

---

## 配置文件索引

| 文件 | 用途 |
|------|------|
| [`vite.config.ts`](vite.config.ts) | Vite + Electron 构建配置 |
| [`tsconfig.json`](tsconfig.json) | TypeScript 严格编译选项 |
| [`electron-builder.json`](electron-builder.json) | 打包发布配置 |
| [`eslint.config.js`](eslint.config.js) | ESLint 配置 |
| [`.prettierrc`](.prettierrc) | Prettier 配置 |
| [`.github/workflows/`](.github/workflows/) | CI/CD 流水线 |
