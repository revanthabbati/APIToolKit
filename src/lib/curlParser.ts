export interface ParsedCurl {
  method: string
  url: string
  headers: { key: string; value: string }[]
  body: string
}

const DATA_FLAGS = new Set(['-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode'])

// Flags that take a value we don't use — skip the value so it isn't mistaken for the URL.
const IGNORED_FLAGS_WITH_VALUE = new Set([
  '-o', '--output', '-m', '--max-time', '--connect-timeout', '-w', '--write-out', '-x', '--proxy',
  '--retry', '--retry-delay', '--cacert', '--cert', '--key', '-E', '-T', '--upload-file', '-F', '--form',
  '-c', '--cookie-jar', '--resolve', '--limit-rate', '--max-redirs', '-r', '--range',
])

function tokenize(input: string): string[] {
  let text = input.replace(/\\\r?\n/g, ' ').replace(/`\r?\n/g, ' ')
  // Windows cmd "Copy as cURL" escapes with ^ and continues lines with a trailing ^.
  if (/\^\r?\n/.test(text) || text.includes('^"')) {
    text = text.replace(/\^\r?\n/g, ' ').replace(/\^(.)/g, '$1')
  }

  const tokens: string[] = []
  let current = ''
  let inToken = false
  let quote: '"' | "'" | null = null

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === quote) {
        quote = null
      } else if (quote === '"' && ch === '\\' && /["\\$`]/.test(text[i + 1] ?? '')) {
        current += text[++i]
      } else {
        current += ch
      }
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      inToken = true
    } else if (ch === '\\' && i + 1 < text.length) {
      current += text[++i]
      inToken = true
    } else if (/\s/.test(ch)) {
      if (inToken) tokens.push(current)
      current = ''
      inToken = false
    } else {
      current += ch
      inToken = true
    }
  }
  if (quote) throw new Error('Unterminated quote in the cURL command.')
  if (inToken) tokens.push(current)
  return tokens
}

function parseHeader(raw: string): { key: string; value: string } | null {
  const idx = raw.indexOf(':')
  if (idx <= 0) return null
  return { key: raw.slice(0, idx).trim(), value: raw.slice(idx + 1).trim() }
}

export function parseCurl(input: string): ParsedCurl {
  const tokens = tokenize(input.trim())
  if (tokens.length === 0) throw new Error('Paste a cURL command or a URL.')

  if (tokens[0].toLowerCase() !== 'curl') {
    if (tokens.length === 1 && /^https?:\/\//i.test(tokens[0])) {
      return { method: 'GET', url: tokens[0], headers: [], body: '' }
    }
    throw new Error('Expected a command starting with "curl", or a plain http(s) URL.')
  }

  let method: string | undefined
  let url = ''
  let forceGet = false
  const headers: { key: string; value: string }[] = []
  const dataParts: string[] = []

  for (let i = 1; i < tokens.length; i++) {
    const flag = tokens[i]
    const takeValue = () => {
      if (i + 1 >= tokens.length) throw new Error(`Missing value after ${flag}.`)
      return tokens[++i]
    }

    if (flag === '-X' || flag === '--request') {
      method = takeValue().toUpperCase()
    } else if (/^-X[A-Za-z]+$/.test(flag)) {
      method = flag.slice(2).toUpperCase()
    } else if (flag === '-H' || flag === '--header') {
      const header = parseHeader(takeValue())
      if (header) headers.push(header)
    } else if (DATA_FLAGS.has(flag)) {
      dataParts.push(takeValue())
    } else if (flag === '--json') {
      dataParts.push(takeValue())
      if (!headers.some((h) => h.key.toLowerCase() === 'content-type')) headers.push({ key: 'Content-Type', value: 'application/json' })
      if (!headers.some((h) => h.key.toLowerCase() === 'accept')) headers.push({ key: 'Accept', value: 'application/json' })
    } else if (flag === '-u' || flag === '--user') {
      const credentials = takeValue()
      try {
        headers.push({ key: 'Authorization', value: `Basic ${btoa(credentials)}` })
      } catch {
        throw new Error('Could not encode the -u credentials (non-Latin characters).')
      }
    } else if (flag === '-A' || flag === '--user-agent') {
      headers.push({ key: 'User-Agent', value: takeValue() })
    } else if (flag === '-b' || flag === '--cookie') {
      headers.push({ key: 'Cookie', value: takeValue() })
    } else if (flag === '-e' || flag === '--referer') {
      headers.push({ key: 'Referer', value: takeValue() })
    } else if (flag === '--url') {
      url = takeValue()
    } else if (flag === '-G' || flag === '--get') {
      forceGet = true
    } else if (IGNORED_FLAGS_WITH_VALUE.has(flag)) {
      takeValue()
    } else if (flag.startsWith('-')) {
      // Boolean flags like -L/--location, -s, -k, --compressed, -i, -v don't affect the request we build.
    } else if (!url) {
      url = flag
    }
  }

  if (!url) throw new Error('No URL found in the cURL command.')

  let body = dataParts.join('&')
  if (forceGet && body) {
    url += (url.includes('?') ? '&' : '?') + body
    body = ''
  }

  return { method: method ?? (body ? 'POST' : 'GET'), url, headers, body }
}
