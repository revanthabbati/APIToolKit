import { useEffect, useState } from 'react'
import { useSamsungRun } from '../hooks/useSamsungRun'
import { createDefaultSamsungConfig } from '../lib/samsungFactory'
import { loadSamsungConfig, saveSamsungConfig } from '../lib/storage'
import type { SamsungRunConfig } from '../lib/samsungTypes'
import { SamsungForm } from './SamsungForm'
import { SamsungResults } from './SamsungResults'

interface Props {
  proxyUrl: string
}

export function SamsungModule({ proxyUrl }: Props) {
  const [config, setConfig] = useState<SamsungRunConfig>(() => loadSamsungConfig() ?? createDefaultSamsungConfig())
  const { status, progress, liveOrders, summary, runError, run, cancel } = useSamsungRun()

  useEffect(() => {
    saveSamsungConfig(config)
  }, [config])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SamsungForm
          config={config}
          onChange={setConfig}
          proxyConfigured={proxyUrl.trim() !== ''}
          running={status === 'running'}
          onRun={() => run(config, proxyUrl || undefined)}
          onCancel={cancel}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SamsungResults status={status} progress={progress} liveOrders={liveOrders} summary={summary} runError={runError} />
      </div>
    </div>
  )
}
