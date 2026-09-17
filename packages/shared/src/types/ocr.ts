export interface OcrLine {
  text: string
  confidence: number
  bbox?: Array<[number, number]>
}

export interface OcrRecognizeInput {
  imagePath?: string
  imageBase64?: string
  lang?: string
}

export interface OcrRecognizeResult {
  ok: boolean
  text?: string
  confidence?: number
  lines?: OcrLine[]
  engine?: string
  elapse?: number
  durationMs?: number
  error?: string
}

export interface OcrStatus {
  enabled: boolean
  engine: string
  available: boolean
  kind?: string
  python?: string
  runnerPath?: string
  error?: string
}
