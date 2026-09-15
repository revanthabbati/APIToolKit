import { useMemo, useState } from 'react'
import { formatBytes, formatDuration, formatTimestamp, statusBadgeClass, statusLabel } from '../lib/format'
import type { RequestResult } from '../lib/types'
import { HistoryDetail } from './HistoryDetail'

interface Props {
  results: RequestResult[]
  onClear: () => void
}

function toCsv(results: RequestResult[]): string {
  const header = ['attempt', 'startedAt', 'durationMs', 'status', 'ok', 'error', 'url']
  const rows = results.map((r) => [
    r.attempt,
    new Date(r.startedAt).toISOString(),
    Math.round(r.durationMs),
    r.status ?? '',
    r.ok,
    (r.error ?? '').replace(/[\r\n,]+/g, ' '),
    r.requestUrl,
  ])
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function HistoryTable({ results, onClear }: Props) {
  const [search, setSearch] = useState('')
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [selected, setSelected] = useState<RequestResult | null>(null)

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (errorsOnly && r.ok) return false
      if (!search.trim()) return true
      const needle = search.toLowerCase()
      return (
        r.requestUrl.toLowerCase().includes(needle) ||
        String(r.status ?? '').includes(needle) ||
        (r.error ?? '').toLowerCase().includes(needle)
      )
    })
  }, [results, search, errorsOnly])

  if (results.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No requests captured yet.</p>
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history…"
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} className="accent-indigo-600" />
          Errors only
        </label>
        <button
          type="button"
          onClick={() => download('history.json', JSON.stringify(results, null, 2), 'application/json')}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => download('history.csv', toCsv(results), 'text/csv')}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Clear all captured history for this job? This cannot be undone.')) onClear()
          }}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Clear
        </button>
      </div>

      <div className="max-h-80 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-2.5 py-1.5 font-medium">#</th>
              <th className="px-2.5 py-1.5 font-medium">Time</th>
              <th className="px-2.5 py-1.5 font-medium">Status</th>
              <th className="px-2.5 py-1.5 font-medium">Duration</th>
              <th className="px-2.5 py-1.5 font-medium">Size</th>
              <th className="px-2.5 py-1.5 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400">{r.attempt >= 0 ? r.attempt : '—'}</td>
                <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{formatTimestamp(r.startedAt)}</td>
                <td className="px-2.5 py-1.5">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${statusBadgeClass(r)}`}>{statusLabel(r)}</span>
                </td>
                <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{formatDuration(r.durationMs)}</td>
                <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{formatBytes(r.responseSize)}</td>
                <td className="max-w-[16rem] truncate px-2.5 py-1.5 text-slate-500 dark:text-slate-400">{r.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <HistoryDetail result={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
