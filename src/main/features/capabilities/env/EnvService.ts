import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import log from 'electron-log/main'
import type { EnvStatus, EnvToolId, EnvToolStatus } from '@ert/shared/types'

const execFileAsync = promisify(execFile)

const TOOLS: Array<{ id: EnvToolId; args: string[]; note?: string }> = [
  { id: 'uv', args: ['--version'], note: 'RapidOCR / Python sidecar' },
  { id: 'python3', args: ['--version'], note: '系统 Python' },
  { id: 'python', args: ['--version'] },
  { id: 'node', args: ['--version'], note: '开发与部分 MCP' },
  { id: 'npm', args: ['--version'] },
  { id: 'pnpm', args: ['--version'] },
  { id: 'ffmpeg', args: ['-version'], note: '媒体处理（可选）' },
]

async function probeOne(id: EnvToolId, args: string[], note?: string): Promise<EnvToolStatus> {
  try {
    const { stdout, stderr } = await execFileAsync(id, args, {
      timeout: 5000,
      windowsHide: true,
    })
    const line = (stdout || stderr || '').split('\n')[0]?.trim()
    return { id, available: true, version: line || undefined, note }
  } catch {
    return { id, available: false, note }
  }
}

/** 环境依赖探测（对齐 OCR 的 uv 思路，泛化到常用工具链） */
class EnvService {
  async status(): Promise<EnvStatus> {
    const tools = await Promise.all(TOOLS.map((t) => probeOne(t.id, t.args, t.note)))
    log.info(
      `[env] probed ${tools.filter((t) => t.available).length}/${tools.length} tools available`,
    )
    return {
      tools,
      platform: process.platform,
      checkedAt: Date.now(),
    }
  }
}

export const envService = new EnvService()
