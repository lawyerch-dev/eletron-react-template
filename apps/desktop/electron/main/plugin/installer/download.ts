import { net, session } from 'electron'
import { createWriteStream } from 'node:fs'

export interface DownloadProgress {
  receivedBytes: number
  totalBytes?: number
  percent: number | null
}

export interface DownloadFileOptions {
  signal?: AbortSignal
  onProgress?: (progress: DownloadProgress) => void
}

export class DownloadCancelledError extends Error {
  constructor() {
    super('下载已取消')
    this.name = 'DownloadCancelledError'
  }
}

/**
 * 使用 Electron net.request 下载文件到指定路径。
 * 逻辑与 ZTools 对齐，可自动跟随重定向并处理取消/进度回调。
 */
export async function downloadFile(
  url: string,
  filePath: string,
  options: DownloadFileOptions = {},
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DownloadCancelledError())
      return
    }

    let settled = false
    let writeStream: ReturnType<typeof createWriteStream> | null = null
    const request = net.request({
      url,
      session: session.defaultSession,
    })

    const cleanup: () => void = () => {
      options.signal?.removeEventListener('abort', handleAbort)
    }

    const finish: (callback: () => void) => void = (callback) => {
      if (settled) return
      settled = true
      cleanup()
      callback()
    }

    const fail = (err: unknown): void => {
      finish(() => {
        try {
          request.abort()
        } catch {
          // 忽略失败清理时的请求状态差异
        }
        writeStream?.destroy()
        reject(err)
      })
    }

    function handleAbort(): void {
      try {
        request.abort()
      } catch {
        // 忽略 abort 期间的底层请求状态差异
      }
      fail(new DownloadCancelledError())
    }

    options.signal?.addEventListener('abort', handleAbort, { once: true })

    // 禁用缓存的请求头（确保每次都下载最新文件）
    request.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    request.setHeader('Pragma', 'no-cache')
    request.setHeader('Expires', '0')
    request.setHeader(
      'accept',
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    )
    request.setHeader('accept-encoding', 'gzip, deflate, br, zstd')
    request.setHeader('accept-language', 'zh-CN,zh;q=0.9')
    request.setHeader(
      'user-agent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    )

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        fail(new Error(`下载失败: HTTP ${response.statusCode}`))
        return
      }

      const contentLengthHeader = response.headers['content-length']
      const contentLengthValue = Array.isArray(contentLengthHeader)
        ? contentLengthHeader[0]
        : contentLengthHeader
      const totalBytes = contentLengthValue ? Number(contentLengthValue) : undefined
      const hasTotalBytes = typeof totalBytes === 'number' && Number.isFinite(totalBytes)
      let receivedBytes = 0

      options.onProgress?.({
        receivedBytes,
        totalBytes: hasTotalBytes ? totalBytes : undefined,
        percent: hasTotalBytes && totalBytes > 0 ? 0 : null,
      })

      writeStream = createWriteStream(filePath)

      response.on('data', (chunk: Buffer) => {
        if (settled) return
        receivedBytes += Buffer.byteLength(chunk)
        writeStream?.write(chunk)
        options.onProgress?.({
          receivedBytes,
          totalBytes: hasTotalBytes ? totalBytes : undefined,
          percent:
            hasTotalBytes && totalBytes > 0
              ? Math.min(100, (receivedBytes / totalBytes) * 100)
              : null,
        })
      })

      response.on('end', () => {
        if (settled) return
        writeStream?.end()
        options.onProgress?.({
          receivedBytes,
          totalBytes: hasTotalBytes ? totalBytes : undefined,
          percent: hasTotalBytes && totalBytes > 0 ? 100 : null,
        })
      })

      response.on('error', (err) => {
        fail(err)
      })

      writeStream.on('finish', () => {
        finish(() => resolve())
      })

      writeStream.on('error', (err) => {
        fail(err)
      })
    })

    request.on('error', (err) => {
      if (options.signal?.aborted) {
        fail(new DownloadCancelledError())
        return
      }
      fail(err)
    })

    request.end()
  })
}
