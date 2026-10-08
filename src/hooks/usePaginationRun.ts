import { useRef, useState } from 'react'
import { computeTasks, runPagination } from '../lib/paginationRunner'
import type { PageTask } from '../lib/paginationRunner'
import type { PageResult, PaginationConfig } from '../lib/paginationTypes'

export type PaginationRunStatus = 'idle' | 'running' | 'done' | 'cancelled'

function upsertByIndex(pages: PageResult[], result: PageResult): PageResult[] {
  const without = pages.filter((p) => p.index !== result.index)
  without.push(result)
  return without.sort((a, b) => a.index - b.index)
}

export function usePaginationRun() {
  const [status, setStatus] = useState<PaginationRunStatus>('idle')
  const [pages, setPages] = useState<PageResult[]>([])
  const [planned, setPlanned] = useState(0)
  const [stopReason, setStopReason] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [runConfig, setRunConfig] = useState<PaginationConfig | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  async function execute(config: PaginationConfig, tasks: PageTask[], proxyUrl: string | undefined, fresh: boolean) {
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('running')
    setStopReason(null)
    setRunError(null)
    if (fresh) {
      setPages([])
      setPlanned(tasks.length)
      setRunConfig(config)
    }

    const { stopReason: reason } = await runPagination(config, tasks, proxyUrl, controller.signal, (result) => {
      setPages((prev) => upsertByIndex(prev, result))
    })
    setStopReason(reason ?? null)
    setStatus(controller.signal.aborted ? 'cancelled' : 'done')
  }

  async function run(config: PaginationConfig, proxyUrl: string | undefined) {
    let tasks: PageTask[]
    try {
      tasks = computeTasks(config.start, config.end, config.step)
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err))
      return
    }
    await execute(structuredClone(config), tasks, proxyUrl, true)
  }

  // Re-sends only the pages that failed in the last run, using that run's config.
  async function retryFailed(proxyUrl: string | undefined) {
    if (!runConfig) return
    const tasks = pages.filter((p) => !p.ok).map((p) => ({ index: p.index, value: p.value }))
    if (tasks.length === 0) return
    await execute(runConfig, tasks, proxyUrl, false)
  }

  function cancel() {
    controllerRef.current?.abort()
  }

  function reset() {
    setStatus('idle')
    setPages([])
    setPlanned(0)
    setStopReason(null)
    setRunError(null)
    setRunConfig(null)
  }

  return { status, pages, planned, stopReason, runError, runConfig, run, retryFailed, cancel, reset }
}
