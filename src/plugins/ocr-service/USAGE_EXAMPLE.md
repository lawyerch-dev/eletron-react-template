# 示例：调用 OCR 服务

本示例演示如何在你的插件中调用内置的 OCR 服务。

## 场景

你有一个"发票识别"插件，需要识别发票图片上的文字。无需自己实现 OCR，直接调用 `ocr-service` 即可。

## 步骤

### 1. 创建插件

```bash
cp -r src/plugins/example-plugin plugins/invoice-reader
```

### 2. 修改 plugin.json

```json
{
  "name": "invoice-reader",
  "title": "发票识别",
  "description": "识别发票图片并提取关键信息",
  "version": "1.0.0",
  "main": "index.html",
  "logo": "logo.svg",
  "preload": "preload.js",
  "features": [
    {
      "code": "invoice",
      "explain": "发票识别",
      "cmds": ["发票", "invoice"]
    }
  ]
}
```

### 3. 在 preload.js 中调用 OCR 服务

```javascript
// invoice-reader/preload.js

window.invoiceReader = {
  /**
   * 识别发票图片
   * @param {string} imagePath - 图片路径或 base64
   * @returns {Promise<object>} 发票信息
   */
  async recognizeInvoice(imagePath) {
    try {
      // 调用 OCR 服务识别文字
      const ocrResult = await host.ocr(imagePath, {
        lang: 'chi_sim+eng'
      })

      // 解析发票信息
      const invoiceInfo = this.parseInvoiceText(ocrResult.text)

      return {
        success: true,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        invoice: invoiceInfo
      }
    } catch (error) {
      console.error('[Invoice] 识别失败:', error)

      // 如果 OCR 服务不可用，提示用户
      if (error.message.includes('未注册')) {
        host.showToast('请先安装 OCR 服务插件')
      }

      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * 解析发票文本，提取关键信息
   */
  parseInvoiceText(text) {
    const info = {
      invoiceNo: '',
      date: '',
      amount: '',
      seller: '',
      buyer: ''
    }

    // 提取发票号码
    const noMatch = text.match(/发票号码[：:]\s*(\d+)/)
    if (noMatch) info.invoiceNo = noMatch[1]

    // 提取日期
    const dateMatch = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
    if (dateMatch) info.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`

    // 提取金额
    const amountMatch = text.match(/[¥￥]\s*([\d,]+\.?\d*)/)
    if (amountMatch) info.amount = amountMatch[1]

    return info
  }
}
```

### 4. 创建前端页面

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>发票识别</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 24px;
      background: #fff;
    }
    .drop-zone {
      border: 2px dashed #e5e7eb;
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .drop-zone:hover {
      border-color: #0891b2;
      background: #f0fdff;
    }
    .result {
      margin-top: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .result-item {
      margin-bottom: 12px;
    }
    .result-label {
      font-size: 12px;
      color: #6b7280;
    }
    .result-value {
      font-size: 16px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <h1>发票识别</h1>
  <p>选择或拖放发票图片到下方区域</p>

  <div class="drop-zone" id="dropZone">
    点击选择图片
  </div>

  <div class="result" id="result" style="display: none;">
    <div class="result-item">
      <div class="result-label">发票号码</div>
      <div class="result-value" id="invoiceNo">-</div>
    </div>
    <div class="result-item">
      <div class="result-label">开票日期</div>
      <div class="result-value" id="date">-</div>
    </div>
    <div class="result-item">
      <div class="result-label">金额</div>
      <div class="result-value" id="amount">-</div>
    </div>
    <div class="result-item">
      <div class="result-label">识别置信度</div>
      <div class="result-value" id="confidence">-</div>
    </div>
    <details>
      <summary>原始文本</summary>
      <pre id="rawText"></pre>
    </details>
  </div>

  <script>
    const dropZone = document.getElementById('dropZone')
    const resultDiv = document.getElementById('result')

    dropZone.addEventListener('click', () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => handleFile(e.target.files[0])
      input.click()
    })

    async function handleFile(file) {
      if (!file) return

      dropZone.textContent = '识别中...'
      dropZone.style.pointerEvents = 'none'

      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const result = await window.invoiceReader.recognizeInvoice(e.target.result)
          
          if (result.success) {
            document.getElementById('invoiceNo').textContent = result.invoice.invoiceNo || '未识别'
            document.getElementById('date').textContent = result.invoice.date || '未识别'
            document.getElementById('amount').textContent = result.invoice.amount ? `¥${result.invoice.amount}` : '未识别'
            document.getElementById('confidence').textContent = `${Math.round(result.confidence)}%`
            document.getElementById('rawText').textContent = result.text
            resultDiv.style.display = 'block'
          } else {
            alert('识别失败: ' + result.error)
          }

          dropZone.textContent = '点击选择图片'
          dropZone.style.pointerEvents = 'auto'
        }
        reader.readAsDataURL(file)
      } catch (error) {
        alert('错误: ' + error.message)
        dropZone.textContent = '点击选择图片'
        dropZone.style.pointerEvents = 'auto'
      }
    }
  </script>
</body>
</html>
```

## 调用流程

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  发票识别插件    │ →   │  host.ocr()   │ →   │  OCR 服务插件   │
│  (消费者)       │     │  (Provider API) │     │  (提供者)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 注意事项

1. **错误处理** - 始终处理 OCR 服务不可用的情况
2. **语言选择** - 中文发票使用 `chi_sim+eng`
3. **性能** - 大图片可能需要较长时间，考虑添加加载状态
4. **缓存** - 对于重复识别，可以缓存结果

## 更多用法

```javascript
// 查询所有可用的 OCR 引擎
const engines = window.ocrService?.getEngines() || []

// 指定引擎
const result = await host.ocr(image, { 
  engine: 'system',  // 使用系统原生 OCR
  lang: 'chi_sim'
})

// 直接调用 Provider API
const result = await host.providers.invokeProvider('ocr', {
  image: '/path/to/image.png',
  lang: 'eng'
})
```
