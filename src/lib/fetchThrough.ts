// Shared "call this URL, directly or via the configured CORS proxy" primitive.
// Used by both the generic request runner and the Samsung import module so
// there's one place that knows how to talk to the proxy envelope contract.

export interface RawResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  bodyText: string
}

export function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  return out
}

export function describeFetchError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return 'Request aborted'
  if (err instanceof TypeError) {
    return 'Request failed — likely blocked by CORS policy, a network error, or an invalid URL.'
  }
  if (err instanceof Error) return err.message
  return String(err)
}

// Turns the proxy worker's own rejections into instructions for fixing its config.
function explainProxyError(status: number, detail: string): string {
  let message = ''
  try {
    message = String(JSON.parse(detail).error ?? '')
  } catch {
    // not JSON — fall through to the raw detail
  }
  const host = /^Target host not allowed: (.+)$/.exec(message)?.[1]
  if (host) {
    return `Your proxy isn't allowed to call ${host} yet. Add its domain to ALLOWED_HOST_SUFFIXES in the proxy worker's code and redeploy it.`
  }
  if (message === 'Origin not allowed') {
    return `Your proxy only accepts requests from its configured site, not ${window.location.origin}. Set ALLOWED_ORIGIN in the proxy worker to ${window.location.origin} and redeploy it.`
  }
  return `Proxy error (${status})${detail ? `: ${detail.slice(0, 300)}` : ''}`
}

export async function fetchDirect(
  url: string,
  method: string,
  headers: Headers,
  body: string | undefined,
  signal: AbortSignal,
): Promise<RawResponse> {
  const res = await fetch(url, { method, headers, body, signal })
  const bodyText = await res.text()
  return { status: res.status, statusText: res.statusText, headers: headersToObject(res.headers), bodyText }
}

export async function fetchViaProxy(
  proxyUrl: string,
  url: string,
  method: string,
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
    throw new Error(explainProxyError(res.status, detail))
  }
  const envelope = await res.json()
  return {
    status: envelope.status,
    statusText: envelope.statusText ?? '',
    headers: envelope.headers ?? {},
    bodyText: envelope.body ?? '',
  }
}

export async function fetchThrough(
  url: string,
  method: string,
  headers: Headers,
  body: string | undefined,
  signal: AbortSignal,
  proxyUrl?: string,
): Promise<RawResponse> {
  return proxyUrl
    ? fetchViaProxy(proxyUrl, url, method, headers, body, signal)
    : fetchDirect(url, method, headers, body, signal)
}
