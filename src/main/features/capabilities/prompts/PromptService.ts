import fs from 'node:fs'
import log from 'electron-log/main'
import type { PromptTemplate } from '@ert/shared/types'
import { paths } from '../../../app/paths'

function emptyList(): PromptTemplate[] {
  return []
}

/**
 * 提示词库：userData/prompts.json 顶层数组。
 */
class PromptService {
  list(): PromptTemplate[] {
    const p = paths.userData('prompts.json')
    try {
      if (!fs.existsSync(p)) return emptyList()
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
      const list = Array.isArray(raw) ? raw : (raw?.prompts ?? [])
      return (list as PromptTemplate[]).filter(
        (x) => x && typeof x.id === 'string' && typeof x.name === 'string',
      )
    } catch (e) {
      log.warn('[prompts] load failed', e)
      return emptyList()
    }
  }

  private saveAll(list: PromptTemplate[]): PromptTemplate[] {
    const p = paths.userData('prompts.json')
    fs.mkdirSync(paths.userData(), { recursive: true })
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8')
    return list
  }

  get(id: string): PromptTemplate | null {
    return this.list().find((x) => x.id === id) ?? null
  }

  save(input: PromptTemplate): PromptTemplate {
    if (!input.id?.trim()) throw new Error('提示词 ID 不能为空')
    if (!input.name?.trim()) throw new Error('提示词名称不能为空')
    const now = Date.now()
    const existing = this.list().find((x) => x.id === input.id)
    const next: PromptTemplate = {
      id: input.id.trim(),
      name: input.name.trim(),
      content: input.content ?? '',
      description: input.description,
      category: input.category,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    const list = this.list()
    const idx = list.findIndex((x) => x.id === next.id)
    if (idx >= 0) list[idx] = next
    else list.push(next)
    this.saveAll(list)
    return next
  }

  delete(id: string): void {
    this.saveAll(this.list().filter((x) => x.id !== id))
  }
}

export const promptService = new PromptService()
