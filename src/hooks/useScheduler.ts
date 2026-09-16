import { useEffect, useRef } from 'react'
import { executeRequest } from '../lib/requestRunner'
import type { RequestConfig, RequestResult } from '../lib/types'

interface Runtime {
  active: boolean
  attempt: number
  timerId?: number
  intervalId?: number
  controllers: Set<AbortController>
}

interface SchedulerCallbacks {
  onResult: (jobId: string, result: RequestResult) => void
  onStatusChange: (jobId: string, status: 'running' | 'stopped' | 'completed') => void
  getProxyUrl: () => string | undefined
}

function clearRuntimeTimers(runtime: Runtime) {
  if (runtime.timerId) window.clearTimeout(runtime.timerId)
  if (runtime.intervalId) window.clearInterval(runtime.intervalId)
}

export function useScheduler({ onResult, onStatusChange, getProxyUrl }: SchedulerCallbacks) {
  const runtimes = useRef<Map<string, Runtime>>(new Map())
  const callbacksRef = useRef({ onResult, onStatusChange, getProxyUrl })
  useEffect(() => {
    callbacksRef.current = { onResult, onStatusChange, getProxyUrl }
  })

  useEffect(() => {
    const map = runtimes.current
    return () => {
      for (const runtime of map.values()) {
        runtime.active = false
        clearRuntimeTimers(runtime)
        for (const controller of runtime.controllers) controller.abort()
      }
    }
  }, [])

  // Reached the attempt cap and every in-flight request for this job has settled.
  function maybeComplete(jobId: string, config: RequestConfig, runtime: Runtime) {
    if (config.repeatMode === 'count' && runtime.attempt >= config.repeatCount && runtime.controllers.size === 0) {
      runtime.active = false
      clearRuntimeTimers(runtime)
      callbacksRef.current.onStatusChange(jobId, 'completed')
    }
  }

  // Default mode: wait for the response, then wait the delay, then fire the next one.
  // Never more than one request in flight for a given job.
  function loop(config: RequestConfig) {
    const runtime = runtimes.current.get(config.id)
    if (!runtime || !runtime.active) return
    if (config.repeatMode === 'count' && runtime.attempt >= config.repeatCount) return

    runtime.attempt += 1
    const attempt = runtime.attempt
    const controller = new AbortController()
    runtime.controllers.add(controller)

    executeRequest(config, controller.signal, attempt, callbacksRef.current.getProxyUrl()).then((result) => {
      const current = runtimes.current.get(config.id)
      if (!current) return
      current.controllers.delete(controller)
      if (!current.active) return

      callbacksRef.current.onResult(config.id, result)
      maybeComplete(config.id, config, current)
      if (!current.active) return

      current.timerId = window.setTimeout(() => loop(config), config.delayMs)
    })
  }

  // Overlap mode: fires on a fixed interval regardless of whether earlier
  // attempts for this job have responded yet, so several can be in flight at once.
  function fireOverlap(config: RequestConfig) {
    const runtime = runtimes.current.get(config.id)
    if (!runtime || !runtime.active) return
    if (config.repeatMode === 'count' && runtime.attempt >= config.repeatCount) return

    runtime.attempt += 1
    const attempt = runtime.attempt
    const controller = new AbortController()
    runtime.controllers.add(controller)

    executeRequest(config, controller.signal, attempt, callbacksRef.current.getProxyUrl()).then((result) => {
      const current = runtimes.current.get(config.id)
      if (!current) return
      current.controllers.delete(controller)
      if (!current.active) return

      callbacksRef.current.onResult(config.id, result)
      maybeComplete(config.id, config, current)
    })
  }

  function start(config: RequestConfig) {
    const existing = runtimes.current.get(config.id)
    if (existing?.active) return
    const runtime: Runtime = { active: true, attempt: 0, controllers: new Set() }
    runtimes.current.set(config.id, runtime)
    callbacksRef.current.onStatusChange(config.id, 'running')

    if (config.overlapRequests) {
      fireOverlap(config)
      runtime.intervalId = window.setInterval(() => fireOverlap(config), config.delayMs)
    } else {
      loop(config)
    }
  }

  function stop(jobId: string) {
    const runtime = runtimes.current.get(jobId)
    if (!runtime) return
    runtime.active = false
    clearRuntimeTimers(runtime)
    for (const controller of runtime.controllers) controller.abort()
    runtime.controllers.clear()
    callbacksRef.current.onStatusChange(jobId, 'stopped')
  }

  async function runOnce(config: RequestConfig) {
    const controller = new AbortController()
    const result = await executeRequest(config, controller.signal, -1, callbacksRef.current.getProxyUrl())
    callbacksRef.current.onResult(config.id, result)
  }

  function isRunning(jobId: string): boolean {
    return runtimes.current.get(jobId)?.active ?? false
  }

  return { start, stop, runOnce, isRunning }
}
