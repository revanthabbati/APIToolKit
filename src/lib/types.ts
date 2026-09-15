export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type BodyType = 'none' | 'json' | 'text'

export type RepeatMode = 'infinite' | 'count'

export interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface RequestConfig {
  id: string
  name: string
  url: string
  method: HttpMethod
  headers: KeyValue[]
  queryParams: KeyValue[]
  bodyType: BodyType
  body: string
  delayMs: number
  timeoutMs: number
  repeatMode: RepeatMode
  repeatCount: number
}

export interface RequestResult {
  id: string
  jobId: string
  attempt: number
  startedAt: number
  finishedAt: number
  durationMs: number
  ok: boolean
  status?: number
  statusText?: string
  requestUrl: string
  requestMethod: HttpMethod
  requestHeaders: Record<string, string>
  requestBody?: string
  responseHeaders?: Record<string, string>
  responseBody?: string
  responseTruncated?: boolean
  responseSize?: number
  error?: string
}

export type JobStatus = 'idle' | 'running' | 'stopped' | 'completed'

export interface Job {
  config: RequestConfig
  status: JobStatus
  results: RequestResult[]
  totalRuns: number
  createdAt: number
}

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export const METHODS_WITH_BODY: ReadonlySet<HttpMethod> = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
