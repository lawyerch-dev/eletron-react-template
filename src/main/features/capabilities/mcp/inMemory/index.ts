import type { InMemoryTool } from './filesystem'
import { createFilesystemTools } from './filesystem'
import { createMemoryTools } from './memory'
import { createFetchTools } from './fetch'

/** 按 server id/name 创建进程内工具集 */
export function createInMemoryTools(serverId: string, args?: string[]): InMemoryTool[] {
  if (serverId === 'inmemory-filesystem' || serverId.includes('filesystem')) {
    return createFilesystemTools(args)
  }
  if (serverId === 'inmemory-memory' || serverId.includes('memory')) {
    return createMemoryTools()
  }
  if (serverId === 'inmemory-fetch' || serverId.includes('fetch')) {
    return createFetchTools()
  }
  throw new Error('未知 inMemory 服务器: ' + serverId)
}

export type { InMemoryTool } from './filesystem'
