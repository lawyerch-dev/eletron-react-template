# Plugins 目录

存放 Host 插件的源码目录。

## 目录结构

```
plugins/
├── AGENTS.md           # 插件开发指南（AI Agent 必读）
├── ocr-service/        # 内置 OCR 服务（为其他插件提供文字识别能力）
├── example-plugin/     # 示例插件模板
└── your-plugin/        # 自定义插件
```

## 内置服务插件

### OCR 服务 (`ocr-service`)

内置 OCR 服务，提供统一的文字识别能力，其他插件可直接调用，无需重复实现。

```javascript
// 其他插件调用 OCR 服务
const result = await host.ocr(image, { lang: 'chi_sim+eng' })
console.log(result.text)
```

详见 [ocr-service/README.md](./ocr-service/README.md)

API 全局对象为 `window.host`（类型见 `@ert/plugin-api`）。

## 快速开始

```bash
# 复制示例插件作为起点
cp -r example-plugin my-plugin

# 修改 plugin.json 配置
# 开发 src/main.js 功能
# 在宿主应用中导入测试
```

## 插件文件说明

| 文件 | 必需 | 说明 |
|------|------|------|
| `plugin.json` | ✅ | 插件配置（名称、入口、功能） |
| `index.html` | ✅ | 入口页面 |
| `preload.js` | ❌ | Node.js 预加载脚本 |
| `package.json` | ❌ | npm 依赖配置 |
| `vite.config.js` | ❌ | Vite 构建配置 |
| `logo.svg` | ❌ | 插件图标 |

## 开发文档

详细开发指南请查看 [AGENTS.md](./AGENTS.md) 或访问：

- [插件开发快速开始](../../../docs/plugin-dev/getting-started.md)
- [plugin.json 配置](../../../docs/plugin-dev/plugin-json.md)
- [插件 API 参考](../../../docs/plugin-dev/plugin-api.md)
