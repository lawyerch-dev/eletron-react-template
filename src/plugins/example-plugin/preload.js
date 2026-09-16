// preload.js — 插件预加载脚本
// 该脚本可以调用 Node.js 原生 API，通过 window 对象暴露给前端

const fs = require('fs')
const path = require('path')

// 暴露自定义 API 给前端
window.myPluginApi = {
  // 读取文件内容
  readFile: (filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch (e) {
      return null
    }
  },

  // 获取文件信息
  getFileInfo: (filePath) => {
    try {
      const stat = fs.statSync(filePath)
      return {
        size: stat.size,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        modifiedAt: stat.mtime.toISOString(),
      }
    } catch (e) {
      return null
    }
  },

  // 写入文件
  writeFile: (filePath, content) => {
    try {
      const dir = path.dirname(filePath)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, content, 'utf-8')
      return true
    } catch (e) {
      return false
    }
  },

  // ==================== OCR 服务调用示例 ====================
  
  /**
   * 调用 OCR 服务识别图片文字
   * 这是插件间调用的示例：本插件调用 ocr-service 提供的能力
   */
  recognizeImage: async (imagePath) => {
    try {
      // 检查是否有可用的 OCR provider
      const providers = await host.providers.getProviders('ocr')
      if (!providers || providers.length === 0) {
        return {
          success: false,
          error: 'OCR 服务不可用，请先安装 ocr-service 插件'
        }
      }

      // 调用 OCR 服务
      const result = await host.ocr(imagePath, {
        lang: 'chi_sim+eng'  // 支持中英文
      })

      return {
        success: true,
        text: result.text,
        confidence: result.confidence
      }
    } catch (error) {
      console.error('[Example] OCR 调用失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * 查询可用的 OCR 引擎
   */
  getOcrEngines: async () => {
    try {
      // 尝试访问 ocr-service 暴露的 API
      if (window.ocrService) {
        return window.ocrService.getEngines()
      }
      return []
    } catch (error) {
      return []
    }
  }
}