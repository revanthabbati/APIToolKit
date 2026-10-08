import { strToU8, zipSync } from 'fflate'
import { useMemo, useState } from 'react'
import type { PaginationRunStatus } from '../hooks/usePaginationRun'
import { downloadBlob, downloadText } from '../lib/download'
import { formatBytes, formatDuration, prettyBody, statusBadgeClass, statusLabel } from '../lib/format'
import { combinePages } from '../lib/paginationRunner'
import type { PageResult, PaginationConfig } from '../lib/paginationTypes'
import { PageDetail } from './PageDetail'

interface Props {
  status: PaginationRunStatus
  pages: PageResult[]
  planned: number
  stopReason: string | null
  runError: string | null
  runConfig: PaginationConfig | null
  onRetryFailed: () => void
}

const PREVIEW_CHARS = 300_000
type View = 'combined' | 'individual'

function safeName(name: string) {
  return name.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'endpoint'
}

export function PaginationResults({ status, pages, planned, stopReason, runError, runConfig, onRetryFailed }: Props) {
  const [view, setView] = useState<View>('combined')
  const [selected, setSelected] = useState<PageResult | null>(null)

  const combined = useMemo(() => combinePages(pages, runConfig?.recordsPath ?? ''), [pages, runConfig])
  const combinedJson = useMemo(() => {
    const data = combined.path !== null ? combined.records : pages.map((p) => p.json ?? p.bodyText)
    return JSON.stringify(data, null, 2)
  }, [combined, pages])

  if (runError) {
    return <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{runError}</div>
  }

  if (status === 'idle') {
    return (
      <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
        Configure the endpoint and range, then Run. Results from every request show up here — merged into one combined response, and individually.
      </p>
    )
  }

  const okCount = pages.filter((p) => p.ok).length
  const failedCount = pages.length - okCount
  const baseName = safeName(runConfig?.name ?? 'endpoint')

  function downloadZip() {
    const files: Record<string, Uint8Array> = {}
    for (const page of pages) files[`${baseName}_${page.value}.json`] = strToU8(prettyBody(page.bodyText) || '')
    downloadBlob(`${baseName}_pages.zip`, new Blob([zipSync(files)], { type: 'application/zip' }))
  }

  const tabClass = (v: View) =>
    `rounded-md px-3 py-1 text-sm font-medium ${
      view === v ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {status === 'running' ? 'Running…' : status === 'cancelled' ? 'Cancelled' : 'Done'}
            {runConfig && <span className="font-normal text-slate-400"> · {runConfig.name}</span>}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {pages.length} / {planned} requests · {okCount} ok{failedCount > 0 ? ` · ${failedCount} failed` : ''}
          </span>
        </div>
        {planned > 0 && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.round((pages.length / planned) * 100)}%` }} />
          </div>
        )}
        {stopReason && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{stopReason}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <button type="button" className={tabClass('combined')} onClick={() => setView('combined')}>
            Combined
          </button>
          <button type="button" className={tabClass('individual')} onClick={() => setView('individual')}>
            Individual ({pages.length})
          </button>
        </div>
        <div className="flex gap-1">
          {failedCount > 0 && status !== 'running' && (
            <button type="button" onClick={onRetryFailed} className="rounded-md px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20">
              Retry {failedCount} failed
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadText(`${baseName}_combined.json`, combinedJson)}
            disabled={pages.length === 0}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Download combined
          </button>
          <button
            type="button"
            onClick={downloadZip}
            disabled={pages.length === 0}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Download all pages (ZIP)
          </button>
        </div>
      </div>

      {view === 'combined' ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {combined.path !== null
              ? `${combined.records.length} records merged from ${combined.pagesMerged} page${combined.pagesMerged === 1 ? '' : 's'}, taken from ${
                  combined.path === '' ? 'the top-level array' : `"${combined.path}"`
                }.`
              : 'No list of records found in the responses — showing every response body in order instead. Set a records path to merge.'}
          </p>
          <pre className="max-h-[32rem] overflow-auto rounded-md bg-slate-50 p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {combinedJson.length > PREVIEW_CHARS
              ? `${combinedJson.slice(0, PREVIEW_CHARS)}\n… (preview truncated — download for the full result)`
              : combinedJson}
          </pre>
        </div>
      ) : (
        <div className="max-h-[32rem] overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-2.5 py-1.5 font-medium">#</th>
                <th className="px-2.5 py-1.5 font-medium">Value</th>
                <th className="px-2.5 py-1.5 font-medium">Status</th>
                <th className="px-2.5 py-1.5 font-medium">Records</th>
                <th className="px-2.5 py-1.5 font-medium">Duration</th>
                <th className="px-2.5 py-1.5 font-medium">Size</th>
                <th className="px-2.5 py-1.5 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.index}
                  onClick={() => setSelected(page)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400">{page.index + 1}</td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-700 dark:text-slate-300">{page.value}</td>
                  <td className="px-2.5 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${statusBadgeClass(page)}`}>{statusLabel(page)}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{page.recordCount ?? '—'}</td>
                  <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{formatDuration(page.durationMs)}</td>
                  <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300">{formatBytes(page.bodyText.length)}</td>
                  <td className="max-w-[14rem] truncate px-2.5 py-1.5 text-slate-500 dark:text-slate-400">{page.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <PageDetail page={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
