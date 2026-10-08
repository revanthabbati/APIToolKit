import { createKeyValue } from './factory'
import type { KeyValue } from './types'

export function extractQueryParams(raw: string): { base: string; params: KeyValue[] } | null {
  const qIndex = raw.indexOf('?')
  if (qIndex === -1) return null

  const base = raw.slice(0, qIndex)
  let queryPart = raw.slice(qIndex + 1)
  let hash = ''
  const hashIndex = queryPart.indexOf('#')
  if (hashIndex !== -1) {
    hash = queryPart.slice(hashIndex)
    queryPart = queryPart.slice(0, hashIndex)
  }
  if (queryPart === '') return null

  const params = [...new URLSearchParams(queryPart).entries()].map(([key, value]) => createKeyValue(key, value))
  if (params.length === 0) return null

  return { base: base + hash, params }
}

export function mergeQueryParams(existing: KeyValue[], incoming: KeyValue[]): KeyValue[] {
  const result = existing.filter((kv) => kv.key.trim() !== '' || kv.value.trim() !== '')
  const matchedKeys = new Set<string>()

  for (const inc of incoming) {
    const idx = matchedKeys.has(inc.key) ? -1 : result.findIndex((kv) => kv.key === inc.key)
    if (idx !== -1) {
      result[idx] = { ...result[idx], value: inc.value, enabled: true }
    } else {
      result.push(inc)
    }
    matchedKeys.add(inc.key)
  }

  return result
}
