/**
 * OCR 服务插件 - Preload 脚本
 * 提供多引擎 OCR 能力，通过 ztools.registerProvider 注册为系统级服务
 */

const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')

const PLUGIN_DIR = __dirname

// OCR 引擎管理器
class OcrEngineManager {
  constructor() {
    this.engines = new Map()
    this.defaultEngine = null
  }

  registerEngine(id, engine) {
    this.engines.set(id, engine)
    if (!this.defaultEngine) {
      this.defaultEngine = id
    }
    console.log(`[OCR] 引擎已注册: ${id}`)
  }

  getEngines() {
    return Array.from(this.engines.entries()).map(([id, engine]) => ({
      id,
      name: engine.name,
      available: engine.available,
      languages: engine.supportedLanguages
    }))
  }

  async recognize(image, options = {}) {
    const { engine: engineId, lang, signal } = options
    const targetEngine = engineId || this.defaultEngine
    
    const engine = this.engines.get(targetEngine)
    if (!engine) {
      throw new Error(`OCR 引擎 "${targetEngine}" 不存在`)
    }

    if (!engine.available) {
      throw new Error(`OCR 引擎 "${targetEngine}" 不可用，请先安装依赖`)
    }

    return await engine.recognize(image, { lang, signal })
  }
}

// Tesseract 引擎
class TesseractEngine {
  constructor() {
    this.name = 'Tesseract'
    this.worker = null
    this.supportedLanguages = ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor']
    this._available = false
    this._initPromise = null
  }

  get available() {
    return this._available
  }

  async checkAvailability() {
    try {
      const tesseractPath = path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js')
      if (fs.existsSync(tesseractPath)) {
        this._available = true
        console.log('[OCR] Tesseract.js 可用')
      } else {
        console.log('[OCR] Tesseract.js 未安装，请运行: cd plugins/ocr-service && npm install')
        this._available = false
      }
    } catch (e) {
      console.log('[OCR] Tesseract 检查失败:', e.message)
      this._available = false
    }
  }

  async initialize(langs = ['eng', 'chi_sim']) {
    if (this._initPromise) {
      return this._initPromise
    }
    this._initPromise = this._doInitialize(langs)
    return this._initPromise
  }

  async _doInitialize(langs) {
    try {
      if (this.worker) {
        await this.worker.terminate()
      }

      const tesseract = require(path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js'))
      this.worker = await tesseract.createWorker(langs, 1, {
        workerPath: path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
        corePath: path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js-core', 'tesseract-core-simd-lstm.wasm.js'),
        langPath: path.join(PLUGIN_DIR, '..', '..'),
        logger: (progress) => {
          if (progress.status === 'recognizing text') {
            console.log(`[OCR] 识别进度: ${Math.round(progress.progress * 100)}%`)
          }
        }
      })
      console.log('[OCR] Tesseract 初始化完成')
    } catch (error) {
      console.error('[OCR] Tesseract 初始化失败:', error)
      this._available = false
      this._initPromise = null
    }
  }

  async recognize(image, options = {}) {
    if (!this.worker) {
      await this.initialize(options.lang ? [options.lang] : undefined)
    }

    try {
      const processedImage = await this._preprocessImage(image)
      const { data } = await this.worker.recognize(processedImage)
      
      return {
        text: data.text,
        confidence: data.confidence,
        lines: data.lines?.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        })) || []
      }
    } catch (error) {
      console.error('[OCR] Tesseract 识别失败:', error)
      throw error
    }
  }

  async _preprocessImage(imageInput) {
    if (typeof imageInput === 'string' && !imageInput.startsWith('data:') && fs.existsSync(imageInput)) {
      return fs.readFileSync(imageInput)
    }
    if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      const base64 = imageInput.split(',')[1]
      return Buffer.from(base64, 'base64')
    }
    if (Buffer.isBuffer(imageInput)) {
      return imageInput
    }
    throw new Error('不支持的图片格式')
  }

  async destroy() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
    this._initPromise = null
  }
}

// 创建引擎管理器实例
const engineManager = new OcrEngineManager()

// 注册 Tesseract 引擎
const tesseractEngine = new TesseractEngine()
engineManager.registerEngine('tesseract', tesseractEngine)

// 初始化检查
async function initEngines() {
  await tesseractEngine.checkAvailability()
  const available = engineManager.getEngines().filter(e => e.available)
  console.log('[OCR] 可用引擎:', available.length > 0 ? available.map(e => e.name).join(', ') : '无（需要安装依赖）')
}

initEngines().catch(err => console.error('[OCR] 初始化失败:', err))

// ==================== 注册到 ztools ====================

if (typeof ztools !== 'undefined' && ztools.registerProvider) {
  ztools.registerProvider('ocr', async (input) => {
    const { image, lang, engine } = input
    return await engineManager.recognize(image, { engine, lang })
  })
}

// ==================== 暴露插件 API ====================

window.ocrService = {
  getEngines: () => engineManager.getEngines(),
  recognize: (image, options) => engineManager.recognize(image, options),
  setDefaultEngine: (engineId) => {
    if (engineManager.engines.has(engineId)) {
      engineManager.defaultEngine = engineId
      return true
    }
    return false
  },
  initializeTesseract: (langs) => tesseractEngine.initialize(langs),
  getSupportedLanguages: () => ({
    tesseract: tesseractEngine.supportedLanguages
  })
}

console.log('[OCR Service] 插件已加载')
