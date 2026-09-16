import { ipcMain } from 'electron'

/** OCR 能力主进程占位：状态查询。插件本体由 ocr-service 提供。 */
export function initOcrCapability(): void {
  ipcMain.handle('ocr:status', async () => ({
    enabled: true,
    engine: 'plugin:ocr-service',
  }))
}
