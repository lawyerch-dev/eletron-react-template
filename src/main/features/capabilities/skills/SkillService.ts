import fs from 'node:fs'
import log from 'electron-log/main'
import type { SkillPack } from '@ert/shared/types'
import { paths } from '../../../app/paths'

/** 技能包：userData/skills.json 顶层数组 */
class SkillService {
  list(): SkillPack[] {
    const p = paths.userData('skills.json')
    try {
      if (!fs.existsSync(p)) return []
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
      const list = Array.isArray(raw) ? raw : (raw?.skills ?? [])
      return (list as SkillPack[]).filter((x) => x && typeof x.id === 'string')
    } catch (e) {
      log.warn('[skills] load failed', e)
      return []
    }
  }

  private saveAll(list: SkillPack[]): SkillPack[] {
    const p = paths.userData('skills.json')
    fs.mkdirSync(paths.userData(), { recursive: true })
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8')
    return list
  }

  get(id: string): SkillPack | null {
    return this.list().find((x) => x.id === id) ?? null
  }

  save(input: SkillPack): SkillPack {
    if (!input.id?.trim()) throw new Error('技能 ID 不能为空')
    if (!input.name?.trim()) throw new Error('技能名称不能为空')
    const now = Date.now()
    const existing = this.list().find((x) => x.id === input.id)
    const next: SkillPack = {
      id: input.id.trim(),
      name: input.name.trim(),
      description: input.description,
      systemPrompt: input.systemPrompt ?? '',
      mcpTools: input.mcpTools ?? [],
      category: input.category,
      isActive: input.isActive !== false,
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

export const skillService = new SkillService()
