# 渲染层架构（src/renderer）

## 顶层目录

| 目录 | 层 | 职责 |
|------|----|------|
| `app/` | App | bootstrap、providers、routes、contexts、ErrorBoundary |
| `shell/` | App | 布局 chrome（AppLayout、Sidebar） |
| `features/` | Domain | 业务域垂直切片（页面/组件） |
| `services/` | Shared | 非组件 IPC 门面与运行时逻辑 |
| `ipc/` | Shared | `ipcApi` + `useIpcOn` |
| `capabilities/` | Shared | 能力开关 → 路由/导航聚合 |
| `lib/` `i18n/` `styles/` `assets/` `public/` | Shared | 工具、文案、样式、静态资源 |

## 分层（只允许向下）

```
app / shell / features
        ↓
services / ipc / capabilities / lib
        ↓
@ert/shared · @ert/plugin-api
```

禁止：
- `shell` / `services` 深入 import 某 feature 内部文件（应经 feature 公共入口）
- 页面直接 `window.api` / `window.ipcRenderer` / `window.plugin` / `window.logEvents`
- 渲染层 import `src/main/**`

## Feature 约定

```
features/<domain>/
├── index.ts        # 公共导出（命名导出，禁止 export *）
├── routes.tsx      # 可选：该域路由与导航项
├── pages/          # 页面
└── components/     # 域内组件
```

- 单文件 feature 可保持扁平（如 `about/About.tsx` + `index.ts`）
- 跨域复用应下沉到 `services/` 或 `components` 共享层，而不是横向 import 另一 feature 内部
- 能力相关 feature 经 `capabilities/index.ts` 挂路由/导航

## IPC 用法

```ts
import { pluginService } from '@/services'   // 推荐：页面层
import { ipcApi } from '@/ipc'               // service / hook 层
import { useIpcOn } from '@/ipc/useIpcOn'

const list = await pluginService.listInstalled()
useIpcOn('plugin.changed', () => refresh())
```

## 加新页面 checklist

1. `features/<domain>/` 建页 + `index.ts`
2. 需要 IPC → 先补 shared 路由，再写 `services/<domain>.ts`
3. 挂到 `app/routes.tsx` 或经 `capabilities` 聚合
4. 文案走 `i18n/locales/*`，颜色走语义 Token
5. 预检：`pnpm typecheck && pnpm lint && pnpm test`
