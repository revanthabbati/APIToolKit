import { useState } from 'react'
import type { FormEvent } from 'react'
import { applyCurlToConfig } from '../lib/paginationFactory'
import { buildPageRequest, computeTasks, MAX_ITERATIONS, usesIteration } from '../lib/paginationRunner'
import type { PaginationConfig } from '../lib/paginationTypes'
import { extractQueryParams, mergeQueryParams } from '../lib/queryParams'
import { HTTP_METHODS } from '../lib/types'
import type { HttpMethod } from '../lib/types'
import { KeyValueEditor } from './KeyValueEditor'

interface Props {
  config: PaginationConfig
  onChange: (config: PaginationConfig) => void
  proxyConfigured: boolean
  running: boolean
  onRun: () => void
  onCancel: () => void
}

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'
const hintClass = 'mt-1 text-xs text-slate-400 dark:text-slate-500'

// Keeps its own text so partially-typed values ("", "-") don't get clobbered,
// and resyncs when the value is changed from outside (e.g. a cURL import).
function NumberField({
  value,
  onCommit,
  disabled,
  min,
}: {
  value: number
  onCommit: (n: number) => void
  disabled?: boolean
  min?: number
}) {
  const [text, setText] = useState(String(value))
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setText(String(value))
  }

  return (
    <input
      type="number"
      value={text}
      min={min}
      disabled={disabled}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value)
        if (e.target.value.trim() !== '' && Number.isFinite(n)) {
          setSynced(n)
          onCommit(n)
        }
      }}
      className={`mt-1 ${inputClass}`}
    />
  )
}

export function PaginationEditor({ config, onChange, proxyConfigured, running, onRun, onCancel }: Props) {
  const [curlText, setCurlText] = useState('')
  const [curlOpen, setCurlOpen] = useState(config.baseUrl === '')
  const [curlError, setCurlError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function patch(fields: Partial<PaginationConfig>) {
    onChange({ ...config, ...fields })
  }

  function importCurl() {
    try {
      onChange(applyCurlToConfig(config, curlText))
      setCurlError(null)
      setCurlText('')
      setCurlOpen(false)
    } catch (err) {
      setCurlError(err instanceof Error ? err.message : String(err))
    }
  }

  function handleUrlBlur(value: string) {
    const extracted = extractQueryParams(value)
    if (!extracted) return
    patch({ baseUrl: extracted.base, queryParams: mergeQueryParams(config.queryParams, extracted.params) })
  }

  let plannedCount: number | null = null
  let rangeError: string | null = null
  try {
    plannedCount = computeTasks(config.start, config.end, config.step).length
  } catch (err) {
    rangeError = err instanceof Error ? err.message : String(err)
  }

  const iterating = usesIteration(config)
  const preview = config.baseUrl.trim() ? buildPreview(config) : null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!config.baseUrl.trim()) {
      setError('Add a URL (or import a cURL command) first.')
      return
    }
    if (rangeError) {
      setError(rangeError)
      return
    }
    if (!iterating) {
      setError('Mark at least one query parameter or header as "Iterate", or use {{n}} in the URL or body — otherwise every request would be identical.')
      return
    }
    setError(null)
    onRun()
  }

  const showBody = config.method !== 'GET' && config.method !== 'HEAD'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Endpoint name</label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => patch({ name: e.target.value })}
          disabled={running}
          className={`mt-1 ${inputClass}`}
        />
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setCurlOpen((v) => !v)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          {curlOpen ? '− Hide cURL import' : '+ Import from cURL or URL'}
        </button>
        {curlOpen && (
          <div className="mt-2 space-y-2">
            <textarea
              value={curlText}
              onChange={(e) => setCurlText(e.target.value)}
              disabled={running}
              rows={5}
              spellCheck={false}
              placeholder={"curl --location 'https://api.example.com/v1/items?per_page=25&page_no=1' \\\n--header 'accept: application/json'"}
              className={`font-mono ${inputClass}`}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Replaces the method, URL, params, headers and body below. Page-like params (page, page_no, …) are marked to iterate automatically.
              </p>
              <button
                type="button"
                onClick={importCurl}
                disabled={running || curlText.trim() === ''}
                className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Import
              </button>
            </div>
            {curlError && <p className="text-xs text-red-600 dark:text-red-400">{curlError}</p>}
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Request</label>
        <div className="mt-1 flex gap-2">
          <select
            value={config.method}
            onChange={(e) => patch({ method: e.target.value as HttpMethod })}
            disabled={running}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            onBlur={(e) => handleUrlBlur(e.target.value)}
            disabled={running}
            placeholder="https://api.example.com/v1/items"
            className={`min-w-0 flex-1 font-mono ${inputClass}`}
          />
        </div>
        <p className={hintClass}>
          Use <code>{'{{n}}'}</code> anywhere in the URL path or body for path-style paging, e.g. <code>/pages/{'{{n}}'}</code>.
        </p>
      </div>

      <div>
        <label className={labelClass}>Query parameters</label>
        <div className="mt-1">
          <KeyValueEditor
            items={config.queryParams}
            onChange={(queryParams) => patch({ queryParams })}
            keyPlaceholder="Param"
            valuePlaceholder="Value"
            disabled={running}
            showIncrement
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Headers</label>
        <div className="mt-1">
          <KeyValueEditor
            items={config.headers}
            onChange={(headers) => patch({ headers })}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
            disabled={running}
            showIncrement
          />
        </div>
      </div>

      {showBody && (
        <div>
          <label className={labelClass}>Body</label>
          <textarea
            value={config.body}
            onChange={(e) => patch({ body: e.target.value })}
            disabled={running}
            rows={5}
            spellCheck={false}
            placeholder={'{ "page": {{n}} }'}
            className={`mt-1 font-mono ${inputClass}`}
          />
        </div>
      )}

      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Iteration range</div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Start</label>
            <NumberField value={config.start} onCommit={(start) => patch({ start })} disabled={running} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">End</label>
            <NumberField value={config.end} onCommit={(end) => patch({ end })} disabled={running} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Step</label>
            <NumberField value={config.step} onCommit={(step) => patch({ step })} disabled={running} min={1} />
          </div>
        </div>
        <p className={hintClass}>
          {rangeError
            ? rangeError
            : `${plannedCount} request${plannedCount === 1 ? '' : 's'} (max ${MAX_ITERATIONS} per run). Use a step like 25 for offset-style paging.`}
        </p>
        {preview && (
          <div className="mt-2 space-y-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <div className="truncate" title={preview.first}>
              first → {preview.first}
            </div>
            {preview.last && (
              <div className="truncate" title={preview.last}>
                last&nbsp; → {preview.last}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Concurrency</label>
          <NumberField
            value={config.concurrency}
            onCommit={(n) => patch({ concurrency: Math.min(10, Math.max(1, Math.round(n))) })}
            disabled={running}
            min={1}
          />
        </div>
        <div>
          <label className={labelClass}>Delay (ms)</label>
          <NumberField value={config.delayMs} onCommit={(n) => patch({ delayMs: Math.max(0, Math.round(n)) })} disabled={running} min={0} />
        </div>
        <div>
          <label className={labelClass}>Timeout (s)</label>
          <NumberField
            value={config.timeoutMs / 1000}
            onCommit={(n) => patch({ timeoutMs: Math.max(1, n) * 1000 })}
            disabled={running}
            min={1}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-slate-400 dark:text-slate-500">
        Concurrency 1 sends pages one after another; up to 10 at once. Delay is the wait between requests on each lane.
      </p>

      <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.stopOnEmpty}
            onChange={(e) => patch({ stopOnEmpty: e.target.checked })}
            disabled={running}
            className="accent-indigo-600"
          />
          Stop early when a page returns no records
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.stopOnError}
            onChange={(e) => patch({ stopOnError: e.target.checked })}
            disabled={running}
            className="accent-indigo-600"
          />
          Stop on the first failed request
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.useProxy}
            onChange={(e) => patch({ useProxy: e.target.checked })}
            disabled={!proxyConfigured || running}
            className="accent-indigo-600"
          />
          Route through proxy {!proxyConfigured && <span className="text-xs text-slate-400">(set a proxy URL in Settings first)</span>}
        </label>
      </div>

      <div>
        <label className={labelClass}>Records path (optional)</label>
        <input
          type="text"
          value={config.recordsPath}
          onChange={(e) => patch({ recordsPath: e.target.value })}
          disabled={running}
          placeholder="auto-detect — e.g. data.items or eld_devices"
          className={`mt-1 font-mono ${inputClass}`}
        />
        <p className={hintClass}>Where the list of records lives in each response, used to merge pages and detect empty ones.</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
        {running ? (
          <button type="button" onClick={onCancel} className="rounded-md bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-400">
            Cancel run
          </button>
        ) : (
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Run {plannedCount ? `${plannedCount} request${plannedCount === 1 ? '' : 's'}` : ''}
          </button>
        )}
      </div>
    </form>
  )
}

function buildPreview(config: PaginationConfig): { first: string; last: string | null } | null {
  try {
    const tasks = computeTasks(config.start, config.end, config.step)
    const first = buildPageRequest(config, tasks[0].value).url
    const last = tasks.length > 1 ? buildPageRequest(config, tasks[tasks.length - 1].value).url : null
    return { first, last }
  } catch {
    return null
  }
}
