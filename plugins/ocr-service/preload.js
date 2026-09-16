/**
 * OCR 服务插件 - Preload 脚本
 * 提供多引擎 OCR 能力，通过 ztools.registerProvider 注册为系统级服务
 *
 * 架构设计参考 Cherry Studio 的处理器注册表模式
 * 支持本地引擎 (RapidOCR / Tesseract / System OCR) 和远程引擎 (PaddleOCR API)
 */

const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawn } = require('child_process')
const os = require('os')

const PLUGIN_DIR = __dirname
const isMac = process.platform === 'darwin'
const isWin = process.platform === 'win32'
const isLinux = process.platform === 'linux'

// ==================== 引擎注册表 ====================

/**
 * OCR 引擎注册表 - 插件化架构核心
 * 每个引擎独立注册，支持懒加载和可用性检测
 */
class OcrProcessorRegistry {
  constructor() {
    this.processors = new Map()
    this.defaultProcessorId = null
    this.cache = new Map()
    this.cacheTTL = 5 * 60 * 1000 // 5 分钟缓存
  }

  /**
   * 注册 OCR 处理器
   * @param {string} id - 处理器唯一标识
   * @param {Object} processor - 处理器配置对象
   */
  register(id, processor) {
    this.processors.set(id, {
      id,
      name: processor.name,
      runtime: processor.runtime || 'local', // 'local' | 'remote'
      isSupported: processor.isSupported || (() => true),
      capabilities: processor.capabilities || ['image_to_text'],
      supportedLanguages: processor.supportedLanguages || ['eng'],
      handler: null, // 懒加载
      handlerFactory: processor.handlerFactory,
      _initialized: false
    })

    // 自动设置默认处理器（优先系统原生，其次 Tesseract）
    if (!this.defaultProcessorId) {
      if (isMac || isWin) {
        this.defaultProcessorId = 'system'
      } else {
        this.defaultProcessorId = 'tesseract'
      }
    }

    console.log(`[OCR] 处理器已注册: ${id} (${processor.runtime || 'local'})`)
  }

  /**
   * 获取所有可用处理器列表
   */
  getAvailableProcessors() {
    const result = []
    for (const [id, proc] of this.processors) {
      result.push({
        id,
        name: proc.name,
        runtime: proc.runtime,
        available: proc.isSupported(),
        capabilities: proc.capabilities,
        supportedLanguages: proc.supportedLanguages
      })
    }
    return result
  }

  /**
   * 获取指定处理器
   */
  getProcessor(id) {
    return this.processors.get(id)
  }

  /**
   * 初始化处理器（懒加载）
   */
  async initializeProcessor(id) {
    const proc = this.processors.get(id)
    if (!proc) throw new Error(`OCR 处理器 "${id}" 不存在`)
    if (!proc.isSupported()) throw new Error(`OCR 处理器 "${id}" 在当前平台不可用`)
    
    if (!proc._initialized && proc.handlerFactory) {
      proc.handler = await proc.handlerFactory()
      proc._initialized = true
    }
    return proc
  }

  /**
   * 设置默认处理器
   */
  setDefaultProcessor(id) {
    if (!this.processors.has(id)) {
      throw new Error(`处理器 "${id}" 不存在`)
    }
    this.defaultProcessorId = id
    console.log(`[OCR] 默认处理器已切换为: ${id}`)
  }

  /**
   * 获取缓存键
   */
  _getCacheKey(image, processorId, lang) {
    const hash = crypto.createHash('md5')
    if (typeof image === 'string') {
      hash.update(image.substring(0, 1000))
    } else if (Buffer.isBuffer(image)) {
      hash.update(image.slice(0, 1000))
    }
    hash.update(processorId)
    hash.update(lang || '')
    return hash.digest('hex')
  }

  /**
   * 从缓存获取结果
   */
  _getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result
    }
    this.cache.delete(cacheKey)
    return null
  }

  /**
   * 存入缓存
   */
  _setCache(cacheKey, result) {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })
    // 限制缓存大小
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  /**
   * 执行 OCR 识别
   * @param {string|Buffer} image - 图片数据（路径、base64 或 Buffer）
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async recognize(image, options = {}) {
    const { engine: engineId, lang, signal, useCache = true } = options
    const targetId = engineId || this.defaultProcessorId

    // 检查缓存
    if (useCache) {
      const cacheKey = this._getCacheKey(image, targetId, lang)
      const cached = this._getFromCache(cacheKey)
      if (cached) {
        console.log(`[OCR] 命中缓存: ${targetId}`)
        return cached
      }
    }

    // 初始化并执行识别
    const proc = await this.initializeProcessor(targetId)
    if (!proc.handler) {
      throw new Error(`处理器 "${targetId}" 未正确初始化`)
    }

    const startTime = Date.now()
    const result = await proc.handler.recognize(image, { lang, signal })
    const duration = Date.now() - startTime

    // 添加元数据
    result._meta = {
      processor: targetId,
      duration,
      timestamp: Date.now()
    }

    // 存入缓存
    if (useCache) {
      const cacheKey = this._getCacheKey(image, targetId, lang)
      this._setCache(cacheKey, result)
    }

    console.log(`[OCR] 识别完成: ${targetId} (${duration}ms)`)
    return result
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    console.log('[OCR] 缓存已清除')
  }
}

// ==================== 创建全局注册表实例 ====================

const registry = new OcrProcessorRegistry()

// ==================== 图片预处理工具 ====================

/**
 * 图片预处理：统一转换为 Buffer
 */
async function preprocessImage(imageInput) {
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
  throw new Error('不支持的图片格式，支持：文件路径、base64、Buffer')
}

// ==================== Tesseract.js 引擎 ====================

/**
 * Tesseract.js 处理器 - 全平台支持的本地 OCR 引擎
 */
registry.register('tesseract', {
  name: 'Tesseract.js',
  runtime: 'local',
  isSupported: () => {
    try {
      return fs.existsSync(path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js'))
    } catch {
      return false
    }
  },
  capabilities: ['image_to_text'],
  supportedLanguages: ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'fra', 'deu', 'spa'],
  handlerFactory: async () => {
    let worker = null
    let currentLangs = null

    const initWorker = async (langs = ['eng', 'chi_sim']) => {
      if (worker && currentLangs === langs.join('+')) return worker
      
      if (worker) await worker.terminate()

      const tesseract = require(path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js'))
      worker = await tesseract.createWorker(langs, 1, {
        workerPath: path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
        corePath: path.join(PLUGIN_DIR, 'node_modules', 'tesseract.js-core', 'tesseract-core-simd-lstm.wasm.js'),
        langPath: path.join(PLUGIN_DIR, '..', '..'),
        logger: (progress) => {
          if (progress.status === 'recognizing text') {
            console.log(`[Tesseract] 识别进度: ${Math.round(progress.progress * 100)}%`)
          }
        }
      })
      currentLangs = langs.join('+')
      return worker
    }

    return {
      recognize: async (image, options = {}) => {
        const langs = options.lang ? options.lang.split('+') : ['eng', 'chi_sim']
        const w = await initWorker(langs)
        const processedImage = await preprocessImage(image)
        const { data } = await w.recognize(processedImage)
        
        return {
          text: data.text,
          confidence: data.confidence,
          lines: data.lines?.map(line => ({
            text: line.text,
            confidence: line.confidence,
            bbox: line.bbox
          })) || []
        }
      },
      destroy: async () => {
        if (worker) {
          await worker.terminate()
          worker = null
        }
      }
    }
  }
})

// ==================== 系统原生 OCR 引擎 ====================

/**
 * 系统原生 OCR 处理器
 * macOS: Vision Framework (VisionKit)
 * Windows: Windows.Media.Ocr
 * 同时支持 macOS 和 Windows
 */
registry.register('system', {
  name: isMac ? 'macOS Vision' : isWin ? 'Windows OCR' : '系统 OCR',
  runtime: 'local',
  isSupported: () => {
    if (!isMac && !isWin) return false
    try {
      require.resolve('@napi-rs/system-ocr')
      return true
    } catch {
      return false
    }
  },
  capabilities: ['image_to_text'],
  supportedLanguages: isMac 
    ? ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'fra', 'deu', 'spa', 'ita', 'por', 'rus']
    : ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor'],
  handlerFactory: async () => {
    let systemOcr = null
    try {
      systemOcr = require('@napi-rs/system-ocr')
    } catch (e) {
      console.warn('[System OCR] 模块加载失败:', e.message)
      throw new Error('系统 OCR 模块未安装，请运行: npm install @napi-rs/system-ocr')
    }

    // 语言代码映射：标准代码 -> 系统原生代码
    const langCodeMap = {
      'eng': 'en-US',
      'chi_sim': 'zh-Hans',
      'chi_tra': 'zh-Hant',
      'jpn': 'ja-JP',
      'kor': 'ko-KR',
      'fra': 'fr-FR',
      'deu': 'de-DE',
      'spa': 'es-ES',
      'ita': 'it-IT',
      'por': 'pt-BR',
      'rus': 'ru-RU'
    }

    return {
      recognize: async (image, options = {}) => {
        const processedImage = await preprocessImage(image)
        
        // 转换语言代码
        let preferredLangs = ['en-US']
        if (options.lang) {
          preferredLangs = options.lang.split('+').map(l => langCodeMap[l] || l)
        }
        
        // macOS Vision / Windows OCR 调用
        // 参数：image, accuracy, preferredLangs, signal
        const result = await systemOcr.recognize(
          processedImage,
          systemOcr.OcrAccuracy.Accurate,  // 使用精确模式
          preferredLangs,
          options.signal
        )
        
        return {
          text: result.text || '',
          confidence: (result.confidence || 1) * 100,  // 转换为百分比
          lines: []  // 系统 OCR 不返回行级信息
        }
      },
      destroy: async () => {
        // 系统 OCR 无需清理
      }
    }
  }
})

// ==================== RapidOCR (uv + Python sidecar) 引擎 ====================
// 参考 Cherry Studio：不内置 Python 包，用 uv 按需解析/缓存依赖并 STDIO 启动 sidecar。

const RAPIDOCR_SCRIPTS_DIR = path.join(PLUGIN_DIR, 'scripts')
const RAPIDOCR_RUNNER = path.join(RAPIDOCR_SCRIPTS_DIR, 'rapidocr_runner.py')

/** 解析 uv 可执行文件 */
function resolveUvBinary() {
  if (process.env.RAPIDOCR_UV) return process.env.RAPIDOCR_UV
  const candidates = [
    path.join(os.homedir(), '.local/bin/uv'),
    path.join(os.homedir(), '.cargo/bin/uv'),
    '/opt/homebrew/bin/uv',
    '/usr/local/bin/uv',
  ]
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c
    } catch {
      /* continue */
    }
  }
  return 'uv'
}

/** 是否存在本地可选 venv（用户自建，非内置） */
function resolveOptionalVenvPython() {
  const bin = isWin ? 'Scripts/python.exe' : 'bin/python'
  const p = path.join(PLUGIN_DIR, '.venv', bin)
  return fs.existsSync(p) ? p : null
}

/**
 * 构造 sidecar 启动命令。
 * 优先级（Cherry Studio 风格）：
 * 1. uv run --directory scripts（自动建隔离环境并安装 pyproject 依赖）
 * 2. 插件目录自建 .venv（可选，离线/钉死版本）
 * 3. 系统 Python（需已装 rapidocr）
 */
function resolveRapidOcrLaunch() {
  const uv = resolveUvBinary()
  // uv 配置存在即可用 uv 路径；实际能否跑通由 probe 验证
  return {
    kind: 'uv',
    bin: uv,
    argsPrefix: ['run', '--directory', RAPIDOCR_SCRIPTS_DIR, '--quiet', 'python'],
  }
}

function resolveRapidOcrLaunchFallback() {
  const venvPy = resolveOptionalVenvPython()
  if (venvPy) {
    return { kind: 'venv', bin: venvPy, argsPrefix: [] }
  }
  if (process.env.RAPIDOCR_PYTHON && fs.existsSync(process.env.RAPIDOCR_PYTHON)) {
    return { kind: 'python', bin: process.env.RAPIDOCR_PYTHON, argsPrefix: [] }
  }
  const sysPy =
    ['/opt/homebrew/bin/python3', '/usr/local/bin/python3', 'python3'].find((c) => {
      try {
        return c.includes('/') ? fs.existsSync(c) : true
      } catch {
        return false
      }
    }) || 'python3'
  return { kind: 'python', bin: sysPy, argsPrefix: [] }
}

function runRapidOcrProcess(launch, requestJson, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    const args = [...launch.argsPrefix, RAPIDOCR_RUNNER, requestJson]
    const child = spawn(launch.bin, args, {
      cwd: RAPIDOCR_SCRIPTS_DIR,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        UV_CACHE_DIR: process.env.UV_CACHE_DIR || path.join(os.homedir(), '.cache', 'uv'),
      },
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        /* ignore */
      }
      reject(new Error('RapidOCR 超时'))
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      const line = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .pop()
      if (!line) {
        const hint = stderr.includes('uv')
          ? '（请安装 uv：https://docs.astral.sh/uv/）'
          : ''
        reject(new Error((stderr.trim() || `RapidOCR 退出码 ${code}`) + hint))
        return
      }
      try {
        resolve(JSON.parse(line))
      } catch (e) {
        reject(new Error(`RapidOCR 输出解析失败: ${e.message}`))
      }
    })
  })
}

/**
 * RapidOCR 处理器 - https://github.com/RapidAI/RapidOCR
 * 通过 uv 按需拉起 Python 环境（不内置 .venv），STDIO JSON 通信。
 */
registry.register('rapidocr', {
  name: 'RapidOCR',
  runtime: 'local',
  isSupported: () => {
    if (!fs.existsSync(RAPIDOCR_RUNNER)) return false
    // 列表展示乐观可用；真正可用性由 handlerFactory probe 决定
    return true
  },
  capabilities: ['image_to_text'],
  supportedLanguages: ['chi_sim', 'eng', 'chi_tra', 'jpn', 'kor'],
  handlerFactory: async () => {
    let launch = resolveRapidOcrLaunch()
    let probe = await runRapidOcrProcess(launch, JSON.stringify({ probe: true }), 90000).catch(
      (e) => ({ ok: false, error: e.message }),
    )

    // uv 不可用时回退 venv / 系统 Python
    if (!probe || probe.ok !== true) {
      launch = resolveRapidOcrLaunchFallback()
      probe = await runRapidOcrProcess(launch, JSON.stringify({ probe: true }), 30000).catch(
        (e) => ({ ok: false, error: e.message }),
      )
    }

    if (!probe || probe.ok !== true) {
      throw new Error(
        `RapidOCR 环境不可用: ${(probe && probe.error) || '未找到 uv / Python + rapidocr'}。` +
          `请安装 uv（https://docs.astral.sh/uv/）或设置 RAPIDOCR_PYTHON`,
      )
    }
    console.log(`[RapidOCR] 就绪 kind=${launch.kind} bin=${launch.bin} python=${probe.python}`)

    return {
      recognize: async (image, options = {}) => {
        const processed = await preprocessImage(image)
        const request = { image_base64: Buffer.from(processed).toString('base64') }
        if (options.lang) request.lang = options.lang
        const result = await runRapidOcrProcess(launch, JSON.stringify(request))
        if (!result || result.ok === false) {
          throw new Error((result && result.error) || 'RapidOCR 识别失败')
        }
        return {
          text: result.text || '',
          confidence: Number(result.confidence || 0),
          lines: result.lines || [],
          engine: 'rapidocr',
        }
      },
      destroy: async () => {
        // sidecar 每次调用独立进程；依赖由 uv 缓存，无需应用内清理
      },
    }
  },
})

// ==================== 远程 OCR 引擎接口 ====================

/**
 * PaddleOCR 远程 API 处理器
 * 需要配置 API 端点和密钥
 */
registry.register('paddleocr', {
  name: 'PaddleOCR API',
  runtime: 'remote',
  isSupported: () => true, // 远程引擎始终可用，实际可用性取决于配置
  capabilities: ['image_to_text'],
  supportedLanguages: ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'fra', 'deu'],
  handlerFactory: async () => {
    let apiUrl = ''
    let apiKey = ''

    const loadConfig = () => {
      try {
        const configPath = path.join(PLUGIN_DIR, 'config.json')
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
          apiUrl = config.paddleocr?.apiUrl || ''
          apiKey = config.paddleocr?.apiKey || ''
        }
      } catch (e) {
        console.warn('[PaddleOCR] 配置加载失败:', e.message)
      }
    }

    return {
      recognize: async (image, options = {}) => {
        loadConfig()
        
        if (!apiUrl) {
          throw new Error('PaddleOCR API 未配置，请在 config.json 中设置 paddleocr.apiUrl')
        }

        const processedImage = await preprocessImage(image)
        const base64Image = processedImage.toString('base64')

        // 调用远程 API
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({
            image: base64Image,
            lang: options.lang || 'ch',
            use_angle_cls: true
          }),
          signal: options.signal
        })

        if (!response.ok) {
          throw new Error(`PaddleOCR API 错误: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        return {
          text: data.text || data.result?.map(r => r.text).join('\n') || '',
          confidence: data.confidence || 90,
          lines: data.result?.map(r => ({
            text: r.text,
            confidence: r.confidence || 90,
            bbox: r.bbox || r.box
          })) || []
        }
      },
      destroy: async () => {
        // 远程引擎无需清理
      }
    }
  }
})

// ==================== 初始化引擎 ====================

async function initEngines() {
  const available = registry.getAvailableProcessors().filter(p => p.available)
  console.log('[OCR] 可用处理器:', available.length > 0 ? available.map(p => `${p.name}(${p.runtime})`).join(', ') : '无')

  // 默认优先级：RapidOCR → 系统原生 → Tesseract
  if (registry.getAvailableProcessors().find(p => p.id === 'rapidocr')?.available) {
    registry.setDefaultProcessor('rapidocr')
  } else if (isMac || isWin) {
    registry.setDefaultProcessor('system')
  } else {
    registry.setDefaultProcessor('tesseract')
  }
}

initEngines().catch(err => console.error('[OCR] 初始化失败:', err))

// ==================== 注册到 ztools ====================

if (typeof ztools !== 'undefined' && ztools.registerProvider) {
  ztools.registerProvider('ocr', async (input) => {
    const { image, lang, engine, useCache } = input
    return await registry.recognize(image, { engine, lang, useCache })
  })
}

// ==================== 暴露插件 API ====================

window.ocrService = {
  /**
   * 获取所有可用处理器列表
   */
  getProcessors: () => registry.getAvailableProcessors(),

  /**
   * 获取处理器详情
   */
  getProcessor: (id) => {
    const proc = registry.getProcessor(id)
    if (!proc) return null
    return {
      id: proc.id,
      name: proc.name,
      runtime: proc.runtime,
      available: proc.isSupported(),
      capabilities: proc.capabilities,
      supportedLanguages: proc.supportedLanguages
    }
  },

  /**
   * 执行 OCR 识别
   */
  recognize: (image, options) => registry.recognize(image, options),

  /**
   * 设置默认处理器
   */
  setDefaultProcessor: (id) => {
    try {
      registry.setDefaultProcessor(id)
      return true
    } catch {
      return false
    }
  },

  /**
   * 获取当前默认处理器
   */
  getDefaultProcessor: () => registry.defaultProcessorId,

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages: () => {
    const languages = {}
    for (const [id, proc] of registry.processors) {
      languages[id] = proc.supportedLanguages
    }
    return languages
  },

  /**
   * 清除识别缓存
   */
  clearCache: () => registry.clearCache(),

  /**
   * 获取平台信息
   */
  getPlatformInfo: () => ({
    platform: process.platform,
    isMac,
    isWin,
    isLinux,
    defaultProcessor: registry.defaultProcessorId
  })
}

console.log('[OCR Service] 插件已加载 - 多引擎架构版本')
