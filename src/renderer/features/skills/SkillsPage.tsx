import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { skillsService } from '@/services'
import type { SkillPack } from '@ert/shared/types'

const emptyDraft = (): SkillPack => ({
  id: '',
  name: '',
  description: '',
  systemPrompt: '',
  mcpTools: [],
  category: '',
  isActive: true,
  createdAt: 0,
  updatedAt: 0,
})

export function SkillsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<SkillPack[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SkillPack | null>(null)
  const [toolsText, setToolsText] = useState('')

  const refresh = useCallback(async () => {
    try {
      setItems(await skillsService.list())
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
    setToolsText('')
  }

  const openEdit = (s: SkillPack) => {
    setDraft({ ...s, mcpTools: [...(s.mcpTools || [])] })
    setToolsText((s.mcpTools || []).join('\n'))
  }

  const saveDraft = async () => {
    if (!draft) return
    if (!draft.id.trim() || !draft.name.trim()) {
      toast.error(t('skills.err_id_name'))
      return
    }
    setBusyId('draft')
    try {
      await skillsService.save({
        ...draft,
        id: draft.id.trim(),
        name: draft.name.trim(),
        mcpTools: toolsText
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
      })
      toast.success(t('skills.saved'))
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
      await skillsService.delete(id)
      toast.success(t('skills.deleted'))
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('skills.title')}</h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('skills.subtitle')}</p>
          <p className="mt-1 text-xs text-foreground-muted">{t('skills.config_hint')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
          >
            <RefreshCw className="mr-1 inline h-4 w-4" />
            {t('skills.refresh')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            {t('skills.add')}
          </button>
        </div>
      </header>

      {draft && (
        <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              {draft.createdAt ? t('skills.edit') : t('skills.add')}
            </div>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg p-1 text-foreground-muted hover:bg-surface-hover"
              aria-label={t('skills.cancel')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('skills.field_id')}</span>
              <input
                value={draft.id}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                disabled={Boolean(draft.createdAt)}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('skills.field_name')}</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('skills.field_category')}</span>
              <input
                value={draft.category || ''}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('skills.field_desc')}</span>
              <input
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-foreground-secondary">{t('skills.field_system')}</span>
              <textarea
                value={draft.systemPrompt}
                onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
                rows={5}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-foreground-secondary">{t('skills.field_tools')}</span>
              <textarea
                value={toolsText}
                onChange={(e) => setToolsText(e.target.value)}
                rows={3}
                placeholder="mcp__memory__create_entities"
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
              {t('skills.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={busyId === 'draft'}
              className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busyId === 'draft' && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
              {t('skills.save')}
            </button>
          </div>
        </section>
      )}

      <section className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border-default px-4 py-6 text-sm text-foreground-muted">
            {t('skills.empty')}
          </p>
        )}
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border-default bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{s.name}</span>
                    {s.category && (
                      <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-600">
                        {s.category}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        s.isActive
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-zinc-500/15 text-zinc-500'
                      }`}
                    >
                      {s.isActive ? t('skills.active') : t('skills.inactive')}
                    </span>
                  </div>
                  {s.description && (
                    <p className="mt-1 text-xs text-foreground-muted">{s.description}</p>
                  )}
                  {s.mcpTools?.length ? (
                    <p className="mt-1 font-mono text-[11px] text-foreground-muted">
                      {s.mcpTools.join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-foreground-secondary hover:bg-surface-hover"
                  >
                    {t('skills.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(s.id)}
                    disabled={busyId === 'del:' + s.id}
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
