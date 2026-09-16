import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

export type Language = 'zh-CN' | 'en-US'

export const translations: Record<Language, Record<string, string>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
]
