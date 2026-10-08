import type { HttpMethod, KeyValue } from './types'

export interface PaginationConfig {
  id: string
  name: string
  method: HttpMethod
  baseUrl: string
  queryParams: KeyValue[]
  headers: KeyValue[]
  body: string
  start: number
  end: number
  step: number
  concurrency: number
  delayMs: number
  timeoutMs: number
  stopOnEmpty: boolean
  stopOnError: boolean
  recordsPath: string
  useProxy: boolean
}

export interface PageResult {
  index: number
  value: number
  url: string
  ok: boolean
  status?: number
  statusText?: string
  durationMs: number
  bodyText: string
  truncated: boolean
  json?: unknown
  recordCount?: number
  error?: string
  startedAt: number
}
