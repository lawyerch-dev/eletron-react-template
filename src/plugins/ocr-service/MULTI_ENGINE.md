# OCR 多引擎架构说明

## 支持的引擎

| 引擎 | 运行时 | 平台支持 | 特点 |
|------|--------|----------|------|
| **RapidOCR** | 本地 (uv + Python sidecar) | 全平台（需 uv） | PP-OCRv6 ONNX，中英优秀，**默认优先** |
| **Tesseract.js** | 本地 | 全平台 | 开源、离线可用 |
| **macOS Vision** | 本地 | macOS | 系统原生、速度快 |
| **Windows OCR** | 本地 | Windows | 系统原生、集成度高 |
| **PaddleOCR API** | 远程 | 全平台 | 中文识别优秀 |

## 引擎选择策略

1. **RapidOCR**（若本机有 [uv](https://docs.astral.sh/uv/)；依赖按需拉取，不内置包）
2. **macOS/Windows**: 系统原生 OCR
3. **其他平台 / 兜底**: Tesseract.js

安装 uv 即可启用 RapidOCR，无需在应用内打包 Python：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 配置远程引擎

1. 复制配置文件示例：
   ```bash
   cp config.example.json config.json
   ```

2. 编辑 `config.json`，填入你的 API 配置：
   ```json
   {
     "paddleocr": {
       "apiUrl": "https://your-api.com/ocr",
       "apiKey": "your-api-key"
     }
   }
   ```

## API 调用方式

其他插件可以通过以下方式调用 OCR 服务：

```javascript
// 使用默认引擎（有 RapidOCR 时优先）
const result = await host.ocr(image, { lang: 'chi_sim' })

// 指定引擎
const result = await host.ocr(image, {
  engine: 'rapidocr',  // 或 'system', 'tesseract', 'paddleocr'
  lang: 'chi_sim'
})

// 使用 ocrService API
const result = await window.ocrService.recognize(image, {
  engine: 'rapidocr',
  lang: 'eng',
  useCache: true
})

// 获取可用引擎列表
const processors = window.ocrService.getProcessors()

// 设置默认引擎
window.ocrService.setDefaultProcessor('rapidocr')

// 清除缓存
window.ocrService.clearCache()
```

## 语言代码

| 语言 | 代码 |
|------|------|
| 英文 | `eng` |
| 简体中文 | `chi_sim` |
| 繁体中文 | `chi_tra` |
| 日文 | `jpn` |
| 韩文 | `kor` |
| 法文 | `fra` |
| 德文 | `deu` |
| 西班牙文 | `spa` |

支持多语言同时识别，使用 `+` 连接：`eng+chi_sim`（Tesseract/System）；RapidOCR 默认中英混合模型。

## 缓存机制

- 识别结果自动缓存 5 分钟
- 相同图片+引擎+语言组合会命中缓存
- 可通过 `window.ocrService.clearCache()` 手动清除

## 平台特定说明

### macOS
需要安装 `@napi-rs/system-ocr`：
```bash
cd src/plugins/ocr-service && npm install @napi-rs/system-ocr
```

### Windows
Windows OCR 内置支持，无需额外安装。

### Linux
使用 Tesseract.js，语言数据自动下载。

## 故障排除

**问题：系统 OCR 不可用**
- 检查是否安装了 `@napi-rs/system-ocr`
- 确认操作系统版本支持

**问题：PaddleOCR API 调用失败**
- 检查 `config.json` 配置是否正确
- 确认 API 端点可访问
- 检查 API Key 是否有效

**问题：识别速度慢**
- 优先使用系统原生 OCR（`system` 引擎）
- 启用缓存机制
- 减少同时识别的语言数量
