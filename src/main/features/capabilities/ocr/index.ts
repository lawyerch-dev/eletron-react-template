/**
 * 主进程 OCR 能力：挂接 RapidOCR sidecar（与 ocr-service 插件共用 runner）。
 * IPC 路由见 main/ipc/handlers/ocr.ts。
 */
import log from 'electron-log/main'
import { rapidOcrService } from './RapidOcrService'

export function initOcrCapability(): void {
  void rapidOcrService
    .status()
    .then((s) => {
      log.info(
        `[ocr] capability ready available=${s.available} kind=${s.kind ?? '-'} python=${s.python ?? '-'}`,
      )
      if (s.error) log.warn(`[ocr] ${s.error}`)
    })
    .catch((e) => log.warn('[ocr] probe failed', e))
}

export { rapidOcrService }
