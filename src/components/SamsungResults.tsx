import { zipSync, strToU8 } from 'fflate'
import { useState } from 'react'
import type { SamsungRunStatus } from '../hooks/useSamsungRun'
import type { SamsungOrderResult, SamsungRunSummary } from '../lib/samsungTypes'
import { SamsungPayloadDetail } from './SamsungPayloadDetail'

interface Props {
  status: SamsungRunStatus
  progress: { completed: number; total: number }
  liveOrders: SamsungOrderResult[]
  summary: SamsungRunSummary | null
  runError: string | null
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadCombined(orders: SamsungOrderResult[]) {
  const combined = orders.map((o) => o.payload)
  downloadBlob('samsung-import-payloads.json', new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' }))
}

function downloadZip(orders: SamsungOrderResult[]) {
  const files: Record<string, Uint8Array> = {}
  const seen = new Map<string, number>()
  for (const order of orders) {
    const base = order.doNo || order.orderNumber || 'order'
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const name = count === 0 ? `import_${base}.json` : `import_${base}_${count}.json`
    files[name] = strToU8(JSON.stringify(order.payload, null, 2))
  }
  const zipped = zipSync(files)
  downloadBlob('samsung-import-payloads.zip', new Blob([zipped], { type: 'application/zip' }))
}

const STATUS_STYLES: Record<SamsungOrderResult['status'], string> = {
  built: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'export-failed': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
}

const STATUS_LABELS: Record<SamsungOrderResult['status'], string> = {
  built: 'Built',
  'export-failed': 'Built (export failed)',
}

export function SamsungResults({ status, progress, liveOrders, summary, runError }: Props) {
  const [selected, setSelected] = useState<SamsungOrderResult | null>(null)

  if (status === 'idle') {
    return (
      <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
        Fill in the form and click Run to fetch orders and build import payloads.
      </p>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{runError}</div>
    )
  }

  const failedCount = liveOrders.filter((o) => o.status === 'export-failed').length

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {status === 'running' && 'Running…'}
            {status === 'done' && 'Done'}
            {status === 'cancelled' && 'Cancelled'}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {progress.total > 0 ? `${progress.completed} / ${progress.total} orders` : summary?.fetchMessage}
          </span>
        </div>
        {progress.total > 0 && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
            />
          </div>
        )}
        {failedCount > 0 && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            {failedCount} order{failedCount === 1 ? '' : 's'} built from fetch data only — export details couldn't be
            fetched for {failedCount === 1 ? 'it' : 'them'}.
          </p>
        )}
      </div>

      {liveOrders.length > 0 && (
        <>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => downloadCombined(liveOrders)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Download combined JSON
            </button>
            <button
              type="button"
              onClick={() => downloadZip(liveOrders)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Download ZIP (one file per order)
            </button>
          </div>

          <div className="max-h-[28rem] overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-2.5 py-1.5 font-medium">DO No</th>
                  <th className="px-2.5 py-1.5 font-medium">Customer</th>
                  <th className="px-2.5 py-1.5 font-medium">Items</th>
                  <th className="px-2.5 py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {liveOrders.map((order) => (
                  <tr
                    key={order.orderNumber}
                    onClick={() => setSelected(order)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-2.5 py-1.5 font-mono text-slate-700 dark:text-slate-300">{order.doNo || '—'}</td>
                    <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{order.customerName || '—'}</td>
                    <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{order.itemCount}</td>
                    <td className="px-2.5 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && <SamsungPayloadDetail order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
