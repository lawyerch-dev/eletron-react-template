import type { CheckUpdateResult, UpdateProgressInfo } from '@ert/shared/types'
import { ipcApi } from '@/ipc'

/** 应用更新 —— 经 IpcApi，禁止在页面直接碰 window.api */
export const updateService = {
  check: (): Promise<CheckUpdateResult> => ipcApi.request('update.check', undefined as void),
  startDownload: () => ipcApi.request('update.start_download', undefined as void),
  cancelDownload: () => ipcApi.request('update.cancel_download', undefined as void),
  quitAndInstall: () => ipcApi.request('update.quit_and_install', undefined as void),
  onCanAvailable: (cb: (payload: import('@ert/shared/types').UpdateVersionInfo) => void) =>
    ipcApi.on('update.can_available', cb),
  onError: (cb: (payload: { message: string }) => void) => ipcApi.on('update.error', cb),
  onProgress: (cb: (payload: UpdateProgressInfo) => void) => ipcApi.on('update.progress', cb),
  onDownloaded: (cb: () => void) =>
    ipcApi.on('update.downloaded', () => {
      cb()
    }),
}
