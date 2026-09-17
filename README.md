# electron-react-template

[![GitHub stars](https://img.shields.io/github/stars/lawyerch-dev/electron-react-template?color=fa6470)](https://github.com/lawyerch-dev/electron-react-template/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/lawyerch-dev/electron-react-template?color=d8b22d)](https://github.com/lawyerch-dev/electron-react-template/issues)
[![GitHub license](https://img.shields.io/github/license/lawyerch-dev/electron-react-template)](https://github.com/lawyerch-dev/electron-react-template/blob/main/LICENSE)
[![Required Node.js >= 20.19.0 || >= 22.12.0](https://img.shields.io/static/v1?label=node&message=%3E=20.19.0%20||%20%3E=22.12.0&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

English | [简体中文](README.zh-CN.md)

## Overview

An Electron + React + TypeScript desktop application with a built-in plugin system, theme engine, and internationalization. Based on [electron-vite-react](https://github.com/electron-vite/electron-vite-react).

### Features

- 🧩 **Plugin System** — Online plugin marketplace, local import, one-click install and launch
- 🔍 **Built-in OCR** — RapidOCR (uv sidecar) / system OCR / Tesseract.js
- 🎨 **Semantic Theme Engine** — CSS custom property tokens, light/dark themes, extensible
- 🌐 **i18n** — Multi-language support (zh-CN / en-US), easy to extend
- ⚡ **Vite + React 19** — Fast HMR, TypeScript strict mode
- 🔄 **Auto Update** — Powered by electron-updater
- 🧱 **Production main-process skeleton** — Typed IpcApi, path registry, WindowManager, serviceRegistry
- 🚫 **Lint-enforced process/package boundaries** — No bare `ipcRenderer`, no cross-process imports, no ad-hoc `app.getPath`
- 🧪 **Testing** — Vitest unit tests + Playwright E2E
- 📦 **CI/CD** — GitHub Actions + electron-builder + GitHub Pages docs

## Runtime Environment

| Audience | Requirement |
|----------|-------------|
| **End users (installers)** | **No system Node.js** — Electron ships Chromium + Node |
| Developers | Node.js ≥ 20.19 or ≥ 22.12 + pnpm |
| RapidOCR engine (optional) | [uv](https://docs.astral.sh/uv/); otherwise system OCR / Tesseract.js |
| Plugin npm deps | Ship with the plugin folder via `extraResources`; never `npm install` on the user machine |

## Quick Start

```sh
git clone https://github.com/lawyerch-dev/electron-react-template.git
cd electron-react-template
pnpm install
pnpm dev
```

Optional RapidOCR:

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build and package |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | E2E tests |
| `pnpm typecheck` | Type check |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm docs:dev` | Preview docs locally |
| `pnpm docs:build` | Build docs site |

## Project Structure

Aligned with cherry-studio: all source under `src/`, reusable packages under `packages/`, static assets under `resources/`.

```
electron-react-template/
├── src/
│   ├── main/                 Main process
│   ├── preload/              contextBridge
│   ├── renderer/             UI (index.html + public live here)
│   └── plugins/              Built-in plugin sources
├── packages/
│   ├── shared/               @ert/shared
│   └── plugin-api/           @ert/plugin-api
├── resources/ build/ tests/ scripts/ docs/
└── package.json / vite.config.ts / electron-builder.json
```

## Plugin System

### Plugin Market
Browse and install plugins from the online marketplace. Features:
- Category filtering and keyword search
- Plugin detail modal with README, metadata, and commands
- 5-minute cache to reduce API calls
- Download count display

### My Plugins
Manage installed plugins: launch, stop, uninstall, or import from local `.zpx` / `.zip` files.

### Plugin Window
Each plugin runs in a dedicated BrowserWindow with a white background, independent of the host app's theme.

## Theming

Uses **CSS custom properties** as semantic tokens. Components reference tokens (`bg-surface`, `text-foreground`), not raw colors.

### Token Flow

```
styles/tokens.css    →  --token-* variables (per theme class)
styles/tailwind.css  →  registered as @theme values
components           →  bg-surface, text-foreground, border-border-default
```

### Adding a New Theme

In `styles/tokens.css`, add a class block:

```css
html.sepia {
  --token-bg: #f5f0e8;
  --token-surface: #faf5ed;
  --token-accent: #b08947;
  /* ... */
}
```

No component changes needed.

### Theme Switching

- Location: sidebar bottom (theme toggle buttons)
- Options: light / dark / system (follows OS)
- Animation: circular arc reveal via `document.startViewTransition()` + `clip-path`
- FOUC prevention: inline script in `index.html`

## Internationalization

- Languages: `zh-CN`, `en-US`
- Usage: `const { t } = useLanguage(); t('home.hero.title')`
- New keys must be added to **both** locale files

## Architecture

See `docs/development/architecture.md` and `docs/architecture/`:

- Main: `docs/architecture/main.md` (paths / WindowManager / serviceRegistry / IpcApi)
- Renderer: `docs/architecture/renderer.md` (features / services / ipc)
- Boundaries: `docs/architecture/boundaries.md`

## IPC Communication

Host renderer traffic goes through **typed IpcApi**. Contracts live in `packages/shared/src/ipc/routes.ts`.

```typescript
// Renderer (via service; never window.ipcRenderer)
import { pluginService } from '@/services'
const list = await pluginService.listInstalled()

// Main
registerIpcHandler('plugin.list', () => registry.list())
```

See `docs/development/ipc.md`.

## Documentation

Full documentation is available at [https://bluerangala.github.io/electron-react-template/](https://bluerangala.github.io/electron-react-template/). Built with VitePress, deployed via GitHub Actions.

## License

[MIT](LICENSE)