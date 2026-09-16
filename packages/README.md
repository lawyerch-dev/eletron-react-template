# packages

跨项目可复用 workspace 包。

| 包名              | 路径                  | 职责                                                     |
| ----------------- | --------------------- | -------------------------------------------------------- |
| `@ert/shared`     | `packages/shared`     | IPC 通道、插件市场/安装类型、纯工具、capabilities 总开关 |
| `@ert/plugin-api` | `packages/plugin-api` | 插件运行时 `window.host` 类型定义                        |

## 使用

```ts
// 宿主应用
import { IpcChannel, isCapabilityEnabled } from '@ert/shared'
import { formatT } from '@ert/shared/utils/plugin'

// 插件作者（可选）
import type { HostApi } from '@ert/plugin-api'
```

新工具/能力若要跨项目复用：优先抽到本目录的包，或做成 `apps/desktop/plugins/*` 插件，避免再拷贝进业务仓库。
