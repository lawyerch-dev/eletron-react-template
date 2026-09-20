import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Play, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { llmService, promptsService } from '@/services'
import type { PromptTemplate } from '@ert/shared/types'
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

const emptyDraft = (): PromptTemplate => ({
  id: '',
  name: '',
  content: '',
  description: '',
  category: '',
  createdAt: 0,
  updatedAt: 0,
})

/** 提示词：搜索 + 卡片网格 + 侧边试跑 */
export function PromptsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<PromptTemplate[]>([])
  const [search, setSearch] = useState('')
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q),
    )
  }, [items, search])

  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category || '').filter(Boolean))
    return [...set] as string[]
  }, [items])

  return (
    <PageShell
      title={t('prompts.title')}
      description={t('prompts.subtitle')}
      hint={t('prompts.config_hint')}
      width="max-w-4xl"
      actions={
        <>
          <Btn onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Btn>
          <Btn variant="primary" onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-3.5 w-3.5" />
            {t('prompts.add')}
          </Btn>
        </>
      }
    >
      {/* 搜索栏 */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          className={`${inputCls} py-2 pl-9`}
          placeholder={t('prompts.search_ph')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <Badge key={c} tone="accent">
              {c}
            </Badge>
          ))}
        </div>
      )}

      {draft && (
        <SectionCard title={draft.createdAt ? t('prompts.edit') : t('prompts.add')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('prompts.field_id')}>
              <input
                className={inputCls}
                value={draft.id}
                disabled={Boolean(draft.createdAt)}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              />
            </Field>
            <Field label={t('prompts.field_name')}>
              <input
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label={t('prompts.field_category')}>
              <input
                className={inputCls}
                value={draft.category || ''}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            </Field>
            <Field label={t('prompts.field_desc')}>
              <input
                className={inputCls}
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field label={t('prompts.field_content')} className="sm:col-span-2">
              <textarea
                className={textareaCls}
                rows={5}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Btn onClick={() => setDraft(null)}>{t('prompts.cancel')}</Btn>
            <Btn
              variant="primary"
              disabled={busyId === 'draft'}
              onClick={() => {
                if (!draft.id.trim() || !draft.name.trim()) {
                  toast.error(t('prompts.err_id_name'))
                  return
                }
                setBusyId('draft')
                void promptsService
                  .save({ ...draft, id: draft.id.trim(), name: draft.name.trim() })
                  .then(() => {
                    toast.success(t('prompts.saved'))
                    setDraft(null)
                    return refresh()
                  })
                  .catch((e) => toast.error((e as Error).message))
                  .finally(() => setBusyId(null))
              }}
            >
              {busyId === 'draft' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('prompts.save')}
            </Btn>
          </div>
        </SectionCard>
      )}

      {/* 卡片网格 */}
      {filtered.length === 0 ? (
        <EmptyState title={t('prompts.empty')} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-xl border border-border-default bg-surface p-3 transition hover:border-accent/40"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">{p.name}</div>
                  <div className="font-mono text-[10px] text-foreground-muted">{p.id}</div>
                </div>
                {p.category && <Badge tone="accent">{p.category}</Badge>}
              </div>
              {p.description && (
                <p className="mb-1.5 text-[11px] text-foreground-muted">{p.description}</p>
              )}
              <p className="mb-3 line-clamp-3 flex-1 font-mono text-[11px] leading-relaxed text-foreground-secondary">
                {p.content}
              </p>
              <div className="flex items-center gap-1">
                <Btn
                  onClick={() => {
                    setTryPromptId(p.id)
                  }}
                >
                  <Play className="h-3 w-3" />
                  {t('prompts.use')}
                </Btn>
                <Btn onClick={() => setDraft({ ...p })}>{t('prompts.edit')}</Btn>
                <Btn
                  variant="danger"
                  onClick={() => {
                    setBusyId('del:' + p.id)
                    void promptsService
                      .delete(p.id)
                      .then(() => {
                        toast.success(t('prompts.deleted'))
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

      {/* 试跑台 */}
      <SectionCard title={t('prompts.try')} description={t('prompts.try_hint')}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className={inputCls}
            value={tryPromptId}
            onChange={(e) => setTryPromptId(e.target.value)}
          >
            <option value="">{t('prompts.pick_template')}</option>
            {items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className={`${inputCls} flex-1`}
            value={tryInput}
            placeholder={t('prompts.try_input_ph')}
            onChange={(e) => setTryInput(e.target.value)}
          />
          <Btn
            variant="primary"
            disabled={trying || !tryPromptId}
            onClick={() => {
              const template = items.find((x) => x.id === tryPromptId)
              if (!template || !tryInput.trim()) {
                toast.error(t('prompts.need_input'))
                return
              }
              setTrying(true)
              setTryResult('')
              void llmService
                .complete({
                  role: 'default-assistant',
                  messages: [
                    { role: 'system', content: template.content },
                    { role: 'user', content: tryInput },
                  ],
                })
                .then((result) => {
                  if (!result.ok) {
                    setTryResult(result.error || t('prompts.try_fail'))
                    toast.error(result.error || t('prompts.try_fail'))
                    return
                  }
                  setTryResult(result.content || '')
                  toast.success(t('prompts.try_ok').replace('{ms}', String(result.latencyMs ?? 0)))
                })
                .catch((e) => toast.error((e as Error).message))
                .finally(() => setTrying(false))
            }}
          >
            {trying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {t('prompts.run')}
          </Btn>
        </div>
        {tryResult && (
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-surface-2 p-2.5 text-[12px] text-foreground">
            {tryResult}
          </pre>
        )}
      </SectionCard>
    </PageShell>
  )
}
