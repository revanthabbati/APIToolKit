import { describeFetchError, fetchThrough } from './fetchThrough'
import type { PageResult, PaginationConfig } from './paginationTypes'
import { detectRecordsPath, extractRecords } from './records'

export const MAX_ITERATIONS = 1000
const MAX_BODY_CHARS = 2_000_000
const PLACEHOLDER = '{{n}}'

export interface PageTask {
  index: number
  value: number
}

export function computeTasks(start: number, end: number, step: number): PageTask[] {
  if (![start, end, step].every(Number.isFinite)) throw new Error('Start, end and step must be numbers.')
  const magnitude = Math.abs(step)
  if (magnitude === 0) throw new Error('Step must not be 0.')
  const direction = end >= start ? 1 : -1
  const count = Math.floor(Math.abs(end - start) / magnitude) + 1
  if (count > MAX_ITERATIONS) {
    throw new Error(`That range is ${count} requests — the limit per run is ${MAX_ITERATIONS}. Narrow the range or raise the step.`)
  }
  return Array.from({ length: count }, (_, index) => ({ index, value: start + direction * magnitude * index }))
}

function substitute(text: string, n: number): string {
  return text.replaceAll(PLACEHOLDER, String(n))
}

export function usesIteration(config: PaginationConfig): boolean {
  return (
    config.queryParams.some((p) => p.enabled && p.increment) ||
    config.headers.some((h) => h.enabled && h.increment) ||
    config.baseUrl.includes(PLACEHOLDER) ||
    config.queryParams.some((p) => p.enabled && p.value.includes(PLACEHOLDER)) ||
    config.headers.some((h) => h.enabled && h.value.includes(PLACEHOLDER)) ||
    config.body.includes(PLACEHOLDER)
  )
}

export function buildPageRequest(config: PaginationConfig, n: number) {
  const base = substitute(config.baseUrl.trim(), n)
  const params = new URLSearchParams()
  for (const p of config.queryParams) {
    if (p.enabled && p.key.trim()) params.append(p.key.trim(), p.increment ? String(n) : substitute(p.value, n))
  }
  const query = params.toString()
  const url = query ? `${base}${base.includes('?') ? '&' : '?'}${query}` : base

  const headers = new Headers()
  for (const h of config.headers) {
    if (h.enabled && h.key.trim()) headers.set(h.key.trim(), h.increment ? String(n) : substitute(h.value, n))
  }

  const hasBody = config.method !== 'GET' && config.method !== 'HEAD' && config.body.trim() !== ''
  return { url, method: config.method, headers, body: hasBody ? substitute(config.body, n) : undefined }
}

async function fetchPage(
  config: PaginationConfig,
  task: PageTask,
  proxyUrl: string | undefined,
  runSignal: AbortSignal,
): Promise<PageResult> {
  const startedAt = Date.now()
  const t0 = performance.now()
  const timeout = new AbortController()
  const timeoutId = window.setTimeout(() => timeout.abort(), config.timeoutMs)
  let url = ''

  try {
    const request = buildPageRequest(config, task.value)
    url = request.url
    const raw = await fetchThrough(
      request.url,
      request.method,
      request.headers,
      request.body,
      AbortSignal.any([runSignal, timeout.signal]),
      proxyUrl,
    )
    let json: unknown
    try {
      json = JSON.parse(raw.bodyText)
    } catch {
      json = undefined
    }
    const path = config.recordsPath.trim() || (json !== undefined ? detectRecordsPath(json) : null)
    const records = json !== undefined ? extractRecords(json, path) : undefined
    const truncated = raw.bodyText.length > MAX_BODY_CHARS

    return {
      ...task,
      url,
      ok: raw.status >= 200 && raw.status < 300,
      status: raw.status,
      statusText: raw.statusText,
      durationMs: performance.now() - t0,
      bodyText: truncated ? raw.bodyText.slice(0, MAX_BODY_CHARS) : raw.bodyText,
      truncated,
      json,
      recordCount: records?.length,
      startedAt,
    }
  } catch (err) {
    return {
      ...task,
      url,
      ok: false,
      durationMs: performance.now() - t0,
      bodyText: '',
      truncated: false,
      error: timeout.signal.aborted ? `Timed out after ${config.timeoutMs}ms` : describeFetchError(err),
      startedAt,
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      window.clearTimeout(id)
      resolve()
    }, { once: true })
  })
}

// Runs tasks with up to `config.concurrency` in flight. Stops handing out new
// tasks once a stop condition hits; requests already in flight still report.
export async function runPagination(
  config: PaginationConfig,
  tasks: PageTask[],
  proxyUrl: string | undefined,
  signal: AbortSignal,
  onPage: (result: PageResult) => void,
): Promise<{ stopReason?: string }> {
  let next = 0
  let stopReason: string | undefined
  const effectiveProxy = config.useProxy ? proxyUrl : undefined

  async function worker() {
    let first = true
    while (next < tasks.length) {
      if (!first && config.delayMs > 0) await sleep(config.delayMs, signal)
      first = false
      if (signal.aborted || stopReason || next >= tasks.length) return

      const task = tasks[next++]
      const result = await fetchPage(config, task, effectiveProxy, signal)
      if (signal.aborted) return
      onPage(result)

      if (config.stopOnError && !result.ok) {
        stopReason ??= `Stopped after ${task.value}: the request failed.`
      } else if (config.stopOnEmpty && result.ok && result.recordCount === 0) {
        stopReason ??= `Stopped after ${task.value}: it returned no records.`
      }
    }
  }

  const workers = Math.max(1, Math.min(Math.floor(config.concurrency) || 1, tasks.length))
  await Promise.all(Array.from({ length: workers }, () => worker()))
  return { stopReason }
}

export interface CombinedResult {
  path: string | null
  records: unknown[]
  pagesMerged: number
}

export function combinePages(pages: PageResult[], recordsPath: string): CombinedResult {
  const okJson = pages.filter((p) => p.ok && p.json !== undefined).sort((a, b) => a.index - b.index)
  const path = recordsPath.trim() || (okJson.map((p) => detectRecordsPath(p.json)).find((p) => p !== null) ?? null)
  const records: unknown[] = []
  let pagesMerged = 0
  if (path !== null) {
    for (const page of okJson) {
      const list = extractRecords(page.json, path)
      if (!list) continue
      pagesMerged += 1
      for (const record of list) records.push(record)
    }
  }
  return { path, records, pagesMerged }
}
