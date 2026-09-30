import { describeFetchError, fetchThrough, headersToObject } from './fetchThrough'
import type { KeyValue, RequestConfig, RequestResult } from './types'

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
    const raw = await fetchThrough(url, config.method, headers, body, signal, config.useProxy ? proxyUrl : undefined)

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
      error: timedOut ? `Timed out after ${config.timeoutMs}ms` : describeFetchError(err),
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}
