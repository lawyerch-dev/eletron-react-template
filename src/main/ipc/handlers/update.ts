import { app } from 'electron'
import type { ProgressInfo, UpdateDownloadedEvent } from 'electron-updater'
import updater from 'electron-updater'
import type { CheckUpdateResult } from '@ert/shared/types'
import { broadcastIpcEvent, registerIpcHandler, sendIpcEvent } from '../IpcApiService'

const autoUpdater = updater.autoUpdater
let cancellationToken = new updater.CancellationToken()
let isDownloading = false
let listenersBound = false

function bindAutoUpdaterListeners(): void {
  if (listenersBound) return
  listenersBound = true

  autoUpdater.on('update-available', (arg) => {
    broadcastIpcEvent('update.can_available', {
      update: true,
      version: app.getVersion(),
      newVersion: arg?.version,
    })
  })
  autoUpdater.on('update-not-available', (arg) => {
    broadcastIpcEvent('update.can_available', {
      update: false,
      version: app.getVersion(),
      newVersion: arg?.version,
    })
  })
}

/** 配置 electron-updater 并注册 update 域 IpcApi 路由。 */
export function initUpdateIpc(): void {
  autoUpdater.autoDownload = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false
  bindAutoUpdaterListeners()

  registerIpcHandler('update.check', async (): Promise<CheckUpdateResult> => {
    if (!app.isPackaged) {
      return { message: 'The update feature is only available after the package.' }
    }
    try {
      const result = await autoUpdater.checkForUpdates()
      return (result as CheckUpdateResult | null) ?? {}
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error'
      return { message }
    }
  })

  registerIpcHandler('update.start_download', (event) => {
    if (isDownloading) return
    isDownloading = true
    const sender = event.sender

    const cleanup = (): void => {
      autoUpdater.off('download-progress', onDownloadProgress)
      autoUpdater.off('error', onError)
      autoUpdater.off('update-downloaded', onDownloaded)
    }

    const onDownloadProgress = (info: ProgressInfo): void => {
      sendIpcEvent(sender, 'update.progress', {
        percent: info.percent,
        bytesPerSecond: info.bytesPerSecond,
        total: info.total,
        transferred: info.transferred,
      })
    }
    const onError = (error: Error): void => {
      cleanup()
      isDownloading = false
      sendIpcEvent(sender, 'update.error', { message: error.message })
    }
    const onDownloaded = (_event: UpdateDownloadedEvent): void => {
      cleanup()
      isDownloading = false
      sendIpcEvent(sender, 'update.downloaded', undefined as void)
    }

    autoUpdater.on('download-progress', onDownloadProgress)
    autoUpdater.on('error', onError)
    autoUpdater.once('update-downloaded', onDownloaded)
    autoUpdater.downloadUpdate(cancellationToken)
  })

  registerIpcHandler('update.cancel_download', () => {
    cancellationToken.cancel()
    cancellationToken = new updater.CancellationToken()
  })

  registerIpcHandler('update.quit_and_install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}
