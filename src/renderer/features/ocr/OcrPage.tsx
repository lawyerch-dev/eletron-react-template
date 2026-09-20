import { useCallback, useEffect, useState } from 'react'
import { Upload, Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { ocrService } from '@/services'
import type { OcrStatus } from '@ert/shared/types'
import { Badge, Btn, PageShell, SectionCard } from '@/shell/ui'

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
    <PageShell title={t('ocr.title')} description={t('ocr.subtitle')}>
      <SectionCard title={t('ocr.status')}>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <Badge tone={status?.available ? 'success' : 'warning'}>
            {status?.available ? t('ocr.available') : t('ocr.unavailable')}
          </Badge>
          {status?.kind && (
            <span className="text-foreground-muted">
              {t('ocr.kind')}: {status.kind}
            </span>
          )}
          {status?.python && <span className="text-foreground-muted">Python {status.python}</span>}
        </div>
        {status?.error && <p className="mt-2 text-xs text-danger">{status.error}</p>}
      </SectionCard>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-default bg-surface-2/50 px-6 py-10 transition hover:border-accent/50">
        {busy ? (
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        ) : (
          <Upload className="h-8 w-8 text-foreground-muted" />
        )}
        <span className="text-[13px] font-medium text-foreground-secondary">
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
        <SectionCard
          title={t('ocr.result')}
          actions={
            <>
              {meta && <span className="text-[11px] text-foreground-muted">{meta}</span>}
              <Btn
                onClick={() => {
                  void navigator.clipboard.writeText(text)
                  toast.success(t('ocr.copied'))
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                {t('ocr.copy')}
              </Btn>
            </>
          }
        >
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-[13px] leading-6 text-foreground">
            {text}
          </pre>
        </SectionCard>
      )}
    </PageShell>
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
