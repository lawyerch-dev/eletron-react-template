import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { skillsService } from '@/services'
import type { SkillPack } from '@ert/shared/types'
import {
  Badge,
  Btn,
  EmptyState,
  Field,
  PageShell,
  SectionCard,
  inputCls,
  textareaCls,
} from '@/shell/ui'

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

/** 技能：搜索 + 卡片墙 */
export function SkillsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<SkillPack[]>([])
  const [search, setSearch] = useState('')
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

  const filtered = items.filter((s) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    )
  })

  return (
    <PageShell
      title={t('skills.title')}
      description={t('skills.subtitle')}
      hint={t('skills.config_hint')}
      width="max-w-4xl"
      actions={
        <>
          <Btn onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Btn>
          <Btn
            variant="primary"
            onClick={() => {
              setDraft(emptyDraft())
              setToolsText('')
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('skills.add')}
          </Btn>
        </>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          className={`${inputCls} py-2 pl-9`}
          placeholder={t('skills.search_ph')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {draft && (
        <SectionCard title={draft.createdAt ? t('skills.edit') : t('skills.add')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('skills.field_id')}>
              <input
                className={inputCls}
                value={draft.id}
                disabled={Boolean(draft.createdAt)}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              />
            </Field>
            <Field label={t('skills.field_name')}>
              <input
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label={t('skills.field_category')}>
              <input
                className={inputCls}
                value={draft.category || ''}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            </Field>
            <Field label={t('skills.field_desc')}>
              <input
                className={inputCls}
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field label={t('skills.field_system')} className="sm:col-span-2">
              <textarea
                className={textareaCls}
                rows={5}
                value={draft.systemPrompt}
                onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
              />
            </Field>
            <Field label={t('skills.field_tools')} className="sm:col-span-2">
              <textarea
                className={textareaCls}
                rows={2}
                value={toolsText}
                onChange={(e) => setToolsText(e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Btn onClick={() => setDraft(null)}>{t('skills.cancel')}</Btn>
            <Btn
              variant="primary"
              disabled={busyId === 'draft'}
              onClick={() => {
                if (!draft.id.trim() || !draft.name.trim()) {
                  toast.error(t('skills.err_id_name'))
                  return
                }
                setBusyId('draft')
                void skillsService
                  .save({
                    ...draft,
                    id: draft.id.trim(),
                    name: draft.name.trim(),
                    mcpTools: toolsText
                      .split(/[\n,]/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                  .then(() => {
                    toast.success(t('skills.saved'))
                    setDraft(null)
                    return refresh()
                  })
                  .catch((e) => toast.error((e as Error).message))
                  .finally(() => setBusyId(null))
              }}
            >
              {busyId === 'draft' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('skills.save')}
            </Btn>
          </div>
        </SectionCard>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={t('skills.empty')} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="flex flex-col rounded-xl border border-border-default bg-surface p-3 transition hover:border-accent/40"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">{s.name}</div>
                  <div className="font-mono text-[10px] text-foreground-muted">{s.id}</div>
                </div>
                <Badge tone={s.isActive ? 'success' : 'neutral'}>
                  {s.isActive ? t('skills.active') : t('skills.inactive')}
                </Badge>
              </div>
              {s.category && (
                <div className="mb-1">
                  <Badge tone="accent">{s.category}</Badge>
                </div>
              )}
              {s.description && (
                <p className="mb-1.5 text-[11px] text-foreground-muted">{s.description}</p>
              )}
              <p className="mb-2 line-clamp-3 flex-1 font-mono text-[11px] leading-relaxed text-foreground-secondary">
                {s.systemPrompt}
              </p>
              {s.mcpTools?.length ? (
                <div className="mb-2 flex flex-wrap gap-1">
                  {s.mcpTools.slice(0, 3).map((tool) => (
                    <span
                      key={tool}
                      className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted"
                    >
                      {tool}
                    </span>
                  ))}
                  {s.mcpTools.length > 3 && (
                    <span className="text-[10px] text-foreground-muted">
                      +{s.mcpTools.length - 3}
                    </span>
                  )}
                </div>
              ) : null}
              <div className="flex items-center gap-1">
                <Btn
                  onClick={() => {
                    setDraft({ ...s, mcpTools: [...(s.mcpTools || [])] })
                    setToolsText((s.mcpTools || []).join('\n'))
                  }}
                >
                  {t('skills.edit')}
                </Btn>
                <Btn
                  variant="danger"
                  onClick={() => {
                    setBusyId('del:' + s.id)
                    void skillsService
                      .delete(s.id)
                      .then(() => {
                        toast.success(t('skills.deleted'))
                        return refresh()
                      })
                      .catch((e) => toast.error((e as Error).message))
                      .finally(() => setBusyId(null))
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
