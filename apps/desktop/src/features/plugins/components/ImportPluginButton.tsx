import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface Props {
  onSuccess?: () => void
  variant?: 'default' | 'icon'
}

export function ImportPluginButton({ onSuccess, variant = 'default' }: Props) {
  const { t } = useLanguage()
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    if (importing) return
    setImporting(true)
    try {
      const result = await window.plugin.installFromFile()
      if (result.cancelled) {
        // 用户取消了文件选择，不做任何事
      } else if (result.success) {
        toast.success(t('market.import.success'))
        onSuccess?.()
      } else {
        toast.error(result.error || t('market.import.failed'))
      }
    } catch {
      toast.error(t('market.import.failed'))
    } finally {
      setImporting(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleImport}
        disabled={importing}
        title={t('market.import')}
        className="inline-flex items-center justify-center rounded-xl p-2 text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
      </button>
    )
  }

  return (
    <button
      onClick={handleImport}
      disabled={importing}
      className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
    >
      {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {t('market.import')}
    </button>
  )
}
