import type { KeyValue, RequestConfig } from './types'

export const MIN_DELAY_MS = 200
export const DEFAULT_DELAY_MS = 5000
export const DEFAULT_TIMEOUT_MS = 10_000
export const DEFAULT_REPEAT_COUNT = 10

export function createKeyValue(key = '', value = ''): KeyValue {
  return { id: crypto.randomUUID(), key, value, enabled: true }
}

export function createEmptyConfig(): RequestConfig {
  return {
    id: crypto.randomUUID(),
    name: '',
    url: '',
    method: 'GET',
    headers: [createKeyValue()],
    queryParams: [createKeyValue()],
    bodyType: 'none',
    body: '',
    delayMs: DEFAULT_DELAY_MS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    repeatMode: 'infinite',
    repeatCount: DEFAULT_REPEAT_COUNT,
    useProxy: false,
    overlapRequests: false,
  }
}

export function createDemoConfig(): RequestConfig {
  return {
    ...createEmptyConfig(),
    name: 'Demo: JSONPlaceholder',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    delayMs: 5000,
  }
}
