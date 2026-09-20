import type { ModelProviderPreset } from '../types/models'

/**
 * 模板内置供应商目录（对齐 Cherry「模型平台」列表习惯）：
 * - 列表常驻展示，未配置也可选中后填密钥
 * - 仅学布局与信息架构，不复制第三方品牌资源
 */
export const MODEL_PROVIDER_PRESETS: readonly ModelProviderPreset[] = [
  {
    id: 'deepseek',
    name: '深度求索 DeepSeek',
    type: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    description: 'DeepSeek 开放平台（OpenAI 兼容）',
    requiresApiKey: true,
    chinaReady: true,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', capabilities: { reasoning: true } },
    ],
  },
  {
    id: 'siliconflow',
    name: '硅基流动 SiliconFlow',
    type: 'openai-compatible',
    baseUrl: 'https://api.siliconflow.cn/v1',
    description: '硅基流动（多模型聚合）',
    requiresApiKey: true,
    chinaReady: true,
  },
  {
    id: 'zhipu',
    name: '智谱开放平台',
    type: 'openai-compatible',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    description: '智谱 GLM 系列',
    requiresApiKey: true,
    chinaReady: true,
    models: [{ id: 'glm-4-plus', name: 'GLM-4 Plus' }],
  },
  {
    id: 'moonshot',
    name: '月之暗面 Kimi',
    type: 'openai-compatible',
    baseUrl: 'https://api.moonshot.cn/v1',
    description: 'Moonshot / Kimi',
    requiresApiKey: true,
    chinaReady: true,
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K' },
      { id: 'kimi-latest', name: 'Kimi Latest' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama 本地',
    type: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    description: '本地离线推理，无需 API Key',
    requiresApiKey: false,
    chinaReady: true,
    models: [
      { id: 'qwen2.5:7b', name: 'Qwen2.5 7B' },
      { id: 'llama3.2', name: 'Llama 3.2' },
    ],
  },
  {
    id: 'aihubmix',
    name: 'AiHubMix',
    type: 'openai-compatible',
    baseUrl: 'https://aihubmix.com/v1',
    description: '聚合网关（OpenAI 兼容）',
    requiresApiKey: true,
    chinaReady: true,
  },
  {
    id: '302ai',
    name: '302.AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.302.ai/v1',
    description: '302.AI 聚合平台',
    requiresApiKey: true,
    chinaReady: true,
  },
  {
    id: 'dmxapi',
    name: 'DMXAPI',
    type: 'openai-compatible',
    baseUrl: 'https://www.dmxapi.cn/v1',
    description: 'DMXAPI 网关',
    requiresApiKey: true,
    chinaReady: true,
  },
  {
    id: 'ocoolai',
    name: 'ocoolAI',
    type: 'openai-compatible',
    baseUrl: 'https://api.cooluc.com/v1',
    description: 'ocoolAI 网关',
    requiresApiKey: true,
    chinaReady: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    description: 'OpenAI 官方 API',
    requiresApiKey: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', capabilities: { vision: true, functionCall: true } },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', capabilities: { vision: true } },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    description: 'Claude 系列 API',
    requiresApiKey: true,
    models: [
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    description: 'Gemini API',
    requiresApiKey: true,
  },
] as const

export function findModelProviderPreset(id: string): ModelProviderPreset | undefined {
  return MODEL_PROVIDER_PRESETS.find((p) => p.id === id)
}

/** 各类型默认 baseUrl（新建供应商时预填） */
export const MODEL_PROVIDER_DEFAULT_BASE_URL: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  'openai-compatible': 'https://api.deepseek.com/v1',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  ollama: 'http://127.0.0.1:11434',
  custom: '',
}
