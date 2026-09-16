import Store from 'electron-store'

interface StoredDoc {
  _id: string
  _rev?: string
  data?: unknown
  value?: unknown
  [key: string]: unknown
}

/**
 * 基于 electron-store 的精简 KV 文档存储，替代 ZTools 的 LMDB。
 * 数据结构与插件运行时约定保持兼容：
 * - 宿主数据以 `ZTOOLS/<key>` 为文档 id
 * - 插件私有数据以 `PLUGIN/<pluginName>/<key>` 隔离
 */
class KvStore {
  private store: Store<Record<string, StoredDoc>>
  private revCounter: number

  constructor() {
    this.store = new Store<Record<string, StoredDoc>>({
      name: 'plugin-kv',
      clearInvalidConfig: true,
      defaults: {},
    })
    // 从已有文档恢复计数器，避免进程重启后 _rev 从 1 重新计数导致冲突
    this.revCounter = this.scanMaxRev() + 1
  }

  private scanMaxRev(): number {
    let max = 0
    try {
      for (const doc of Object.values(this.store.store)) {
        const rev = Number(doc?._rev)
        if (Number.isFinite(rev) && rev > max) max = rev
      }
    } catch {
      // 忽略损坏数据
    }
    return max
  }

  /** 生成递增 revision */
  private nextRev(): string {
    return `${this.revCounter++}`
  }

  get(id: string): StoredDoc | null {
    const doc = this.store.get(id)
    return doc && typeof doc === 'object' ? doc : null
  }

  put(doc: StoredDoc): { ok: boolean; id: string; message?: string } {
    if (!doc || typeof doc._id !== 'string' || !doc._id) {
      return { ok: false, id: '', message: '缺少 _id' }
    }
    const existing = this.get(doc._id)
    const next: StoredDoc = {
      ...existing,
      ...doc,
      _id: doc._id,
      _rev: doc._rev || this.nextRev(),
    }
    this.store.set(doc._id, next)
    return { ok: true, id: doc._id }
  }

  remove(docOrId: StoredDoc | string): { ok: boolean; id: string; message?: string } {
    const id = typeof docOrId === 'string' ? docOrId : docOrId?._id
    if (!id) {
      return { ok: false, id: '', message: '缺少 _id' }
    }
    this.store.delete(id)
    return { ok: true, id }
  }

  allDocs(key?: string | string[]): StoredDoc[] {
    const raw = this.store.store
    const entries = Object.entries(raw).filter(([id]) => {
      if (!key) return true
      if (Array.isArray(key)) return key.includes(id)
      return id.startsWith(key)
    })
    return entries.map(([, v]) => v)
  }

  clearAll(): void {
    this.store.clear()
  }
}

export class PluginDb {
  private kv = new KvStore()

  /** 宿主数据写入：id 统一为 ZTOOLS/<key> */
  dbPut(key: string, data: unknown): void {
    this.kv.put({ _id: `ZTOOLS/${key}`, data })
  }

  /** 宿主数据读取 */
  dbGet(key: string): unknown {
    const doc = this.kv.get(`ZTOOLS/${key}`)
    return doc ? (doc.data ?? doc.value ?? null) : null
  }

  dbRemove(key: string): void {
    this.kv.remove(`ZTOOLS/${key}`)
  }

  get(id: string): StoredDoc | null {
    return this.kv.get(id)
  }

  put(doc: StoredDoc): { ok: boolean; id: string; message?: string } {
    return this.kv.put(doc)
  }

  remove(id: string): { ok: boolean; id: string; message?: string } {
    return this.kv.remove(id)
  }

  allDocs(prefix?: string | string[]): StoredDoc[] {
    return this.kv.allDocs(prefix)
  }
}

export const pluginDb = new PluginDb()
