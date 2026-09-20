import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
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
import { Btn, inputCls } from '@/shell/ui'

type Tab = 'providers' | 'roles'

/** 左侧平台目录项：预设常驻 + 已配置自定义 */
type PlatformItem = {
  id: string
  name: string
  type: ModelProviderType
  /** 是否已写入 models.json */
  configured: boolean
  isActive: boolean
  baseUrl: string
  apiKey: string
  models: ModelConfig[]
  requiresApiKey: boolean
  helpUrl?: string
}

const KEY_HELP_URL: Partial<Record<ModelProviderType, string>> = {
  openai: 'https://platform.openai.com/api-keys',
  'openai-compatible': 'https://platform.deepseek.com/api_keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  gemini: 'https://aistudio.google.com/apikey',
}

function Avatar({ name, type }: { name: string; type: ModelProviderType }) {
  const letter =
    (name || '?')
      .replace(/^[^\w一-鿿]+/, '')
      .charAt(0)
      .toUpperCase() || '?'
  const bg =
    type === 'ollama'
      ? 'bg-violet-500'
      : type === 'anthropic'
        ? 'bg-orange-500'
        : type === 'openai'
          ? 'bg-emerald-600'
          : type === 'gemini'
            ? 'bg-blue-500'
            : type === 'custom'
              ? 'bg-slate-500'
              : 'bg-sky-600'
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[12px] font-bold text-white ${bg}`}
    >
      {letter}
    </div>
  )
}

/**
 * 模型服务 — 布局对齐 Cherry 使用习惯（结构学习，非资源复制）：
 * 左：预设平台目录（未配置也显示）+ 已配置自定义
 * 右：标题开关 / API 密钥 / API 地址 / 模型列表
 * Tab：模型服务 · 默认模型
 */
export function ModelsPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState<Tab>('providers')
  const [providers, setProviders] = useState<ModelProviderConfig[]>([])
  const [presets, setPresets] = useState<ModelProviderPreset[]>([])
  const [roles, setRoles] = useState<ModelRolesMap>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [form, setForm] = useState<{ id: string; apiKey: string; baseUrl: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customId, setCustomId] = useState('')
  const [customType, setCustomType] = useState<ModelProviderType>('openai-compatible')
  const [customBase, setCustomBase] = useState('')
  const [customKey, setCustomKey] = useState('')
  const [modelQuery, setModelQuery] = useState('')

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

  /** 平台目录 = 全部预设（常驻）+ 未匹配预设的自定义配置 */
  const platforms: PlatformItem[] = useMemo(() => {
    const used = new Set<string>()
    const fromPresets: PlatformItem[] = presets.map((p) => {
      used.add(p.id)
      const cfg = providers.find((x) => x.id === p.id)
      return {
        id: p.id,
        name: cfg?.name || p.name,
        type: cfg?.type || p.type,
        configured: Boolean(cfg),
        isActive: cfg?.isActive ?? false,
        baseUrl: cfg?.baseUrl || p.baseUrl || '',
        apiKey: cfg?.apiKey || '',
        models: cfg?.models || (p.models as ModelConfig[]) || [],
        requiresApiKey: p.requiresApiKey,
        helpUrl: KEY_HELP_URL[cfg?.type || p.type],
      }
    })
    const customs: PlatformItem[] = providers
      .filter((p) => !used.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        configured: true,
        isActive: p.isActive,
        baseUrl: p.baseUrl || '',
        apiKey: p.apiKey || '',
        models: p.models,
        requiresApiKey: true,
        helpUrl: KEY_HELP_URL[p.type],
      }))
    return [...fromPresets, ...customs]
  }, [presets, providers])

  /** 未手选时默认选中目录第一项（派生，避免 effect setState） */
  const effectiveId = selectedId ?? platforms[0]?.id ?? null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return platforms
    return platforms.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q),
    )
  }, [platforms, search])

  const selected = platforms.find((p) => p.id === effectiveId) || null
  const apiKeyValue = form && form.id === selected?.id ? form.apiKey : selected?.apiKey || ''
  const baseUrlValue = form && form.id === selected?.id ? form.baseUrl : selected?.baseUrl || ''

  const selectPlatform = (id: string) => {
    setSelectedId(id)
    setForm(null)
    setShowKey(false)
    setModelQuery('')
    setShowCustom(false)
  }

  const persistSelected = async (patch?: Partial<ModelProviderConfig>) => {
    if (!selected) return null
    const preset = presets.find((p) => p.id === selected.id)
    const payload: ModelProviderConfig = {
      id: selected.id,
      name: selected.name,
      type: selected.type,
      baseUrl: baseUrlValue || selected.baseUrl,
      apiKey: apiKeyValue,
      isActive: patch?.isActive ?? (selected.configured ? selected.isActive : true),
      description: preset?.description,
      models: patch?.models ?? selected.models,
      createdAt: 0,
      updatedAt: 0,
      ...patch,
    }
    // 未配置的预设：先落盘再改字段
    try {
      if (!selected.configured && !patch) {
        await modelsService.addPreset(selected.id, {
          apiKey: apiKeyValue || undefined,
          baseUrl: baseUrlValue || undefined,
        })
      } else {
        await modelsService.saveProvider({
          ...payload,
          apiKey: apiKeyValue,
          baseUrl: baseUrlValue,
        })
      }
      await refresh()
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  const providerOptions = useMemo(
    () =>
      providers.flatMap((p) =>
        p.models.map((m) => ({
          value: `${p.id}::${m.id}`,
          label: `${p.name} / ${m.name || m.id}`,
        })),
      ),
    [providers],
  )

  const visibleModels = useMemo(() => {
    if (!selected) return []
    const q = modelQuery.trim().toLowerCase()
    if (!q) return selected.models
    return selected.models.filter((m) => m.id.toLowerCase().includes(q))
  }, [selected, modelQuery])

  return (
    <div className="mx-auto flex h-[calc(100vh-2.5rem)] max-w-5xl flex-col">
      {/* Tab：模型服务 / 默认模型 */}
      <div className="mb-3 flex shrink-0 items-end gap-1 border-b border-border-default">
        {[
          { id: 'providers' as Tab, label: t('models.tab.providers') },
          { id: 'roles' as Tab, label: t('models.tab.roles') },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] transition ${
              tab === id
                ? 'border-accent font-semibold text-accent'
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto pb-1.5">
          <Btn onClick={() => void refresh()} className="!py-1">
            <RefreshCw className="h-3.5 w-3.5" />
          </Btn>
        </div>
      </div>

      {tab === 'providers' ? (
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border-default bg-surface">
          {/* ── 左：模型平台目录（预设常驻）── */}
          <div className="flex w-[280px] shrink-0 flex-col border-r border-border-default bg-surface">
            <div className="shrink-0 border-b border-border-default p-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                <input
                  className={`${inputCls} pl-8 pr-8`}
                  placeholder={t('models.search_ph')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Filter className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {filtered.map((p) => {
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPlatform(p.id)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
                      p.id === effectiveId ? 'bg-surface-hover' : 'hover:bg-surface-hover/60'
                    }`}
                  >
                    <Avatar name={p.name} type={p.type} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {p.name}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        p.configured && p.isActive
                          ? 'bg-success'
                          : p.configured
                            ? 'bg-warning'
                            : 'bg-foreground-muted/25'
                      }`}
                      title={
                        p.configured && p.isActive
                          ? t('models.active')
                          : p.configured
                            ? t('models.inactive')
                            : t('models.not_configured')
                      }
                    />
                  </button>
                )
              })}
            </div>

            <div className="shrink-0 space-y-2 border-t border-border-default p-2">
              {showCustom ? (
                <div className="space-y-1.5 rounded-lg border border-border-default bg-surface-2/60 p-2">
                  <input
                    className={inputCls}
                    placeholder={t('models.field_name')}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder={t('models.field_id')}
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                  />
                  <select
                    className={inputCls}
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as ModelProviderType)}
                  >
                    {(
                      [
                        'openai-compatible',
                        'openai',
                        'anthropic',
                        'ollama',
                        'gemini',
                        'custom',
                      ] as ModelProviderType[]
                    ).map((ty) => (
                      <option key={ty} value={ty}>
                        {ty}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputCls}
                    placeholder="Base URL"
                    value={customBase}
                    onChange={(e) => setCustomBase(e.target.value)}
                  />
                  <input
                    className={inputCls}
                    type="password"
                    placeholder={t('models.api_key_ph')}
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <Btn
                      variant="primary"
                      className="flex-1 !py-1"
                      onClick={() => {
                        if (!customId.trim() || !customName.trim()) {
                          toast.error(t('models.err_id_name'))
                          return
                        }
                        void modelsService
                          .saveProvider({
                            id: customId.trim(),
                            name: customName.trim(),
                            type: customType,
                            baseUrl: customBase.trim(),
                            apiKey: customKey,
                            isActive: true,
                            models: [],
                            createdAt: 0,
                            updatedAt: 0,
                          })
                          .then(async () => {
                            toast.success(t('models.saved'))
                            setShowCustom(false)
                            setCustomName('')
                            setCustomId('')
                            setCustomKey('')
                            setCustomBase('')
                            await refresh()
                            setSelectedId(customId.trim())
                          })
                          .catch((e) => toast.error((e as Error).message))
                      }}
                    >
                      {t('models.save')}
                    </Btn>
                    <Btn onClick={() => setShowCustom(false)}>×</Btn>
                  </div>
                </div>
              ) : (
                <Btn className="w-full justify-center" onClick={() => setShowCustom(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  {t('models.add_provider')}
                </Btn>
              )}
            </div>
          </div>

          {/* ── 右：平台配置 ── */}
          <div className="flex min-w-0 flex-1 flex-col">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
                {t('models.empty')}
              </div>
            ) : (
              <>
                {/* 标题：名称 + 齿轮 + 启用开关 */}
                <div className="flex shrink-0 items-center gap-2 border-b border-border-default px-5 py-3.5">
                  <h1 className="text-[16px] font-semibold text-foreground">{selected.name}</h1>
                  <span className="text-foreground-muted">
                    <Settings className="h-4 w-4" />
                  </span>
                  {!selected.configured && (
                    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-foreground-muted">
                      {t('models.not_configured')}
                    </span>
                  )}
                  <div className="ml-auto">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={selected.configured && selected.isActive}
                      onClick={() => {
                        void persistSelected({
                          isActive: !(selected.configured && selected.isActive),
                        })
                      }}
                      className={`relative h-6 w-11 rounded-full transition ${
                        selected.configured && selected.isActive
                          ? 'bg-success'
                          : 'bg-foreground-muted/30'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          selected.configured && selected.isActive ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6">
                  {/* API 密钥 */}
                  <section>
                    <div className="mb-2 flex items-baseline gap-3">
                      <h2 className="text-[14px] font-semibold text-foreground">
                        {t('models.api_key')}
                      </h2>
                      {(selected.helpUrl || KEY_HELP_URL[selected.type]) && (
                        <a
                          href={selected.helpUrl || KEY_HELP_URL[selected.type]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[13px] text-accent hover:underline"
                        >
                          {t('models.get_key')}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          className={`${inputCls} py-2.5 pr-10 font-mono`}
                          type={showKey ? 'text' : 'password'}
                          value={apiKeyValue}
                          placeholder={t('models.api_key_ph')}
                          onChange={(e) =>
                            setForm({
                              id: selected.id,
                              apiKey: e.target.value,
                              baseUrl: baseUrlValue,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                          onClick={() => setShowKey((v) => !v)}
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-default text-foreground-secondary hover:bg-surface-hover"
                        title={t('models.api_key')}
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <Btn
                        className="h-10 px-4"
                        variant="primary"
                        disabled={testing}
                        onClick={() => {
                          setTesting(true)
                          void persistSelected()
                            .then(() => modelsService.testProvider(selected.id))
                            .then(async (result) => {
                              if (!result?.ok && result !== null) {
                                // testProvider returns result object
                              }
                              if (result && 'ok' in result && !result.ok) {
                                toast.error(result.error || t('models.test_fail'))
                                return
                              }
                              if (result && 'ok' in result && result.ok) {
                                toast.success(
                                  t('models.test_ok').replace(
                                    '{ms}',
                                    String(result.latencyMs ?? 0),
                                  ),
                                )
                                if (result.models?.length) {
                                  const cur = providers.find((x) => x.id === selected.id)
                                  const base = cur?.models || selected.models
                                  const known = new Set(base.map((m) => m.id))
                                  const merged = [...base]
                                  for (const mid of result.models) {
                                    if (!known.has(mid)) merged.push({ id: mid, name: mid })
                                  }
                                  if (merged.length !== base.length) {
                                    await modelsService.saveProvider({
                                      id: selected.id,
                                      name: selected.name,
                                      type: selected.type,
                                      baseUrl: baseUrlValue || selected.baseUrl,
                                      apiKey: apiKeyValue,
                                      isActive: true,
                                      models: merged,
                                      createdAt: 0,
                                      updatedAt: 0,
                                    })
                                    await refresh()
                                  }
                                }
                              }
                            })
                            .catch((e) => toast.error((e as Error).message))
                            .finally(() => setTesting(false))
                        }}
                      >
                        {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {t('models.test')}
                      </Btn>
                    </div>
                  </section>

                  {/* API 地址 */}
                  <section>
                    <div className="mb-2 flex items-baseline gap-3">
                      <h2 className="text-[14px] font-semibold text-foreground">
                        {t('models.api_base')}
                      </h2>
                      <span className="text-[13px] text-accent">{t('models.add_endpoint')}</span>
                    </div>
                    <input
                      className={`${inputCls} py-2.5 font-mono`}
                      value={baseUrlValue}
                      placeholder="https://api.example.com/v1"
                      onChange={(e) =>
                        setForm({
                          id: selected.id,
                          apiKey: apiKeyValue,
                          baseUrl: e.target.value,
                        })
                      }
                      onBlur={() => {
                        if (baseUrlValue !== selected.baseUrl || apiKeyValue !== selected.apiKey) {
                          void persistSelected()
                        }
                      }}
                    />
                  </section>

                  {/* 模型 */}
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <h2 className="text-[14px] font-semibold text-foreground">
                        {t('models.models_section')}
                      </h2>
                      <div className="relative ml-2 w-44">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                        <input
                          className={`${inputCls} !py-1.5 pl-8 !text-[12px]`}
                          placeholder={t('models.filter_models')}
                          value={modelQuery}
                          onChange={(e) => setModelQuery(e.target.value)}
                        />
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <Btn
                          disabled={syncing}
                          onClick={() => {
                            setSyncing(true)
                            void persistSelected()
                              .then(() => modelsService.fetchModels(selected.id))
                              .then(async (res) => {
                                if (!res) return
                                const { models } = res
                                const cur = providers.find((x) => x.id === selected.id)
                                const base = cur?.models || selected.models
                                const known = new Set(base.map((m) => m.id))
                                const merged = [...base]
                                for (const mid of models) {
                                  if (!known.has(mid)) merged.push({ id: mid, name: mid })
                                }
                                await modelsService.saveProvider({
                                  id: selected.id,
                                  name: selected.name,
                                  type: selected.type,
                                  baseUrl: baseUrlValue || selected.baseUrl,
                                  apiKey: apiKeyValue,
                                  isActive: true,
                                  models: merged,
                                  createdAt: 0,
                                  updatedAt: 0,
                                })
                                toast.success(
                                  t('models.sync_ok').replace('{n}', String(models.length)),
                                )
                                await refresh()
                              })
                              .catch((e) => toast.error((e as Error).message))
                              .finally(() => setSyncing(false))
                          }}
                        >
                          {syncing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          {t('models.sync_models')}
                        </Btn>
                        <Btn
                          onClick={() => {
                            const id = window.prompt(t('models.add_model_ph'))
                            if (!id?.trim()) return
                            const next = [...selected.models, { id: id.trim(), name: id.trim() }]
                            void persistSelected({ models: next })
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Btn>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border-default">
                      {visibleModels.length === 0 ? (
                        <div className="px-4 py-8 text-center text-[13px] text-foreground-muted">
                          {selected.configured
                            ? t('models.no_models')
                            : t('models.no_models_unconfigured')}
                        </div>
                      ) : (
                        visibleModels.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-3 border-b border-border-default px-4 py-3 last:border-b-0"
                          >
                            <Avatar name={m.id} type={selected.type} />
                            <div className="min-w-0 flex-1 font-mono text-[13px] text-foreground">
                              {m.id}
                            </div>
                            <Btn
                              variant="ghost"
                              className="!px-2"
                              title="remove"
                              onClick={() => {
                                void persistSelected({
                                  models: selected.models.filter((x) => x.id !== m.id),
                                })
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Btn>
                          </div>
                        ))
                      )}
                    </div>

                    {selected.configured && (
                      <div className="mt-3">
                        <Btn
                          variant="danger"
                          onClick={() => {
                            void modelsService
                              .deleteProvider(selected.id)
                              .then(async () => {
                                toast.success(t('models.deleted'))
                                setSelectedId(null)
                                await refresh()
                              })
                              .catch((e) => toast.error((e as Error).message))
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('models.delete')}
                        </Btn>
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border-default bg-surface">
          <div className="border-b border-border-default px-5 py-3.5">
            <h1 className="text-[15px] font-semibold text-foreground">{t('models.roles')}</h1>
            <p className="mt-0.5 text-[12px] text-foreground-muted">{t('models.roles_hint')}</p>
          </div>
          {MODEL_ROLES.map((role) => {
            const a = roles[role]
            return (
              <div
                key={role}
                className="flex items-center justify-between gap-3 border-b border-border-default px-5 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">
                    {t(`models.role.${role}`)}
                  </div>
                  <div className="font-mono text-[11px] text-foreground-muted">{role}</div>
                </div>
                <div className="flex w-[320px] shrink-0 items-center gap-2">
                  <select
                    className={inputCls}
                    value={a ? `${a.providerId}::${a.modelId}` : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value) {
                        void modelsService
                          .clearRole(role)
                          .then(setRoles)
                          .catch((err) => toast.error((err as Error).message))
                        return
                      }
                      const [providerId, modelId] = value.split('::')
                      void modelsService
                        .setRole(role as ModelRole, providerId, modelId)
                        .then(setRoles)
                        .catch((err) => toast.error((err as Error).message))
                    }}
                  >
                    <option value="">{t('models.role_unset')}</option>
                    {providerOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {a && <Check className="h-4 w-4 shrink-0 text-success" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
