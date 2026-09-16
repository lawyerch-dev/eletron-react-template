# OCR 服务插件

内置 OCR（光学字符识别）服务，为其他插件提供统一的文字识别能力。

## 引擎

| 引擎 | 说明 | 默认优先级 |
|------|------|-----------|
| **RapidOCR** | [RapidAI/RapidOCR](https://github.com/RapidAI/RapidOCR) + ONNX Runtime，中英识别优秀 | **最高**（需配置环境） |
| macOS Vision / Windows OCR | 系统原生，速度快 | 次之 |
| Tesseract.js | 全平台开源兜底 | 兜底 |
| PaddleOCR API | 远程可选 | 手动配置 |

## 安装 RapidOCR 环境

**推荐：安装 [uv](https://docs.astral.sh/uv/)**（不内置 Python 包）

```bash
# 安装 uv（任选其一）
curl -LsSf https://astral.sh/uv/install.sh | sh
# brew install uv
```

宿主会自动执行类似命令拉起隔离环境并安装依赖：

```bash
uv run --directory plugins/ocr-service/scripts python rapidocr_runner.py '{"probe": true}'
```

依赖声明在 `scripts/pyproject.toml`，由 uv 缓存到全局，**不进入仓库、不打包进应用**。

可选（离线/钉版本）：

```bash
cd plugins/ocr-service && ./scripts/setup_rapidocr.sh   # uv venv 到插件目录
# 或设置 RAPIDOCR_PYTHON=/path/to/python（需已 pip install rapidocr onnxruntime）
```

## 使用方式

### 1. 启动插件

在「我的产品」页面启动「OCR 识别服务」。

### 2. 测试识别

- 预置测试用例（英文 / 数字 / 混合）
- 上传或拖放图片

### 3. 其他插件调用

```javascript
// 使用默认引擎（有 RapidOCR 时优先）
const result = await ztools.ocr(image, { lang: 'chi_sim' })

// 指定引擎
const result = await ztools.ocr(image, {
  engine: 'rapidocr', // 'system' | 'tesseract' | 'paddleocr'
  lang: 'chi_sim',
})

console.log(result.text, result.confidence, result.lines)
```

本窗口 API：

```javascript
await window.ocrService.recognize(image, { engine: 'rapidocr', lang: 'chi_sim' })
window.ocrService.getProcessors()
window.ocrService.setDefaultProcessor('rapidocr')
```

## RapidOCR 实现说明

- `scripts/rapidocr_runner.py`：Python sidecar，stdin/argv 收 JSON，stdout 输出 JSON
- 预处理后的图片以 base64 传入，由 runner 写临时文件后交给 RapidOCR
- 默认模型为 PP-OCRv6 中英（det/cls/rec ONNX），首次运行会自动下载模型到 site-packages
- 返回结构：`{ text, confidence, lines: [{ text, confidence, bbox }], elapse }`

## 注意事项

- 首次使用 RapidOCR 需要下载模型（约数十 MB，缓存在 Python 环境内）
- 识别速度取决于图片大小；系统 OCR 通常更快，RapidOCR 对中文更稳
- 插件窗口依赖 preload 直挂 `window.ocrService`，与宿主当前 `contextIsolation: false` 策略一致

## License

MIT（RapidOCR 本身为 Apache-2.0）
