import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Cpu, Loader2, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { modelsService } from '@/services'
import type {
  ModelConfig,
  ModelProviderConfig,
  ModelProviderPreset,
  ModelProviderType,
  ModelRole,
  ModelRolesMap,
} from '@ert/shared/types'
import { MODEL_ROLES } from '@ert/shared/types'

const PROVIDER_TYPES: ModelProviderType[] = [
  'openai-compatible',
  'openai',
  'anthropic',
  'ollama',
  'gemini',
  'custom',
]

const emptyProviderDraft = (): ModelProviderConfig => ({
  id: '',
  name: '',
  type: 'openai-compatible',
  baseUrl: '',
  apiKey: '',
  isActive: true,
  models: [],
  createdAt: 0,
  updatedAt: 0,
})

export function ModelsPage() {
  const { t } = useLanguage()
  const [providers, setProviders] = useState<ModelProviderConfig[]>([])
  const [presets, setPresets] = useState<ModelProviderPreset[]>([])
  const [roles, setRoles] = useState<ModelRolesMap>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ModelProviderConfig | null>(null)
  const [draftModelsText, setDraftModelsText] = useState('')
  const [presetKeys, setPresetKeys] = useState<Record<string, string>>({})

  const refresh = useCallback(async () => {
    try {
      const [list, presetList, roleMap] = await Promise.all([
        modelsService.listProviders(),
        modelsService.listPresets(),
        modelsService.listRoles(),
      ])
      setProviders(list)
      setPresets(presetList)
      setRoles(roleMap)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const providerOptions = useMemo(
    () =>
      providers.flatMap((p) =>
        p.models.map((m) => ({
          value: `${p.id}::${m.id}`,
          label: `${p.name} · ${m.name || m.id}`,
          providerId: p.id,
          modelId: m.id,
        })),
      ),
    [providers],
  )

  const openCreate = () => {
    setDraft(emptyProviderDraft())
    setDraftModelsText('')
  }

  const openEdit = (p: ModelProviderConfig) => {
    setDraft({ ...p, models: [...p.models] })
    setDraftModelsText(p.models.map((m) => m.id).join('\n'))
  }

  const parseModelsText = (text: string): ModelConfig[] =>
    text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((id) => ({ id, name: id }))

  const saveDraft = async () => {
    if (!draft) return
    if (!draft.id.trim() || !draft.name.trim()) {
      toast.error(t('models.err_id_name'))
      return
    }
    setBusyId('draft')
    try {
      await modelsService.saveProvider({
        ...draft,
        id: draft.id.trim(),
        name: draft.name.trim(),
        models: parseModelsText(draftModelsText),
      })
      toast.success(t('models.saved'))
      setDraft(null)
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const removeProvider = async (id: string) => {
    setBusyId('del:' + id)
    try {
      await modelsService.deleteProvider(id)
      toast.success(t('models.deleted'))
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const testProvider = async (id: string) => {
    setTestingId(id)
    try {
      const result = await modelsService.testProvider(id)
      if (result.ok) {
        toast.success(
          t('models.test_ok').replace('{ms}', String(result.latencyMs ?? 0)) +
            (result.models?.length ? ` · ${result.models.length}` : ''),
        )
        if (result.models?.length) {
          // 测试成功且拉到列表时，把新模型并入该供应商
          const target = providers.find((p) => p.id === id)
          if (target) {
            const known = new Set(target.models.map((m) => m.id))
            const merged = [...target.models]
            for (const mid of result.models) {
              if (!known.has(mid)) merged.push({ id: mid, name: mid })
            }
            if (merged.length !== target.models.length) {
              await modelsService.saveProvider({ ...target, models: merged })
              await refresh()
            }
          }
        }
      } else {
        toast.error(result.error || t('models.test_fail'))
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setTestingId(null)
    }
  }

  const addPreset = async (presetId: string) => {
    setBusyId('preset:' + presetId)
    try {
      await modelsService.addPreset(presetId, { apiKey: presetKeys[presetId] || undefined })
      toast.success(t('models.preset_added'))
      setPresetKeys((prev) => ({ ...prev, [presetId]: '' }))
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const assignRole = async (role: ModelRole, value: string) => {
    setBusyId('role:' + role)
    try {
      if (!value) {
        setRoles(await modelsService.clearRole(role))
        return
      }
      const [providerId, modelId] = value.split('::')
      setRoles(await modelsService.setRole(role, providerId, modelId))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const roleValue = (role: ModelRole) => {
    const a = roles[role]
    return a ? `${a.providerId}::${a.modelId}` : ''
  }

  const addedPresetIds = new Set(providers.map((p) => p.id))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Cpu className="h-6 w-6 text-accent" />
            {t('models.title')}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('models.subtitle')}</p>
          <p className="mt-1 text-xs text-foreground-muted">{t('models.config_hint')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
          >
            <RefreshCw className="mr-1 inline h-4 w-4" />
            {t('models.refresh')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            {t('models.add_provider')}
          </button>
        </div>
      </header>

      {/* 编辑 / 新建 */}
      {draft && (
        <section className="space-y-3 rounded-2xl border border-border-default bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              {draft.createdAt ? t('models.edit_provider') : t('models.add_provider')}
            </div>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg p-1 text-foreground-muted hover:bg-surface-hover"
              aria-label={t('models.cancel')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('models.field_id')}</span>
              <input
                value={draft.id}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                disabled={Boolean(draft.createdAt)}
                placeholder="deepseek"
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('models.field_name')}</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="DeepSeek"
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('models.field_type')}</span>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as ModelProviderType })}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              >
                {PROVIDER_TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {ty}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-foreground-secondary">{t('models.field_base_url')}</span>
              <input
                value={draft.baseUrl || ''}
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-foreground-secondary">{t('models.field_api_key')}</span>
              <input
                type="password"
                value={draft.apiKey || ''}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder={t('models.api_key_ph')}
                className="w-full rounded-xl border border-border-default bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-foreground-secondary">{t('models.field_models')}</span>
              <textarea
                value={draftModelsText}
                onChange={(e) => setDraftModelsText(e.target.value)}
                rows={3}
                placeholder={'gpt-4o\ngpt-4o-mini'}
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
              {t('models.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={busyId === 'draft'}
              className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busyId === 'draft' && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
              {t('models.save')}
            </button>
          </div>
        </section>
      )}

      {/* 供应商列表 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">{t('models.providers')}</h2>
        {providers.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border-default px-4 py-6 text-sm text-foreground-muted">
            {t('models.empty')}
          </p>
        )}
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border-default bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-600">
                      {p.type}
                    </span>
                    {p.isActive ? (
                      <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-600">
                        {t('models.active')}
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-500/15 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        {t('models.inactive')}
                      </span>
                    )}
                    {p.apiKey ? (
                      <span className="text-[10px] text-foreground-muted">
                        {t('models.key_set')}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-foreground-muted">
                    {p.baseUrl || t('models.no_base_url')} · {p.models.length}{' '}
                    {t('models.models_unit')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void testProvider(p.id)}
                    disabled={testingId === p.id}
                    className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-foreground-secondary hover:bg-surface-hover disabled:opacity-50"
                  >
                    {testingId === p.id && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
                    {t('models.test')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-foreground-secondary hover:bg-surface-hover"
                  >
                    {t('models.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeProvider(p.id)}
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

      {/* 默认角色 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">{t('models.roles')}</h2>
        <p className="text-xs text-foreground-muted">{t('models.roles_hint')}</p>
        <div className="space-y-2 rounded-2xl border border-border-default bg-surface p-4">
          {MODEL_ROLES.map((role) => (
            <div
              key={role}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default py-2 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="text-sm text-foreground">{t(`models.role.${role}`)}</div>
                <div className="text-[11px] text-foreground-muted">{role}</div>
              </div>
              <div className="flex min-w-[220px] items-center gap-1.5">
                <select
                  value={roleValue(role)}
                  onChange={(e) => void assignRole(role, e.target.value)}
                  disabled={busyId === 'role:' + role || providerOptions.length === 0}
                  className="w-full rounded-xl border border-border-default bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent disabled:opacity-50"
                >
                  <option value="">{t('models.role_unset')}</option>
                  {providerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {roles[role] && <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 预设 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">{t('models.presets')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((p) => {
            const added = addedPresetIds.has(p.id)
            return (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-xl border border-border-default px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      {p.chinaReady && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600">
                          {t('models.china_ready')}
                        </span>
                      )}
                      {p.requiresApiKey ? (
                        <span className="text-[10px] text-foreground-muted">
                          {t('models.need_key')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600">{t('models.ready')}</span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">
                      {p.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void addPreset(p.id)}
                    disabled={added || busyId === 'preset:' + p.id}
                    className="shrink-0 rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-foreground-secondary hover:bg-surface-hover disabled:opacity-40"
                  >
                    {added ? t('models.added') : t('models.add')}
                  </button>
                </div>
                {p.requiresApiKey && !added && (
                  <input
                    type="password"
                    value={presetKeys[p.id] || ''}
                    onChange={(e) => setPresetKeys((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder={t('models.api_key_ph')}
                    className="rounded-lg border border-border-default bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
