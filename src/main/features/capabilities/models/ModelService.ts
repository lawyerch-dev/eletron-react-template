import fs from 'node:fs'
import { safeStorage } from 'electron'
import log from 'electron-log/main'
import type {
  ModelConfig,
  ModelProviderConfig,
  ModelProviderPreset,
  ModelRole,
  ModelRoleAssignment,
  ModelRolesMap,
  ModelTestResult,
  ModelsConfig,
  PublicModelProvider,
} from '@ert/shared/types'
import { MODEL_PROVIDER_PRESETS, findModelProviderPreset } from '@ert/shared/models/presets'
import { paths } from '../../../app/paths'

const ENC_PREFIX = 'enc:'
const PLAIN_PREFIX = 'plain:'

function encryptSecret(plain: string): string {
  if (!plain) return ''
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return ENC_PREFIX + safeStorage.encryptString(plain).toString('base64')
    }
  } catch (e) {
    log.warn('[models] safeStorage encrypt failed, fallback plain', e)
  }
  return PLAIN_PREFIX + plain
}

function decryptSecret(stored: string | undefined): string {
  if (!stored) return ''
  if (stored.startsWith(PLAIN_PREFIX)) return stored.slice(PLAIN_PREFIX.length)
  if (stored.startsWith(ENC_PREFIX)) {
    try {
      return safeStorage.decryptString(Buffer.from(stored.slice(ENC_PREFIX.length), 'base64'))
    } catch (e) {
      log.warn('[models] safeStorage decrypt failed', e)
      return ''
    }
  }
  return stored
}

function emptyConfig(): ModelsConfig {
  return { providers: [], roles: {} }
}

function normalizeProvider(raw: ModelProviderConfig): ModelProviderConfig {
  const now = Date.now()
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    baseUrl: raw.baseUrl || '',
    apiKey: raw.apiKey || '',
    apiVersion: raw.apiVersion,
    isActive: raw.isActive !== false,
    description: raw.description,
    models: Array.isArray(raw.models) ? raw.models : [],
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  }
}

function authHeaders(provider: ModelProviderConfig): Record<string, string> {
  const key = decryptSecret(provider.apiKey)
  switch (provider.type) {
    case 'anthropic':
      return {
        'x-api-key': key,
        'anthropic-version': provider.apiVersion || '2023-06-01',
        'content-type': 'application/json',
      }
    case 'gemini':
      return {
        'x-goog-api-key': key,
        'content-type': 'application/json',
      }
    case 'ollama':
      return { 'content-type': 'application/json' }
    default:
      return {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      }
  }
}

function resolveBaseUrl(provider: ModelProviderConfig): string {
  const raw = (provider.baseUrl || '').trim().replace(/\/+$/, '')
  if (provider.type === 'anthropic') {
    return raw || 'https://api.anthropic.com'
  }
  if (provider.type === 'openai') {
    return raw || 'https://api.openai.com/v1'
  }
  if (provider.type === 'ollama') {
    return raw || 'http://127.0.0.1:11434'
  }
  return raw
}

/**
 * 模型服务：供应商 CRUD + 角色映射 + 连通性测试。
 * 配置：userData/models.json；密钥经 safeStorage（不可用时 plain 前缀降级）。
 */
class ModelService {
  loadConfig(): ModelsConfig {
    const p = paths.userData('models.json')
    try {
      if (!fs.existsSync(p)) return emptyConfig()
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8')) as Partial<ModelsConfig>
      const providers = Array.isArray(raw.providers)
        ? raw.providers
            .filter((x) => x && typeof x.id === 'string' && typeof x.name === 'string')
            .map(normalizeProvider)
        : []
      const roles: ModelRolesMap = {}
      if (raw.roles && typeof raw.roles === 'object') {
        for (const [role, assignment] of Object.entries(raw.roles)) {
          if (assignment && assignment.providerId && assignment.modelId) {
            roles[role as ModelRole] = {
              role: role as ModelRole,
              providerId: assignment.providerId,
              modelId: assignment.modelId,
            }
          }
        }
      }
      return { providers, roles }
    } catch (e) {
      log.warn('[models] load config failed', e)
      return emptyConfig()
    }
  }

  saveConfig(config: ModelsConfig): ModelsConfig {
    const p = paths.userData('models.json')
    fs.mkdirSync(paths.userData(), { recursive: true })
    // 落盘时密钥已是加密/降级后的存储形态
    fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf-8')
    return config
  }

  private persist(mutator: (cfg: ModelsConfig) => ModelsConfig): ModelsConfig {
    const next = mutator(this.loadConfig())
    return this.saveConfig(next)
  }

  listProviders(): ModelProviderConfig[] {
    // 返回解密后的密钥供本地设置页编辑（仅渲染进程 IPC，不走插件公开通道）
    return this.loadConfig().providers.map((p) => ({
      ...p,
      apiKey: decryptSecret(p.apiKey),
    }))
  }

  listPublicProviders(): PublicModelProvider[] {
    return this.loadConfig()
      .providers.filter((p) => p.isActive)
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        isActive: p.isActive,
        models: p.models,
      }))
  }

  saveProvider(input: ModelProviderConfig): ModelProviderConfig {
    const now = Date.now()
    const existing = this.loadConfig().providers.find((p) => p.id === input.id)
    const stored: ModelProviderConfig = {
      ...normalizeProvider(input),
      // 若编辑时 apiKey 为空且已有旧密钥，保留旧密钥
      apiKey:
        input.apiKey && input.apiKey.length > 0
          ? encryptSecret(input.apiKey)
          : (existing?.apiKey ?? ''),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    this.persist((cfg) => {
      const idx = cfg.providers.findIndex((p) => p.id === stored.id)
      if (idx >= 0) cfg.providers[idx] = stored
      else cfg.providers.push(stored)
      return cfg
    })
    return { ...stored, apiKey: decryptSecret(stored.apiKey) }
  }

  deleteProvider(providerId: string): void {
    this.persist((cfg) => {
      cfg.providers = cfg.providers.filter((p) => p.id !== providerId)
      for (const [role, assignment] of Object.entries(cfg.roles)) {
        if (assignment?.providerId === providerId) {
          delete cfg.roles[role as ModelRole]
        }
      }
      return cfg
    })
  }

  listPresets(): ModelProviderPreset[] {
    return [...MODEL_PROVIDER_PRESETS]
  }

  addPreset(
    presetId: string,
    options?: { name?: string; apiKey?: string; baseUrl?: string },
  ): { provider: ModelProviderConfig; providers: ModelProviderConfig[] } {
    const preset = findModelProviderPreset(presetId)
    if (!preset) throw new Error('未知供应商预设: ' + presetId)
    const id = preset.id
    const provider = this.saveProvider({
      id,
      name: options?.name || preset.name,
      type: preset.type,
      baseUrl: options?.baseUrl || preset.baseUrl || '',
      apiKey: options?.apiKey || '',
      isActive: true,
      description: preset.description,
      models: (preset.models || []) as ModelConfig[],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return { provider, providers: this.listProviders() }
  }

  getRoles(): ModelRolesMap {
    return this.loadConfig().roles
  }

  setRole(role: ModelRole, providerId?: string, modelId?: string): ModelRolesMap {
    if (!providerId || !modelId) {
      return this.clearRole(role)
    }
    const cfg = this.loadConfig()
    const provider = cfg.providers.find((p) => p.id === providerId)
    if (!provider) throw new Error('供应商不存在: ' + providerId)
    const assignment: ModelRoleAssignment = { role, providerId, modelId }
    const next = this.persist((c) => {
      c.roles = { ...c.roles, [role]: assignment }
      return c
    })
    return next.roles
  }

  clearRole(role: ModelRole): ModelRolesMap {
    const next = this.persist((c) => {
      const roles = { ...c.roles }
      delete roles[role]
      c.roles = roles
      return c
    })
    return next.roles
  }

  private requireProvider(providerId: string): ModelProviderConfig {
    const p = this.loadConfig().providers.find((x) => x.id === providerId)
    if (!p) throw new Error('供应商不存在: ' + providerId)
    return p
  }

  async fetchModels(providerId: string): Promise<{ models: string[] }> {
    const provider = this.requireProvider(providerId)
    const base = resolveBaseUrl(provider)
    const headers = authHeaders(provider)
    const started = Date.now()

    if (provider.type === 'ollama') {
      const res = await fetch(`${base}/api/tags`, { headers })
      if (!res.ok) throw new Error(`Ollama /api/tags HTTP ${res.status}`)
      const data = (await res.json()) as { models?: Array<{ name?: string; model?: string }> }
      const models = (data.models || []).map((m) => m.name || m.model || '').filter(Boolean)
      log.info(`[models] ollama tags latency=${Date.now() - started}ms count=${models.length}`)
      return { models }
    }

    if (provider.type === 'anthropic') {
      // Anthropic 无公开 /models 列表；用预填模型
      return { models: provider.models.map((m) => m.id) }
    }

    if (provider.type === 'gemini') {
      const key = decryptSecret(provider.apiKey)
      const url = `${base}/models?key=${encodeURIComponent(key)}`
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`Gemini models HTTP ${res.status}`)
      const data = (await res.json()) as { models?: Array<{ name?: string }> }
      const models = (data.models || [])
        .map((m) => (m.name || '').replace(/^models\//, ''))
        .filter(Boolean)
      return { models }
    }

    // openai / openai-compatible / custom
    const res = await fetch(`${base}/models`, { headers })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`GET /models HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`)
    }
    const data = (await res.json()) as { data?: Array<{ id?: string }> }
    const models = (data.data || []).map((m) => m.id || '').filter(Boolean)
    log.info(`[models] fetch models latency=${Date.now() - started}ms count=${models.length}`)
    return { models }
  }

  async testProvider(providerId: string): Promise<ModelTestResult> {
    const started = Date.now()
    try {
      const { models } = await this.fetchModels(providerId)
      return { ok: true, latencyMs: Date.now() - started, models }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      log.warn(`[models] test failed provider=${providerId}`, message)
      return { ok: false, latencyMs: Date.now() - started, error: message }
    }
  }
}

export const modelService = new ModelService()
