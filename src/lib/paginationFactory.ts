import { parseCurl } from './curlParser'
import { createKeyValue } from './factory'
import type { PaginationConfig } from './paginationTypes'
import { extractQueryParams } from './queryParams'
import { HTTP_METHODS } from './types'
import type { HttpMethod, KeyValue } from './types'

const PAGE_KEY = /^_?(page|page[_-]?(no|num|number|index)|pageno|pagenumber|pageindex)$/i

export function createPaginationConfig(): PaginationConfig {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled endpoint',
    method: 'GET',
    baseUrl: '',
    queryParams: [createKeyValue()],
    headers: [createKeyValue()],
    body: '',
    start: 1,
    end: 5,
    step: 1,
    concurrency: 1,
    delayMs: 0,
    timeoutMs: 30_000,
    stopOnEmpty: true,
    stopOnError: false,
    recordsPath: '',
    useProxy: false,
  }
}

function markPageKeys(items: KeyValue[]): { items: KeyValue[]; start: number | null } {
  let start: number | null = null
  const marked = items.map((item) => {
    const n = Number(item.value)
    if (PAGE_KEY.test(item.key.trim()) && item.value.trim() !== '' && Number.isInteger(n)) {
      start ??= n
      return { ...item, increment: true }
    }
    return item
  })
  return { items: marked, start }
}

function nameFromUrl(url: string): string {
  const path = url.split('?')[0].replace(/\/+$/, '')
  const last = path.split('/').pop() ?? ''
  return last && !/^https?:$/i.test(last) ? last : 'Imported endpoint'
}

// Applies a pasted cURL command (or bare URL) onto an existing config, keeping its
// id and run settings. Numeric page-like params/headers are pre-marked to iterate.
export function applyCurlToConfig(config: PaginationConfig, input: string): PaginationConfig {
  const parsed = parseCurl(input)
  const extracted = extractQueryParams(parsed.url)
  const method = (HTTP_METHODS as string[]).includes(parsed.method) ? (parsed.method as HttpMethod) : 'GET'

  const query = markPageKeys(extracted?.params ?? [])
  const headers = markPageKeys(parsed.headers.map((h) => createKeyValue(h.key, h.value)))
  const detectedStart = query.start ?? headers.start
  const span = Math.max(0, config.end - config.start)

  return {
    ...config,
    name: config.name === 'Untitled endpoint' ? nameFromUrl(parsed.url) : config.name,
    method,
    baseUrl: extracted?.base ?? parsed.url,
    queryParams: query.items.length > 0 ? query.items : [createKeyValue()],
    headers: headers.items.length > 0 ? headers.items : [createKeyValue()],
    body: parsed.body,
    start: detectedStart ?? config.start,
    end: detectedStart !== null ? detectedStart + span : config.end,
  }
}
