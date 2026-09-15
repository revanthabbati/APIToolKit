import { useEffect, useRef } from 'react'
import { executeRequest } from '../lib/requestRunner'
import type { RequestConfig, RequestResult } from '../lib/types'

interface Runtime {
  active: boolean
  attempt: number
  timerId?: number
  controller?: AbortController
}

interface SchedulerCallbacks {
  onResult: (jobId: string, result: RequestResult) => void
  onStatusChange: (jobId: string, status: 'running' | 'stopped' | 'completed') => void
  getProxyUrl: () => string | undefined
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
        if (runtime.timerId) window.clearTimeout(runtime.timerId)
        runtime.controller?.abort()
      }
    }
  }, [])

  function loop(config: RequestConfig) {
    const runtime = runtimes.current.get(config.id)
    if (!runtime || !runtime.active) return

    runtime.attempt += 1
    const controller = new AbortController()
    runtime.controller = controller

    executeRequest(config, controller.signal, runtime.attempt, callbacksRef.current.getProxyUrl()).then((result) => {
      const current = runtimes.current.get(config.id)
      if (!current || !current.active) return

      callbacksRef.current.onResult(config.id, result)

      if (config.repeatMode === 'count' && current.attempt >= config.repeatCount) {
        current.active = false
        callbacksRef.current.onStatusChange(config.id, 'completed')
        return
      }

      current.timerId = window.setTimeout(() => loop(config), config.delayMs)
    })
  }

  function start(config: RequestConfig) {
    const existing = runtimes.current.get(config.id)
    if (existing?.active) return
    runtimes.current.set(config.id, { active: true, attempt: 0 })
    callbacksRef.current.onStatusChange(config.id, 'running')
    loop(config)
  }

  function stop(jobId: string) {
    const runtime = runtimes.current.get(jobId)
    if (!runtime) return
    runtime.active = false
    if (runtime.timerId) window.clearTimeout(runtime.timerId)
    runtime.controller?.abort()
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
