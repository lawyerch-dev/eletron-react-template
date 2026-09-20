import { useCallback, useEffect, useState } from 'react'
import { BookMarked, Loader2, Play, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { llmService, promptsService } from '@/services'
import type { PromptTemplate } from '@ert/shared/types'

const emptyDraft = (): PromptTemplate => ({
  id: '',
  name: '',
  content: '',
  description: '',
  category: '',
  createdAt: 0,
  updatedAt: 0,
})

export function PromptsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<PromptTemplate[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PromptTemplate | null>(null)
  const [tryInput, setTryInput] = useState('')
  const [tryPromptId, setTryPromptId] = useState('')
  const [tryResult, setTryResult] = useState('')
  const [trying, setTrying] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setItems(await promptsService.list())
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const openCreate = () => {
    setDraft(emptyDraft())
  }

  const openEdit = (p: PromptTemplate) => {
    setDraft({ ...p })
  }

  const saveDraft = async () => {
    if (!draft) return
    if (!draft.id.trim() || !draft.name.trim()) {
      toast.error(t('prompts.err_id_name'))
      return
    }
    setBusyId('draft')
    try {
      await promptsService.save({
        ...draft,
        id: draft.id.trim(),
        name: draft.name.trim(),
      })
      toast.success(t('prompts.saved'))
      setDraft(null)
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    setBusyId('del:' + id)
    try {
      await promptsService.delete(id)
      toast.success(t('prompts.deleted'))
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const tryComplete = async () => {
    const template = items.find((x) => x.id === tryPromptId)
    if (!template) {
      toast.error(t('prompts.pick_template'))
      return
    }
    if (!tryInput.trim()) {
      toast.error(t('prompts.need_input'))
      return
    }
    setTrying(true)
    setTryResult('')
    try {
      const result = await llmService.complete({
        role: 'default-assistant',
        messages: [
          { role: 'system', content: template.content },
          { role: 'user', content: tryInput },
        ],
      })
      if (!result.ok) {
        setTryResult(result.error || t('prompts.try_fail'))
        toast.error(result.error || t('prompts.try_fail'))
        return
      }
      setTryResult(result.content || '')
      toast.success(
        t('prompts.try_ok').replace('{ms}', String(result.latencyMs ?? 0)) +
          (result.modelId ? ` · ${result.modelId}` : ''),
      )
    } catch (e) {
      const msg = (e as Error).message
      setTryResult(msg)
      toast.error(msg)
    } finally {
      setTrying(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <BookMarked className="h-6 w-6 text-accent" />
            {t('prompts.title')}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('prompts.subtitle')}</p>
          <p className="mt-1 text-xs text-foreground-muted">{t('prompts.config_hint')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
          >
            <RefreshCw className="mr-1 inline h-4 w-4" />
            {t('prompts.refresh')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            {t('prompts.add')}
          </button>
        </div>
      </header>

      {draft && (
        <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              {draft.createdAt ? t('prompts.edit') : t('prompts.add')}
            </div>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg p-1 text-foreground-muted hover:bg-surface-hover"
              aria-label={t('prompts.cancel')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('prompts.field_id')}</span>
              <input
                value={draft.id}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                disabled={Boolean(draft.createdAt)}
                placeholder="translate-formal"
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('prompts.field_name')}</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder={t('prompts.field_name')}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('prompts.field_category')}</span>
              <input
                value={draft.category || ''}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="translate"
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('prompts.field_desc')}</span>
              <input
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-foreground-secondary">{t('prompts.field_content')}</span>
              <textarea
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                rows={6}
                placeholder={t('prompts.content_ph')}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
            >
              {t('prompts.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={busyId === 'draft'}
              className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busyId === 'draft' && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
              {t('prompts.save')}
            </button>
          </div>
        </section>
      )}

      {/* 试跑 */}
      <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
        <div className="text-sm font-medium text-foreground">{t('prompts.try')}</div>
        <p className="text-xs text-foreground-muted">{t('prompts.try_hint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={tryPromptId}
            onChange={(e) => setTryPromptId(e.target.value)}
            className="rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">{t('prompts.pick_template')}</option>
            {items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            value={tryInput}
            onChange={(e) => setTryInput(e.target.value)}
            placeholder={t('prompts.try_input_ph')}
            className="rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={() => void tryComplete()}
          disabled={trying || !tryPromptId}
          className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {trying ? (
            <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-1 inline h-4 w-4" />
          )}
          {t('prompts.run')}
        </button>
        {tryResult && (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border-default bg-background p-3 text-sm text-foreground">
            {tryResult}
          </pre>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-foreground">{t('prompts.list')}</h2>
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border-default px-4 py-6 text-sm text-foreground-muted">
            {t('prompts.empty')}
          </p>
        )}
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border-default bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{p.name}</span>
                    {p.category && (
                      <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-600">
                        {p.category}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-foreground-muted">{p.id}</span>
                  </div>
                  {p.description && (
                    <p className="mt-1 text-xs text-foreground-muted">{p.description}</p>
                  )}
                  <p className="mt-2 line-clamp-2 font-mono text-xs text-foreground-secondary">
                    {p.content}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTryPromptId(p.id)
                      setDraft(null)
                    }}
                    className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-foreground-secondary hover:bg-surface-hover"
                  >
                    {t('prompts.use')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-foreground-secondary hover:bg-surface-hover"
                  >
                    {t('prompts.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p.id)}
                    disabled={busyId === 'del:' + p.id}
                    className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="inline h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
