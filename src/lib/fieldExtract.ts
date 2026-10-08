// Discovering fields inside a list of records and projecting records down to a
// chosen subset of them. Paths are stored as segment arrays, so keys that
// themselves contain dots stay unambiguous.

export interface ExportField {
  path: string[]
  label: string
}

export interface FieldInfo {
  path: string[]
  key: string
  sample: unknown
  coverage: number
}

const MAX_SAMPLE_RECORDS = 2000
const MAX_DEPTH = 8
const MAX_FIELDS = 1000

export function fieldId(path: string[]): string {
  return JSON.stringify(path)
}

export function displayPath(path: string[]): string {
  return path.length === 0 ? '(whole value)' : path.join('.')
}

function walk(value: unknown, path: string[], depth: number, visit: (path: string[], value: unknown) => void) {
  const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  if (isPlainObject && depth < MAX_DEPTH && Object.keys(value as object).length > 0) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) walk(child, [...path, key], depth + 1, visit)
  } else {
    visit(path, value)
  }
}

// Leaf fields across a sample of records, with how often each one is present.
export function discoverFields(records: unknown[]): FieldInfo[] {
  const sample = records.slice(0, MAX_SAMPLE_RECORDS)
  const found = new Map<string, { path: string[]; count: number; sample: unknown }>()

  for (const record of sample) {
    const seenInRecord = new Set<string>()
    walk(record, [], 0, (path, value) => {
      const id = fieldId(path)
      if (seenInRecord.has(id)) return
      seenInRecord.add(id)
      let entry = found.get(id)
      if (!entry) {
        if (found.size >= MAX_FIELDS) return
        entry = { path, count: 0, sample: undefined }
        found.set(id, entry)
      }
      entry.count += 1
      if ((entry.sample === undefined || entry.sample === null || entry.sample === '') && value !== undefined) entry.sample = value
    })
  }

  return [...found.values()].map((e) => ({
    path: e.path,
    key: displayPath(e.path),
    sample: e.sample,
    coverage: sample.length > 0 ? e.count / sample.length : 0,
  }))
}

export function getValue(record: unknown, path: string[]): unknown {
  let current = record
  for (const segment of path) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

export function parsePathInput(input: string): string[] {
  return input
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean)
}

// Last segment by default; the full path if that name is already taken.
export function defaultLabel(path: string[], existing: ExportField[]): string {
  const last = path[path.length - 1] ?? 'value'
  return existing.some((f) => f.label === last) ? path.join('.') : last
}

export function labelProblems(fields: ExportField[]): string | null {
  if (fields.some((f) => f.label.trim() === '')) return 'Every selected field needs an output name.'
  const labels = fields.map((f) => f.label.trim())
  const duplicate = labels.find((label, i) => labels.indexOf(label) !== i)
  return duplicate ? `Two fields are both named "${duplicate}" — rename one so neither gets overwritten.` : null
}

export function projectRecords(records: unknown[], fields: ExportField[], dedupe: boolean): Record<string, unknown>[] {
  const rows = records.map((record) => {
    const row: Record<string, unknown> = {}
    for (const field of fields) row[field.label.trim()] = getValue(record, field.path) ?? null
    return row
  })
  if (!dedupe) return rows
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Spreadsheet apps execute cells starting with these characters as formulas.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: Record<string, unknown>[], labels: string[]): string {
  const lines = [labels.map(csvCell).join(','), ...rows.map((row) => labels.map((label) => csvCell(row[label])).join(','))]
  // BOM so Excel opens UTF-8 correctly.
  return `﻿${lines.join('\r\n')}`
}

export function formatSample(value: unknown): string {
  if (value === undefined) return ''
  if (value === null) return 'null'
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return text.length > 60 ? `${text.slice(0, 60)}…` : text
}
