import { IpcChannel } from '@ert/shared/ipc'

type IpcListener = (...args: unknown[]) => void

export interface CheckUpdateResult {
  error?: ErrorType
  [key: string]: unknown
}

export const updateService = {
  check: (): Promise<CheckUpdateResult> =>
    window.ipcRenderer.invoke(IpcChannel.CheckUpdate) as Promise<CheckUpdateResult>,
  startDownload: () => window.ipcRenderer.invoke(IpcChannel.StartDownload),
  cancelDownload: () => window.ipcRenderer.invoke(IpcChannel.CancelDownload),
  quitAndInstall: () => window.ipcRenderer.invoke(IpcChannel.QuitAndInstall),
  onCanAvailable: (cb: IpcListener) => window.ipcRenderer.on(IpcChannel.UpdateCanAvailable, cb),
  onError: (cb: IpcListener) => window.ipcRenderer.on(IpcChannel.UpdateError, cb),
  onProgress: (cb: IpcListener) => window.ipcRenderer.on(IpcChannel.DownloadProgress, cb),
  onDownloaded: (cb: IpcListener) => window.ipcRenderer.on(IpcChannel.UpdateDownloaded, cb),
  offCanAvailable: (cb: IpcListener) => window.ipcRenderer.off(IpcChannel.UpdateCanAvailable, cb),
  offError: (cb: IpcListener) => window.ipcRenderer.off(IpcChannel.UpdateError, cb),
  offProgress: (cb: IpcListener) => window.ipcRenderer.off(IpcChannel.DownloadProgress, cb),
  offDownloaded: (cb: IpcListener) => window.ipcRenderer.off(IpcChannel.UpdateDownloaded, cb),
}
