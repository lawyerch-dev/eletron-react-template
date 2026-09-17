import type { OcrRecognizeInput, OcrRecognizeResult, OcrStatus } from '@ert/shared/types'
import { ipcApi } from '@/ipc'

export const ocrService = {
  status: (): Promise<OcrStatus> => ipcApi.request('ocr.status', undefined as void),
  recognize: (input: OcrRecognizeInput): Promise<OcrRecognizeResult> =>
    ipcApi.request('ocr.recognize', input),
}
