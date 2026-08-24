# OCR 服务插件

内置 OCR（光学字符识别）服务，使用 Tesseract.js 提供图片文字识别能力。

## 特性

- 🚀 **CDN 加载** - 无需本地安装依赖，直接使用 CDN 加载 Tesseract.js
- 📝 **预置测试用例** - 内置英文、数字、混合内容测试
- 🖼️ **图片上传** - 支持拖放或点击上传图片
- 📊 **识别结果** - 显示识别文本和置信度

## 使用方式

### 1. 启动插件

在"我的插件"页面，点击"OCR 识别服务"的启动按钮。

### 2. 测试识别

- **预置测试用例**：点击"英文文本"、"数字识别"或"混合内容"按钮
- **自定义图片**：点击上传区域或拖放图片

### 3. 查看结果

点击"开始识别"按钮，等待识别完成后查看结果。

## 技术实现

- 使用 Tesseract.js v5（CDN 加载）
- 支持英文识别（可扩展中文等其他语言）
- 图片预处理：灰度化、二进制化

## 开发者参考

在其他插件中使用 Tesseract.js：

```javascript
// 加载 Tesseract.js（CDN）
// <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>

// 创建 Worker
const worker = await Tesseract.createWorker('eng')

// 识别图片
const { data } = await worker.recognize(imagePath)
console.log(data.text)        // 识别的文本
console.log(data.confidence)  // 置信度

// 清理
await worker.terminate()
```

## 扩展语言

```javascript
// 加载中文语言包
const worker = await Tesseract.createWorker('chi_sim')

// 或多语言
const worker = await Tesseract.createWorker(['eng', 'chi_sim'])
```

## 注意事项

- 首次使用需要下载语言数据（约 2-4MB）
- 识别速度取决于图片大小和复杂度
- 建议图片分辨率不低于 300dpi

## License

MIT
