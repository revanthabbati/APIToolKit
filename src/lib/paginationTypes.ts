import type { ExportField } from './fieldExtract'
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
  // Optional so endpoints saved before custom export existed still load.
  exportFields?: ExportField[]
  exportDedupe?: boolean
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
