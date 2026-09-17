import type { ProgressInfo } from 'electron-updater'
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import Modal from '@/features/update/modal'
import Progress from '@/features/update/progress'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { updateService } from '@/services'
import type { UpdateProgressInfo, UpdateVersionInfo } from '@ert/shared/types'

const Update = () => {
  const { t } = useLanguage()
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [versionInfo, setVersionInfo] = useState<UpdateVersionInfo>()
  const [updateError, setUpdateError] = useState<{ message: string }>()
  const [progressInfo, setProgressInfo] = useState<Partial<ProgressInfo>>()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalBtn, setModalBtn] = useState<{
    cancelText?: string
    okText?: string
    onCancel?: () => void
    onOk?: () => void
  }>({
    onCancel: () => updateService.cancelDownload().then(() => setModalOpen(false)),
    onOk: () => updateService.startDownload(),
  })

  const checkUpdate = async () => {
    setChecking(true)
    const result = await updateService.check()
    setProgressInfo({ percent: 0 })
    setChecking(false)
    setModalOpen(true)
    if (result?.error) {
      setUpdateAvailable(false)
      setUpdateError(result.error)
    }
  }

  const onUpdateCanAvailable = useCallback(
    (arg1: UpdateVersionInfo) => {
      setVersionInfo(arg1)
      setUpdateError(undefined)
      if (arg1.update) {
        setModalBtn((state) => ({
          ...state,
          cancelText: t('update.cancel'),
          okText: t('update.ok'),
          onOk: () => updateService.startDownload(),
        }))
        setUpdateAvailable(true)
      } else {
        setUpdateAvailable(false)
      }
    },
    [t],
  )

  const onUpdateError = useCallback((arg1: { message: string }) => {
    setUpdateAvailable(false)
    setUpdateError(arg1)
  }, [])

  const onDownloadProgress = useCallback((arg1: UpdateProgressInfo) => {
    setProgressInfo(arg1)
  }, [])

  const onUpdateDownloaded = useCallback(() => {
    setProgressInfo({ percent: 100 })
    setModalBtn((state) => ({
      ...state,
      cancelText: t('update.later'),
      okText: t('update.install'),
      onOk: () => updateService.quitAndInstall(),
    }))
  }, [t])

  useEffect(() => {
    const offs = [
      updateService.onCanAvailable(onUpdateCanAvailable),
      updateService.onError(onUpdateError),
      updateService.onProgress(onDownloadProgress),
      updateService.onDownloaded(onUpdateDownloaded),
    ]
    return () => {
      for (const off of offs) off()
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
