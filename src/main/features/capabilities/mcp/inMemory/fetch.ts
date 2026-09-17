import { net } from 'electron'
import type { InMemoryTool } from './filesystem'

function textResult(text: string, isError = false) {
  return { content: [{ type: 'text', text }], isError }
}

/** 进程内 Fetch（Cherry @cherry/fetch 精简版） */
export function createFetchTools(): InMemoryTool[] {
  return [
    {
      name: 'fetch',
      description: 'Fetch a URL and return response text (truncated)',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          max_length: { type: 'number', description: 'Max chars, default 20000' },
        },
        required: ['url'],
      },
      handler: async (a) => {
        const url = String(a.url)
        if (!/^https?:\/\//i.test(url)) throw new Error('仅支持 http/https')
        const max = Number(a.max_length) || 20000
        const resp = await net.fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          },
        })
        if (!resp.ok) throw new Error('HTTP ' + resp.status)
        const text = await resp.text()
        return textResult(text.slice(0, max) + (text.length > max ? '\n...[truncated]' : ''))
      },
    },
  ]
}
