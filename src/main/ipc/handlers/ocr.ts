import { registerIpcHandler } from '../IpcApiService'

/** OCR 能力：状态查询。插件本体由 ocr-service 提供。 */
export function registerOcrIpcHandlers(): void {
  registerIpcHandler('ocr.status', async () => ({
    enabled: true,
    engine: 'plugin:ocr-service',
  }))
}
