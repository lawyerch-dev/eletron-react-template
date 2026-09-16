import type { ProgressInfo } from 'electron-updater'
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import Modal from '@/components/update/modal'
import Progress from '@/components/update/progress'
import { useLanguage } from '@/shell/contexts/LanguageContext'

const Update = () => {
  const { t } = useLanguage()
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [versionInfo, setVersionInfo] = useState<VersionInfo>()
  const [updateError, setUpdateError] = useState<ErrorType>()
  const [progressInfo, setProgressInfo] = useState<Partial<ProgressInfo>>()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalBtn, setModalBtn] = useState<{
    cancelText?: string
    okText?: string
    onCancel?: () => void
    onOk?: () => void
  }>({
    onCancel: () => window.ipcRenderer.invoke('cancel-download').then(() => setModalOpen(false)),
    onOk: () => window.ipcRenderer.invoke('start-download'),
  })

  const checkUpdate = async () => {
    setChecking(true)
    const result = await window.ipcRenderer.invoke('check-update')
    setProgressInfo({ percent: 0 })
    setChecking(false)
    setModalOpen(true)
    if (result?.error) {
      setUpdateAvailable(false)
      setUpdateError(result?.error)
    }
  }

  const onUpdateCanAvailable = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: VersionInfo) => {
      setVersionInfo(arg1)
      setUpdateError(undefined)
      if (arg1.update) {
        setModalBtn((state) => ({
          ...state,
          cancelText: t('update.cancel'),
          okText: t('update.ok'),
          onOk: () => window.ipcRenderer.invoke('start-download'),
        }))
        setUpdateAvailable(true)
      } else {
        setUpdateAvailable(false)
      }
    },
    [t],
  )

  const onUpdateError = useCallback((_event: Electron.IpcRendererEvent, arg1: ErrorType) => {
    setUpdateAvailable(false)
    setUpdateError(arg1)
  }, [])

  const onDownloadProgress = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: ProgressInfo) => {
      setProgressInfo(arg1)
    },
    [],
  )

  const onUpdateDownloaded = useCallback(
    (_event: Electron.IpcRendererEvent, ..._args: unknown[]) => {
      setProgressInfo({ percent: 100 })
      setModalBtn((state) => ({
        ...state,
        cancelText: t('update.later'),
        okText: t('update.install'),
        onOk: () => window.ipcRenderer.invoke('quit-and-install'),
      }))
    },
    [t],
  )

  useEffect(() => {
    if (!window.ipcRenderer) return

    window.ipcRenderer.on('update-can-available', onUpdateCanAvailable)
    window.ipcRenderer.on('update-error', onUpdateError)
    window.ipcRenderer.on('download-progress', onDownloadProgress)
    window.ipcRenderer.on('update-downloaded', onUpdateDownloaded)

    return () => {
      if (!window.ipcRenderer) return
      window.ipcRenderer.off('update-can-available', onUpdateCanAvailable)
      window.ipcRenderer.off('update-error', onUpdateError)
      window.ipcRenderer.off('download-progress', onDownloadProgress)
      window.ipcRenderer.off('update-downloaded', onUpdateDownloaded)
    }
  }, [onUpdateCanAvailable, onUpdateError, onDownloadProgress, onUpdateDownloaded])

  return (
    <>
      <Modal
        open={modalOpen}
        cancelText={modalBtn?.cancelText}
        okText={modalBtn?.okText}
        onCancel={modalBtn?.onCancel}
        onOk={modalBtn?.onOk}
        title={t('update.title')}
        footer={updateAvailable ? null : undefined}
      >
        <div className="space-y-3">
          {updateError ? (
            <div className="text-sm leading-6 text-red-500">
              <p className="font-semibold text-red-600">{t('update.error')}</p>
              <p className="mt-1 max-h-40 overflow-auto">{updateError.message}</p>
            </div>
          ) : updateAvailable ? (
            <div className="space-y-3 text-sm text-foreground-secondary">
              <div className="text-base font-semibold text-foreground">
                {t('update.latest').replace('{version}', versionInfo?.newVersion ?? '')}
              </div>
              <div className="text-foreground-secondary">
                v{versionInfo?.version} -&gt; v{versionInfo?.newVersion}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="shrink-0 font-medium text-foreground-secondary">
                  {t('update.progress')}
                </div>
                <div className="min-w-0 flex-1">
                  <Progress percent={progressInfo?.percent}></Progress>
                </div>
              </div>
            </div>
          ) : (
            <pre className="overflow-auto text-left text-xs leading-6 text-foreground-secondary">
              {JSON.stringify(versionInfo ?? {}, null, 2)}
            </pre>
          )}
        </div>
      </Modal>
      <button
        disabled={checking}
        onClick={checkUpdate}
        className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-border-default bg-surface p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        {checking ? (
          <RefreshCw className="h-5 w-5 animate-spin text-foreground-muted" />
        ) : (
          <Download className="h-5 w-5 text-foreground-muted transition-colors group-hover:text-accent" />
        )}
        <span className="text-sm font-semibold text-foreground-secondary transition-colors group-hover:text-accent">
          {checking ? t('update.checking') : t('update.check')}
        </span>
      </button>
    </>
  )
}

export default Update
