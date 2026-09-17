import { useCallback, useEffect, useState } from 'react'
import { ScanText, Upload, Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { ocrService } from '@/services'
import type { OcrStatus } from '@ert/shared/types'

export function OcrPage() {
  const { t } = useLanguage()
  const [status, setStatus] = useState<OcrStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [meta, setMeta] = useState('')

  const refreshStatus = useCallback(async () => {
    try {
      const s = await ocrService.status()
      setStatus(s)
    } catch (e) {
      setStatus({
        enabled: true,
        engine: 'rapidocr',
        available: false,
        error: (e as Error).message,
      })
    }
  }, [])

  useEffect(() => {
    // 首屏拉取引擎状态（异步 IPC，非同步 setState）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStatus()
  }, [refreshStatus])

  const onFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    setText('')
    setMeta('')
    try {
      const buf = await file.arrayBuffer()
      const b64 = bufferToBase64(buf)
      const result = await ocrService.recognize({ imageBase64: b64 })
      if (!result.ok) {
        setText(result.error || t('ocr.failed'))
        toast.error(result.error || t('ocr.failed'))
      } else {
        setText(result.text || '')
        setMeta(
          `${result.confidence?.toFixed?.(1) ?? result.confidence}% · ${result.durationMs ?? '-'}ms · ${result.engine ?? 'rapidocr'}`,
        )
        toast.success(t('ocr.done'))
      }
    } catch (e) {
      setText((e as Error).message)
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <ScanText className="h-6 w-6 text-accent" />
          {t('ocr.title')}
        </h1>
        <p className="text-sm text-foreground-secondary">{t('ocr.subtitle')}</p>
      </header>

      <section className="rounded-2xl border border-border-default bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-foreground">{t('ocr.status')}</span>
          {status?.available ? (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-emerald-600">
              {t('ocr.available')}
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-amber-600">
              {t('ocr.unavailable')}
            </span>
          )}
          {status?.kind && (
            <span className="text-foreground-muted">
              {t('ocr.kind')}: {status.kind}
            </span>
          )}
          {status?.python && <span className="text-foreground-muted">Python {status.python}</span>}
        </div>
        {status?.error && <p className="mt-2 text-xs text-red-500">{status.error}</p>}
      </section>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-default bg-surface/50 px-6 py-10 transition hover:border-accent/50">
        {busy ? (
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        ) : (
          <Upload className="h-8 w-8 text-foreground-muted" />
        )}
        <span className="text-sm font-medium text-foreground-secondary">
          {busy ? t('ocr.working') : t('ocr.pick_image')}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {text && (
        <section className="rounded-2xl border border-border-default bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{t('ocr.result')}</span>
            <div className="flex items-center gap-2">
              {meta && <span className="text-xs text-foreground-muted">{meta}</span>}
              <button
                type="button"
                className="rounded-lg border border-border-default px-2 py-1 text-xs text-foreground-secondary hover:bg-surface-hover"
                onClick={() => {
                  void navigator.clipboard.writeText(text)
                  toast.success(t('ocr.copied'))
                }}
              >
                <Copy className="mr-1 inline h-3 w-3" />
                {t('ocr.copy')}
              </button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
            {text}
          </pre>
        </section>
      )}
    </div>
  )
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}
