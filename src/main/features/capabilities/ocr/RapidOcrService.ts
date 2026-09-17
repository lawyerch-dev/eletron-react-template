import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import log from 'electron-log/main'
import type { OcrRecognizeInput, OcrRecognizeResult, OcrStatus } from '@ert/shared/types'
import { paths } from '../../../app/paths'

const PLUGIN_NAME = 'ocr-service'

function pluginRoot(): string {
  return path.join(paths.builtinPluginsRoot(), PLUGIN_NAME)
}

function scriptsDir(): string {
  return path.join(pluginRoot(), 'scripts')
}

function runnerPath(): string {
  return path.join(scriptsDir(), 'rapidocr_runner.py')
}

function resolveUvBinary(): string {
  if (process.env.RAPIDOCR_UV) return process.env.RAPIDOCR_UV
  const candidates = [
    path.join(os.homedir(), '.local/bin/uv'),
    path.join(os.homedir(), '.cargo/bin/uv'),
    '/opt/homebrew/bin/uv',
    '/usr/local/bin/uv',
  ]
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c
    } catch {
      /* continue */
    }
  }
  return 'uv'
}

function venvPython(base: string): string | null {
  const bin = process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'
  const p = path.join(base, bin)
  return fs.existsSync(p) ? p : null
}

type Launch = { kind: string; bin: string; argsPrefix: string[] }

function launchCandidates(): Launch[] {
  const list: Launch[] = []
  const scriptsPy = venvPython(path.join(scriptsDir(), '.venv'))
  if (scriptsPy) list.push({ kind: 'scripts-venv', bin: scriptsPy, argsPrefix: [] })
  const rootPy = venvPython(path.join(pluginRoot(), '.venv'))
  if (rootPy) list.push({ kind: 'root-venv', bin: rootPy, argsPrefix: [] })
  list.push({
    kind: 'uv',
    bin: resolveUvBinary(),
    argsPrefix: ['run', '--directory', scriptsDir(), '--quiet', 'python'],
  })
  if (process.env.RAPIDOCR_PYTHON && fs.existsSync(process.env.RAPIDOCR_PYTHON)) {
    list.push({ kind: 'python', bin: process.env.RAPIDOCR_PYTHON, argsPrefix: [] })
  }
  const sysPy =
    ['/opt/homebrew/bin/python3', '/usr/local/bin/python3', 'python3'].find((c) =>
      c.includes('/') ? fs.existsSync(c) : true,
    ) || 'python3'
  list.push({ kind: 'python', bin: sysPy, argsPrefix: [] })
  return list
}

function runSidecar(
  launch: Launch,
  request: unknown,
  timeoutMs: number,
): Promise<OcrStatus | OcrRecognizeResult | Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const args = [...launch.argsPrefix, runnerPath()]
    const child = spawn(launch.bin, args, {
      cwd: scriptsDir(),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        UV_CACHE_DIR: process.env.UV_CACHE_DIR || path.join(os.homedir(), '.cache', 'uv'),
      },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try {
        child.kill('SIGKILL')
      } catch {
        /* ignore */
      }
      reject(new Error(`RapidOCR 超时（${Math.round(timeoutMs / 1000)}s）kind=${launch.kind}`))
    }, timeoutMs)

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn()
    }

    child.stdout.on('data', (c) => {
      stdout += String(c)
    })
    child.stderr.on('data', (c) => {
      stderr += String(c)
    })
    child.on('error', (err) => {
      finish(() => reject(new Error(`RapidOCR 启动失败 kind=${launch.kind}: ${err.message}`)))
    })
    child.on('close', (code) => {
      finish(() => {
        const line = stdout.trim().split('\n').filter(Boolean).pop()
        if (!line) {
          const tail = stderr.trim().split('\n').slice(-8).join('\n')
          reject(new Error(tail || `RapidOCR 退出码 ${code}`))
          return
        }
        try {
          resolve(JSON.parse(line) as Record<string, unknown>)
        } catch (e) {
          reject(new Error(`RapidOCR 输出解析失败: ${(e as Error).message}`))
        }
      })
    })

    try {
      child.stdin.write(JSON.stringify(request))
      child.stdin.end()
    } catch (e) {
      finish(() => reject(new Error(`写入 stdin 失败: ${(e as Error).message}`)))
    }
  })
}

/**
 * 主进程 RapidOCR 能力：不依赖插件窗口即可识别。
 * 与 ocr-service 插件共用 scripts/rapidocr_runner.py。
 */
class RapidOcrService {
  private launch: Launch | null = null
  private probePromise: Promise<OcrStatus> | null = null

  private async ensureReady(): Promise<OcrStatus> {
    if (this.probePromise) return this.probePromise
    this.probePromise = this.probeOnce()
    try {
      return await this.probePromise
    } catch (e) {
      this.probePromise = null
      throw e
    }
  }

  private async probeOnce(): Promise<OcrStatus> {
    const runner = runnerPath()
    if (!fs.existsSync(runner)) {
      return {
        enabled: true,
        engine: 'rapidocr',
        available: false,
        runnerPath: runner,
        error: `未找到 runner: ${runner}`,
      }
    }

    const errors: string[] = []
    for (const candidate of launchCandidates()) {
      const timeoutMs = candidate.kind === 'uv' ? 90000 : 20000
      log.info(`[ocr] probe ${candidate.kind} ${candidate.bin}`)
      try {
        const result = (await runSidecar(candidate, { probe: true }, timeoutMs)) as {
          ok?: boolean
          python?: string
          error?: string
        }
        if (result?.ok === true) {
          this.launch = candidate
          return {
            enabled: true,
            engine: 'rapidocr',
            available: true,
            kind: candidate.kind,
            python: result.python,
            runnerPath: runner,
          }
        }
        errors.push(`${candidate.kind}: ${result?.error || 'probe failed'}`)
      } catch (e) {
        errors.push(`${candidate.kind}: ${(e as Error).message}`)
      }
    }

    return {
      enabled: true,
      engine: 'rapidocr',
      available: false,
      runnerPath: runner,
      error: errors.join('; ') || '无可用 Python 环境',
    }
  }

  async status(): Promise<OcrStatus> {
    return this.ensureReady()
  }

  async recognize(input: OcrRecognizeInput): Promise<OcrRecognizeResult> {
    const started = Date.now()
    if (!input?.imagePath && !input?.imageBase64) {
      return { ok: false, error: '需要 imagePath 或 imageBase64' }
    }
    if (input.imagePath && !fs.existsSync(input.imagePath)) {
      return { ok: false, error: `文件不存在: ${input.imagePath}` }
    }

    const status = await this.ensureReady()
    if (!status.available || !this.launch) {
      return { ok: false, error: status.error || 'RapidOCR 不可用' }
    }

    const request: Record<string, unknown> = {}
    if (input.imagePath) request.image_path = input.imagePath
    if (input.imageBase64) request.image_base64 = input.imageBase64
    if (input.lang) request.lang = input.lang

    try {
      const raw = (await runSidecar(this.launch, request, 180000)) as {
        ok?: boolean
        text?: string
        confidence?: number
        lines?: OcrRecognizeResult['lines']
        elapse?: number
        error?: string
        engine?: string
      }
      if (!raw || raw.ok === false) {
        return { ok: false, error: raw?.error || '识别失败', durationMs: Date.now() - started }
      }
      return {
        ok: true,
        text: raw.text || '',
        confidence: Number(raw.confidence || 0),
        lines: raw.lines || [],
        engine: 'rapidocr',
        elapse: raw.elapse,
        durationMs: Date.now() - started,
      }
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message,
        durationMs: Date.now() - started,
      }
    }
  }
}

export const rapidOcrService = new RapidOcrService()
