import type { HttpMethod, KeyValue, RequestConfig, RequestResult } from './types'

const MAX_BODY_CHARS = 200_000

function buildUrl(base: string, params: KeyValue[]): string {
  const enabled = params.filter((p) => p.enabled && p.key.trim() !== '')
  try {
    const url = new URL(base)
    for (const p of enabled) url.searchParams.append(p.key, p.value)
    return url.toString()
  } catch {
    if (enabled.length === 0) return base
    const sep = base.includes('?') ? '&' : '?'
    return (
      base +
      sep +
      enabled.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
    )
  }
}

function buildHeaders(headers: KeyValue[]): Headers {
  const result = new Headers()
  for (const h of headers) {
    if (h.enabled && h.key.trim() !== '') result.set(h.key, h.value)
  }
  return result
}

function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  return out
}

function describeError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return 'Request aborted'
  if (err instanceof TypeError) {
    return 'Request failed — likely blocked by CORS policy, a network error, or an invalid URL.'
  }
  if (err instanceof Error) return err.message
  return String(err)
}

interface RawResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  bodyText: string
}

async function fetchDirect(url: string, method: HttpMethod, headers: Headers, body: string | undefined, signal: AbortSignal): Promise<RawResponse> {
  const res = await fetch(url, { method, headers, body, signal })
  const bodyText = await res.text()
  return { status: res.status, statusText: res.statusText, headers: headersToObject(res.headers), bodyText }
}

async function fetchViaProxy(
  proxyUrl: string,
  url: string,
  method: HttpMethod,
  headers: Headers,
  body: string | undefined,
  signal: AbortSignal,
): Promise<RawResponse> {
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method, headers: headersToObject(headers), body }),
    signal,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Proxy error (${res.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`)
  }
  const envelope = await res.json()
  return {
    status: envelope.status,
    statusText: envelope.statusText ?? '',
    headers: envelope.headers ?? {},
    bodyText: envelope.body ?? '',
  }
}

export async function executeRequest(
  config: RequestConfig,
  externalSignal: AbortSignal,
  attempt: number,
  proxyUrl?: string,
): Promise<RequestResult> {
  const startedAt = Date.now()
  const t0 = performance.now()
  const url = buildUrl(config.url, config.queryParams)
  const headers = buildHeaders(config.headers)
  const hasBody = config.bodyType !== 'none' && config.method !== 'GET' && config.method !== 'HEAD' && config.body.trim() !== ''
  if (hasBody && config.bodyType === 'json' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(() => timeoutController.abort(), config.timeoutMs)
  const signal = AbortSignal.any([externalSignal, timeoutController.signal])

  const base = {
    id: crypto.randomUUID(),
    jobId: config.id,
    attempt,
    requestUrl: url,
    requestMethod: config.method,
    requestHeaders: headersToObject(headers),
    requestBody: hasBody ? config.body : undefined,
  }

  try {
    const body = hasBody ? config.body : undefined
    const raw =
      config.useProxy && proxyUrl
        ? await fetchViaProxy(proxyUrl, url, config.method, headers, body, signal)
        : await fetchDirect(url, config.method, headers, body, signal)

    const truncated = raw.bodyText.length > MAX_BODY_CHARS
    return {
      ...base,
      startedAt,
      finishedAt: Date.now(),
      durationMs: performance.now() - t0,
      ok: raw.status >= 200 && raw.status < 300,
      status: raw.status,
      statusText: raw.statusText,
      responseHeaders: raw.headers,
      responseBody: truncated ? raw.bodyText.slice(0, MAX_BODY_CHARS) : raw.bodyText,
      responseTruncated: truncated,
      responseSize: raw.bodyText.length,
    }
  } catch (err) {
    const timedOut = timeoutController.signal.aborted
    return {
      ...base,
      startedAt,
      finishedAt: Date.now(),
      durationMs: performance.now() - t0,
      ok: false,
      error: timedOut ? `Timed out after ${config.timeoutMs}ms` : describeError(err),
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}
