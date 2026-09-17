import fsp from 'node:fs/promises'
import path from 'node:path'
import { paths } from '../../../../app/paths'
import type { InMemoryTool } from './filesystem'

interface Entity {
  name: string
  entityType: string
  observations: string[]
}

interface Relation {
  from: string
  to: string
  relationType: string
}

interface Graph {
  entities: Entity[]
  relations: Relation[]
}

function memoryFile(): string {
  return paths.userData('mcp-memory.json')
}

async function loadGraph(): Promise<Graph> {
  const p = memoryFile()
  try {
    const raw = await fsp.readFile(p, 'utf-8')
    const data = JSON.parse(raw) as Graph
    return { entities: data.entities || [], relations: data.relations || [] }
  } catch {
    return { entities: [], relations: [] }
  }
}

async function saveGraph(graph: Graph): Promise<void> {
  const p = memoryFile()
  await fsp.mkdir(path.dirname(p), { recursive: true })
  await fsp.writeFile(p, JSON.stringify(graph, null, 2), 'utf-8')
}

function textResult(text: string, isError = false) {
  return { content: [{ type: 'text', text }], isError }
}

/** 进程内 Knowledge Graph 记忆（官方 memory MCP 的精简子集） */
export function createMemoryTools(): InMemoryTool[] {
  return [
    {
      name: 'create_entities',
      description: 'Create entities in the knowledge graph',
      inputSchema: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                entityType: { type: 'string' },
                observations: { type: 'array', items: { type: 'string' } },
              },
              required: ['name', 'entityType'],
            },
          },
        },
        required: ['entities'],
      },
      handler: async (a) => {
        const graph = await loadGraph()
        const list = (a.entities as Entity[]) || []
        for (const e of list) {
          const existing = graph.entities.find((x) => x.name === e.name)
          if (existing) {
            existing.observations = Array.from(
              new Set([...(existing.observations || []), ...(e.observations || [])]),
            )
          } else {
            graph.entities.push({
              name: e.name,
              entityType: e.entityType || 'entity',
              observations: e.observations || [],
            })
          }
        }
        await saveGraph(graph)
        return textResult(JSON.stringify({ created: list.length, total: graph.entities.length }))
      },
    },
    {
      name: 'create_relations',
      description: 'Create relations between entities',
      inputSchema: {
        type: 'object',
        properties: {
          relations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' },
                relationType: { type: 'string' },
              },
              required: ['from', 'to', 'relationType'],
            },
          },
        },
        required: ['relations'],
      },
      handler: async (a) => {
        const graph = await loadGraph()
        const list = (a.relations as Relation[]) || []
        for (const r of list) {
          const key = r.from + '|' + r.relationType + '|' + r.to
          const exists = graph.relations.some(
            (x) => x.from + '|' + x.relationType + '|' + x.to === key,
          )
          if (!exists) graph.relations.push(r)
        }
        await saveGraph(graph)
        return textResult(JSON.stringify({ created: list.length, total: graph.relations.length }))
      },
    },
    {
      name: 'add_observations',
      description: 'Add observations to an existing entity',
      inputSchema: {
        type: 'object',
        properties: {
          entityName: { type: 'string' },
          contents: { type: 'array', items: { type: 'string' } },
        },
        required: ['entityName', 'contents'],
      },
      handler: async (a) => {
        const graph = await loadGraph()
        const entity = graph.entities.find((e) => e.name === String(a.entityName))
        if (!entity) throw new Error('实体不存在: ' + String(a.entityName))
        const contents = (a.contents as string[]) || []
        entity.observations = Array.from(new Set([...entity.observations, ...contents]))
        await saveGraph(graph)
        return textResult(
          JSON.stringify({ entity: entity.name, observations: entity.observations }),
        )
      },
    },
    {
      name: 'search_nodes',
      description: 'Search entities and relations by keyword',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
      handler: async (a) => {
        const q = String(a.query || '').toLowerCase()
        const graph = await loadGraph()
        const entities = graph.entities.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.entityType.toLowerCase().includes(q) ||
            e.observations.some((o) => o.toLowerCase().includes(q)),
        )
        const names = new Set(entities.map((e) => e.name))
        const relations = graph.relations.filter((r) => names.has(r.from) || names.has(r.to))
        return textResult(JSON.stringify({ entities, relations }, null, 2))
      },
    },
    {
      name: 'read_graph',
      description: 'Read the entire knowledge graph',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => textResult(JSON.stringify(await loadGraph(), null, 2)),
    },
  ]
}
