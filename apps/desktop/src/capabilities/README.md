# capabilities

可抽插能力（渲染进程）。

- `config.ts`：总开关，关闭后路由/侧边栏不出现对应入口
- `plugin-routes.tsx`：插件市场与「我的产品」路由
- `ocr/`：OCR 能力占位（当前经插件市场安装 ocr-service）

主进程对应目录：`electron/main/capabilities/`（与 `config.ts` 开关保持同步）。
