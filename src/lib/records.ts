// Helpers for finding the list of records inside a paginated response, so pages
// can be merged into one combined result. "" means the response itself is the array.

export function getAtPath(value: unknown, path: string): unknown {
  return path
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((acc, segment) => (acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[segment] : undefined), value)
}

function longestArrayKey(obj: Record<string, unknown>, prefix: string, best: { path: string; length: number } | null) {
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && (!best || value.length > best.length)) {
      best = { path: prefix + key, length: value.length }
    }
  }
  return best
}

// Picks the longest array at the top level, then one level down (e.g. "data.items").
export function detectRecordsPath(json: unknown): string | null {
  if (Array.isArray(json)) return ''
  if (!json || typeof json !== 'object') return null

  const top = longestArrayKey(json as Record<string, unknown>, '', null)
  if (top) return top.path

  let nested: { path: string; length: number } | null = null
  for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      nested = longestArrayKey(value as Record<string, unknown>, `${key}.`, nested)
    }
  }
  return nested?.path ?? null
}

export function extractRecords(json: unknown, path: string | null): unknown[] | undefined {
  if (path === null) return undefined
  const value = path === '' ? json : getAtPath(json, path)
  return Array.isArray(value) ? value : undefined
}
