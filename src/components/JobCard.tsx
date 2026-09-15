import { useState } from 'react'
import type { ReactNode } from 'react'
import { formatDuration, formatTimestamp, statusBadgeClass, statusLabel } from '../lib/format'
import type { Job } from '../lib/types'
import { HistoryTable } from './HistoryTable'
import { Sparkline } from './Sparkline'

interface Props {
  job: Job
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  onRunOnce: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClearHistory: () => void
}

const STATUS_STYLES: Record<Job['status'], string> = {
  idle: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  running: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  stopped: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
}

const METHOD_STYLES: Record<string, string> = {
  GET: 'text-sky-600 dark:text-sky-400',
  POST: 'text-emerald-600 dark:text-emerald-400',
  PUT: 'text-amber-600 dark:text-amber-400',
  PATCH: 'text-amber-600 dark:text-amber-400',
  DELETE: 'text-red-600 dark:text-red-400',
  HEAD: 'text-slate-600 dark:text-slate-400',
  OPTIONS: 'text-slate-600 dark:text-slate-400',
}

function IconButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-300"
    >
      {children}
    </button>
  )
}

export function JobCard({ job, isRunning, onStart, onStop, onRunOnce, onEdit, onDuplicate, onDelete, onClearHistory }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { config, results } = job

  const total = results.length
  const successCount = results.filter((r) => r.ok).length
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : null
  const avgDuration = total > 0 ? results.reduce((sum, r) => sum + r.durationMs, 0) / total : null
  const recent = [...results].slice(0, 30).reverse()
  const last = results[0]
  const displayStatus = isRunning ? 'running' : job.status

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold ${METHOD_STYLES[config.method] ?? ''}`}>{config.method}</span>
              <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">{config.name}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[displayStatus]}`}>
                {isRunning && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
                {displayStatus}
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{config.url}</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Every {(config.delayMs / 1000).toFixed(config.delayMs % 1000 === 0 ? 0 : 1)}s
              {config.repeatMode === 'count' ? ` · up to ${config.repeatCount} runs` : ' · until stopped'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Start
              </button>
            )}
            <IconButton title="Run once" onClick={onRunOnce} disabled={isRunning}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-11.5a.75.75 0 0 0-1.264-.546l-2.25 2.5a.75.75 0 1 0 1.114 1.006L8 8.148V13a.75.75 0 0 0 1.5 0V6.5Z" clipRule="evenodd" />
              </svg>
            </IconButton>
            <IconButton title="Edit" onClick={onEdit} disabled={isRunning}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.966.784-1.75 1.75-1.75H10A.75.75 0 0 0 10 2.5H5.25A3.25 3.25 0 0 0 2 5.75v9A3.25 3.25 0 0 0 5.25 18h9a3.25 3.25 0 0 0 3.25-3.25V10a.75.75 0 0 0-1.5 0v4.75c0 .966-.784 1.75-1.75 1.75h-9c-.966 0-1.75-.784-1.75-1.75v-9Z" />
              </svg>
            </IconButton>
            <IconButton title="Duplicate" onClick={onDuplicate}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h8a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L10.44 6.439A1.5 1.5 0 0 0 9.378 6H4.5Z" />
              </svg>
            </IconButton>
            <IconButton
              title="Delete"
              onClick={() => {
                if (window.confirm(`Delete "${config.name}"? Its history will be lost.`)) onDelete()
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-red-400 hover:text-red-600">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
              </svg>
            </IconButton>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400 dark:text-slate-500">Runs</dt>
              <dd className="font-semibold text-slate-700 dark:text-slate-300">{job.totalRuns}</dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">Success rate</dt>
              <dd className="font-semibold text-slate-700 dark:text-slate-300">{successRate === null ? '—' : `${successRate}%`}</dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">Avg latency</dt>
              <dd className="font-semibold text-slate-700 dark:text-slate-300">{avgDuration === null ? '—' : formatDuration(avgDuration)}</dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">Last run</dt>
              <dd className="font-semibold text-slate-700 dark:text-slate-300">{last ? formatTimestamp(last.startedAt) : '—'}</dd>
            </div>
            {last && (
              <div>
                <dt className="text-slate-400 dark:text-slate-500">Last status</dt>
                <dd>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(last)}`}>{statusLabel(last)}</span>
                </dd>
              </div>
            )}
          </dl>
          {recent.length > 1 && (
            <div className="text-slate-400">
              <Sparkline values={recent.map((r) => r.durationMs)} oks={recent.map((r) => r.ok)} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          {expanded ? 'Hide history' : `Show history (${total})`}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <HistoryTable results={results} onClear={onClearHistory} />
        </div>
      )}
    </div>
  )
}
