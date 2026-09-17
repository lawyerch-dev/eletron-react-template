export interface UpdateVersionInfo {
  update: boolean
  version: string
  newVersion?: string
}

export interface UpdateErrorPayload {
  message: string
}

/** 与 electron-updater ProgressInfo 对齐的最小形状（避免 shared 依赖 electron） */
export interface UpdateProgressInfo {
  percent?: number
  bytesPerSecond?: number
  total?: number
  transferred?: number
}

export interface CheckUpdateResult {
  message?: string
  error?: { message: string }
  [key: string]: unknown
}
