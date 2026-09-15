// Minimal CORS-bypass proxy for API ToolKit.
//
// The browser enforces CORS on script-initiated requests; a server-to-server
// request has no such restriction. This worker sits in between: the app POSTs
// { url, method, headers, body } to it, the worker makes that request itself,
// and hands the result back wrapped in JSON with permissive CORS headers.
//
// Locked down two ways so this can't become an open relay:
//   - only requests from ALLOWED_ORIGIN get a CORS-enabled response
//   - only targets under ALLOWED_HOST_SUFFIXES are forwarded at all
// Replace both placeholders below with your own deployed origin and API
// domain(s) before deploying — see ../README.md.

const ALLOWED_ORIGIN = 'https://your-username.github.io'
const ALLOWED_HOST_SUFFIXES = ['example.com']

function isHostAllowed(hostname) {
  return ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin)
    }
    // Origin headers can be spoofed by a non-browser caller, so this isn't watertight —
    // but it stops the common case of this public URL being used as a blind relay by
    // anything that isn't the app itself (scanners, casual discovery, etc).
    if (origin !== ALLOWED_ORIGIN) {
      return json({ error: 'Origin not allowed' }, 403, origin)
    }

    let payload
    try {
      payload = await request.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, origin)
    }

    const { url, method, headers, body } = payload || {}
    let target
    try {
      target = new URL(url)
    } catch {
      return json({ error: 'Invalid target URL' }, 400, origin)
    }

    if (!isHostAllowed(target.hostname)) {
      return json({ error: `Target host not allowed: ${target.hostname}` }, 403, origin)
    }

    const upstreamHeaders = new Headers()
    for (const [key, value] of Object.entries(headers || {})) {
      if (typeof value === 'string') upstreamHeaders.set(key, value)
    }

    const upstreamMethod = typeof method === 'string' ? method.toUpperCase() : 'GET'
    let upstreamRes
    try {
      upstreamRes = await fetch(target.toString(), {
        method: upstreamMethod,
        headers: upstreamHeaders,
        body: upstreamMethod === 'GET' || upstreamMethod === 'HEAD' ? undefined : body,
      })
    } catch (err) {
      return json({ error: `Upstream fetch failed: ${err.message}` }, 502, origin)
    }

    const responseHeaders = {}
    upstreamRes.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    const responseBody = await upstreamRes.text()

    return json(
      {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        headers: responseHeaders,
        body: responseBody,
      },
      200,
      origin,
    )
  },
}
