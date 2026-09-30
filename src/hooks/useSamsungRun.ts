import { useRef, useState } from 'react'
import { describeFetchError } from '../lib/fetchThrough'
import { runSamsungImport } from '../lib/samsungApi'
import type { SamsungOrderResult, SamsungRunConfig, SamsungRunSummary } from '../lib/samsungTypes'

export type SamsungRunStatus = 'idle' | 'running' | 'done' | 'cancelled' | 'error'

export function useSamsungRun() {
  const [status, setStatus] = useState<SamsungRunStatus>('idle')
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [liveOrders, setLiveOrders] = useState<SamsungOrderResult[]>([])
  const [summary, setSummary] = useState<SamsungRunSummary | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  async function run(config: SamsungRunConfig, proxyUrl: string | undefined) {
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('running')
    setProgress({ completed: 0, total: 0 })
    setLiveOrders([])
    setSummary(null)
    setRunError(null)

    try {
      const result = await runSamsungImport(config, proxyUrl, controller.signal, {
        onOrderSettled: (order, completed, total) => {
          setProgress({ completed, total })
          setLiveOrders((prev) => [...prev, order])
        },
      })
      setSummary(result)
      setStatus(controller.signal.aborted ? 'cancelled' : 'done')
    } catch (err) {
      if (controller.signal.aborted) {
        setStatus('cancelled')
        return
      }
      setRunError(describeFetchError(err))
      setStatus('error')
    }
  }

  function cancel() {
    controllerRef.current?.abort()
  }

  return { status, progress, liveOrders, summary, runError, run, cancel }
}
