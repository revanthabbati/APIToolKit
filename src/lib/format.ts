import type { RequestResult } from './types'

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { hour12: false })
}

export function prettyBody(text?: string): string {
  if (!text) return ''
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

type ResultLike = Pick<RequestResult, 'ok' | 'status' | 'statusText' | 'error'>

export function statusBadgeClass(result: ResultLike): string {
  if (result.error || result.status === undefined) {
    return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }
  if (result.status < 300) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
  if (result.status < 400) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'
  if (result.status < 500) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
}

export function statusLabel(result: ResultLike): string {
  if (result.error) return 'Error'
  if (result.status === undefined) return '—'
  return `${result.status}${result.statusText ? ` ${result.statusText}` : ''}`
}
