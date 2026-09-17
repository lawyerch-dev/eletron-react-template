import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export interface InMemoryTool {
  name: string
  description: string
  inputSchema: unknown
  handler: (args: Record<string, unknown>) => Promise<{ content: unknown; isError?: boolean }>
}

function textResult(text: string, isError = false) {
  return { content: [{ type: 'text', text }], isError }
}

function resolveSandboxRoot(args?: string[]): string {
  const fromArg = args?.find((a) => a && !a.startsWith('-'))
  const root = fromArg
    ? path.resolve(fromArg.replace(/^~(?=\/|$)/, os.homedir()))
    : path.join(os.homedir(), 'Documents')
  fs.mkdirSync(root, { recursive: true })
  return root
}

function safeJoin(root: string, rel: string): string {
  const abs = path.resolve(root, rel)
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error('路径越界：仅允许沙箱目录 ' + root)
  }
  return abs
}

/** 进程内 Filesystem（精简，对齐 Cherry @cherry/filesystem 工具子集） */
export function createFilesystemTools(args?: string[]): InMemoryTool[] {
  const root = resolveSandboxRoot(args)

  return [
    {
      name: 'list_directory',
      description: 'List files in a directory under the sandbox root',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Relative path, default .' } },
      },
      handler: async (a) => {
        const rel = String(a.path ?? '.')
        const abs = safeJoin(root, rel)
        const entries = await fsp.readdir(abs, { withFileTypes: true })
        const lines = entries.map((e) => (e.isDirectory() ? e.name + '/' : e.name))
        return textResult(lines.join('\n') || '(empty)')
      },
    },
    {
      name: 'read_file',
      description: 'Read a UTF-8 text file under the sandbox root',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
      handler: async (a) => {
        const abs = safeJoin(root, String(a.path))
        const stat = await fsp.stat(abs)
        if (stat.size > 2 * 1024 * 1024) throw new Error('文件过大（>2MB）')
        const text = await fsp.readFile(abs, 'utf-8')
        return textResult(text)
      },
    },
    {
      name: 'write_file',
      description: 'Write a UTF-8 text file under the sandbox root',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
      },
      handler: async (a) => {
        const abs = safeJoin(root, String(a.path))
        await fsp.mkdir(path.dirname(abs), { recursive: true })
        await fsp.writeFile(abs, String(a.content), 'utf-8')
        return textResult('written: ' + abs)
      },
    },
    {
      name: 'get_sandbox_root',
      description: 'Return the sandbox root absolute path',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => textResult(root),
    },
  ]
}
