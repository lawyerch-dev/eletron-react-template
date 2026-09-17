import { registerIpcHandler } from '../IpcApiService'
import { rapidOcrService } from '../../features/capabilities/ocr'

/** OCR 能力：状态 + 识别（主进程 sidecar，不依赖插件窗口） */
export function registerOcrIpcHandlers(): void {
  registerIpcHandler('ocr.status', () => rapidOcrService.status())
  registerIpcHandler('ocr.recognize', (_e, input) => rapidOcrService.recognize(input))
}
