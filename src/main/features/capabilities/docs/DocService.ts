import fs from 'node:fs'
import path from 'node:path'
import { dialog } from 'electron'
import log from 'electron-log/main'
import type { DocExtractResult, DocFormat } from '@ert/shared/types'
import { windowManager } from '../../../app/window'

function detectFormat(filePath: string): DocFormat {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.txt':
    case '.log':
    case '.ini':
    case '.env':
    case '.yml':
    case '.yaml':
    case '.toml':
      return 'text'
    case '.md':
    case '.markdown':
      return 'markdown'
    case '.json':
      return 'json'
    case '.csv':
    case '.tsv':
      return 'csv'
    case '.html':
    case '.htm':
      return 'html'
    case '.pdf':
    case '.docx':
    case '.doc':
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.webp':
    case '.gif':
      return 'binary'
    default:
      return 'unknown'
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 轻量文档抽取：文本系格式直读；HTML 去标签；二进制格式提示扩展 */
class DocService {
  extract(filePath: string, maxLength = 50000): DocExtractResult {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return {
          ok: false,
          path: filePath,
          format: 'unknown',
          error: '文件不存在',
        }
      }
      const stat = fs.statSync(filePath)
      if (!stat.isFile()) {
        return {
          ok: false,
          path: filePath,
          format: 'unknown',
          error: '不是普通文件',
        }
      }
      const format = detectFormat(filePath)
      if (format === 'binary') {
        return {
          ok: false,
          path: filePath,
          format,
          sizeBytes: stat.size,
          error: '二进制格式（PDF/DOCX/图片）请用 OCR 或文档插件扩展',
        }
      }

      const raw = fs.readFileSync(filePath, 'utf-8')
      let text = format === 'html' ? stripHtml(raw) : raw
      let truncated = false
      if (text.length > maxLength) {
        text = text.slice(0, maxLength)
        truncated = true
      }
      return {
        ok: true,
        path: filePath,
        format,
        sizeBytes: stat.size,
        text,
        truncated,
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      log.warn('[docs] extract failed', message)
      return { ok: false, path: filePath, format: 'unknown', error: message }
    }
  }

  async pickAndExtract(maxLength?: number): Promise<DocExtractResult & { cancelled?: boolean }> {
    const win = windowManager.getMainWindow()
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['txt', 'md', 'json', 'csv', 'html', 'log', 'yml'] },
        { name: 'All files', extensions: ['*'] },
      ],
    })
    if (result.canceled || !result.filePaths[0]) {
      return {
        ok: false,
        path: '',
        format: 'unknown',
        cancelled: true,
        error: '已取消',
      }
    }
    return this.extract(result.filePaths[0], maxLength)
  }
}

export const docService = new DocService()
