import { spawn } from 'node:child_process'
import os from 'node:os'
import log from 'electron-log/main'
import type { McpCallToolResult, McpServerConfig, McpToolInfo } from '@ert/shared/types'
import { buildMcpToolWireId, chinaMirrorEnv } from '@ert/shared/ipc'

interface Pending {
  resolve: (v: unknown) => void
  reject: (e: Error) => void
  timer: NodeJS.Timeout
}

interface Session {
  config: McpServerConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proc: any
  connected: boolean
  tools: McpToolInfo[]
  error?: string
  nextId: number
  pending: Map<number, Pending>
  buffer: string
}

/** 展开 ${HOME} 等占位 */
export function expandMcpArg(arg: string): string {
  const home = os.homedir()
  return arg
    .replaceAll('${HOME}', home)
    .replaceAll('${home}', home)
    .replace(/^~(?=\/|$)/, home)
}

function expandArgs(args?: string[]): string[] {
  return (args || []).map(expandMcpArg)
}

function expandEnv(env?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(env || {})) out[k] = expandMcpArg(v)
  return out
}

/** stdio JSON-RPC 引擎（Runtime 调用；不直接读写配置） */
class McpStdioClient {
  private sessions = new Map<string, Session>()

  getConnected(
    serverId: string,
  ): { connected: boolean; error?: string; tools: McpToolInfo[] } | undefined {
    const s = this.sessions.get(serverId)
    if (!s) return undefined
    return { connected: s.connected, error: s.error, tools: s.tools }
  }

  listToolsSync(serverId: string): McpToolInfo[] {
    return this.sessions.get(serverId)?.tools ?? []
  }

  private rpc(
    session: Session,
    method: string,
    params?: unknown,
    timeoutMs = 30000,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++session.nextId
      const timer = setTimeout(() => {
        session.pending.delete(id)
        reject(new Error('MCP 超时: ' + method))
      }, timeoutMs)
      session.pending.set(id, { resolve, reject, timer })
      try {
        session.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
      } catch (e) {
        session.pending.delete(id)
        clearTimeout(timer)
        reject(e as Error)
      }
    })
  }

  private notify(session: Session, method: string, params?: unknown): void {
    try {
      session.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n')
    } catch (e) {
      log.warn('[mcp] notify failed', e)
    }
  }

  private parseLine(session: Session, line: string): void {
    const trimmed = line.trim()
    if (!trimmed) return
    try {
      const msg = JSON.parse(trimmed) as Record<string, unknown>
      if (typeof msg.id === 'number' && session.pending.has(msg.id)) {
        const p = session.pending.get(msg.id)!
        session.pending.delete(msg.id)
        clearTimeout(p.timer)
        if (msg.error) {
          const err = msg.error as { message?: string }
          p.reject(new Error(err.message || JSON.stringify(msg.error)))
        } else {
          p.resolve(msg.result)
        }
      }
    } catch {
      log.debug('[mcp] non-json line', trimmed.slice(0, 200))
    }
  }

  async connect(serverId: string, config: McpServerConfig): Promise<void> {
    const existing = this.sessions.get(serverId)
    if (existing?.connected) return
    if (existing) await this.disconnect(serverId).catch(() => {})

    if (config.type && config.type !== 'stdio') {
      throw new Error('stdio client 仅处理 type=stdio')
    }
    if (!config.command) throw new Error('stdio 服务器缺少 command')

    const timeoutSec = config.timeout || 60
    const proc = spawn(config.command, expandArgs(config.args), {
      env: {
        ...process.env,
        ...chinaMirrorEnv(),
        ...expandEnv(config.env),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })

    const session: Session = {
      config,
      proc,
      connected: false,
      tools: [],
      nextId: 0,
      pending: new Map(),
      buffer: '',
    }
    this.sessions.set(serverId, session)

    proc.stdout.setEncoding('utf-8')
    proc.stderr.setEncoding('utf-8')
    proc.stdout.on('data', (chunk: string) => {
      session.buffer += chunk
      let idx = session.buffer.indexOf('\n')
      while (idx >= 0) {
        const line = session.buffer.slice(0, idx)
        session.buffer = session.buffer.slice(idx + 1)
        this.parseLine(session, line)
        idx = session.buffer.indexOf('\n')
      }
    })
    proc.stderr.on('data', (chunk: string) => {
      log.debug('[mcp:' + serverId + '] stderr', String(chunk).slice(0, 500))
    })
    proc.on('error', (err: Error) => {
      session.connected = false
      session.error = err.message
      for (const [, p] of session.pending) {
        clearTimeout(p.timer)
        p.reject(err)
      }
      session.pending.clear()
    })
    proc.on('close', (code: number | null) => {
      session.connected = false
      session.error = session.error || '进程退出 code=' + code
      for (const [, p] of session.pending) {
        clearTimeout(p.timer)
        p.reject(new Error(session.error))
      }
      session.pending.clear()
    })

    try {
      await this.rpc(
        session,
        'initialize',
        {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'electron-react-template', version: '1.1.0' },
        },
        timeoutSec * 1000,
      )
      this.notify(session, 'notifications/initialized')
      session.connected = true
      session.error = undefined

      const toolsResult = (await this.rpc(session, 'tools/list', {})) as {
        tools?: Array<{ name: string; description?: string; inputSchema?: unknown }>
      }
      session.tools = (toolsResult?.tools || []).map((t) => ({
        id: buildMcpToolWireId({
          serverId,
          serverName: config.name || serverId,
          toolName: t.name,
        }),
        serverId,
        serverName: config.name || serverId,
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }))
    } catch (e) {
      session.connected = false
      session.error = (e as Error).message
      try {
        proc.kill('SIGKILL')
      } catch {
        /* ignore */
      }
      this.sessions.delete(serverId)
      throw e
    }
  }

  async disconnect(serverId: string): Promise<void> {
    const session = this.sessions.get(serverId)
    if (!session) return
    session.connected = false
    try {
      session.proc.kill('SIGTERM')
    } catch {
      /* ignore */
    }
    this.sessions.delete(serverId)
  }

  async callTool(
    serverId: string,
    config: McpServerConfig,
    toolName: string,
    args?: Record<string, unknown>,
  ): Promise<McpCallToolResult> {
    let session = this.sessions.get(serverId)
    if (!session?.connected) {
      await this.connect(serverId, config)
      session = this.sessions.get(serverId)
    }
    if (!session?.connected) {
      return { ok: false, error: session?.error || '服务器未连接' }
    }
    try {
      const result = (await this.rpc(
        session,
        'tools/call',
        { name: toolName, arguments: args || {} },
        (config.timeout || 60) * 1000,
      )) as { isError?: boolean; content?: unknown }
      return { ok: !result?.isError, isError: !!result?.isError, content: result?.content }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }

  dispose(): void {
    for (const id of [...this.sessions.keys()]) {
      void this.disconnect(id)
    }
  }
}

export const mcpClientService = new McpStdioClient()
