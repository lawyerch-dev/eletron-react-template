# eletron-react-template

[![GitHub stars](https://img.shields.io/github/stars/lawyerch-dev/eletron-react-template?color=fa6470)](https://github.com/lawyerch-dev/eletron-react-template/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/lawyerch-dev/eletron-react-template?color=d8b22d)](https://github.com/lawyerch-dev/eletron-react-template/issues)
[![GitHub license](https://img.shields.io/github/license/lawyerch-dev/eletron-react-template)](https://github.com/lawyerch-dev/eletron-react-template/blob/main/LICENSE)
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
git clone https://github.com/lawyerch-dev/eletron-react-template.git
cd eletron-react-template
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

```
src/
├── styles/              Stylesheets (tokens, tailwind, base)
├── i18n/                Internationalization
│   └── locales/         zh-CN.ts, en-US.ts
├── components/
│   ├── common/          Shared components (ErrorBoundary)
│   ├── layout/          Layout (Sidebar, AppLayout)
│   ├── plugin/          Plugin UI (PluginDetailModal, ImportPluginButton)
│   └── update/          Auto-update UI
├── contexts/            React contexts (Theme, Language)
├── pages/               Page components (Home, PluginMarket, MyPlugins)
├── routes/              Route definitions
├── types/               TypeScript type definitions
├── assets/              SVG and images
electron/
├── main/
│   ├── plugin/          Plugin subsystem (market, installer, registry, runner)
│   ├── index.ts         Main process entry
│   └── update.ts        Auto-update
└── preload/             Preload scripts (contextBridge)
docs/                    VitePress documentation site
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

## IPC Communication

```typescript
// Renderer → Main
const result = await window.ipcRenderer.invoke('channel-name', ...args)

// Main process
ipcMain.handle('channel-name', (event, ...args) => { ... })
```

Key channels: `plugin:market-list`, `plugin:market-install`, `plugin:import-from-file`, `plugin:launch`, `plugin:list`, etc.

## Documentation

Full documentation is available at [https://bluerangala.github.io/eletron-react-template/](https://bluerangala.github.io/eletron-react-template/). Built with VitePress, deployed via GitHub Actions.

## License

[MIT](LICENSE)