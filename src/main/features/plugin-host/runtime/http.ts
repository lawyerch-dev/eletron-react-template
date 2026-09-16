export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
}

/**
 * 极简 HTTP 客户端，基于主进程的全局 fetch。
 * 返回 { data, status }，data 已按 JSON / 文本解析。
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse<T>> {
  const { method = 'GET', headers = {}, body } = options
  const response = await fetch(url, {
    method,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...headers,
    },
    body,
  })
  const text = await response.text()
  let data: unknown = text
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  return { data: data as T, status: response.status }
}

export function httpGet<T = unknown>(
  url: string,
  options: Omit<HttpRequestOptions, 'method' | 'body'> = {},
): Promise<HttpResponse<T>> {
  return httpRequest<T>(url, { ...options, method: 'GET' })
}
