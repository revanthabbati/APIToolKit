import { useState } from 'react'
import type { FormEvent } from 'react'
import { createEmptyConfig, MIN_DELAY_MS } from '../lib/factory'
import { HTTP_METHODS } from '../lib/types'
import type { BodyType, HttpMethod, RequestConfig } from '../lib/types'
import { KeyValueEditor } from './KeyValueEditor'

interface Props {
  initial?: RequestConfig
  onSubmit: (config: RequestConfig) => void
  onCancel: () => void
}

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

export function JobForm({ initial, onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<RequestConfig>(() => initial ?? createEmptyConfig())
  const [delaySecondsInput, setDelaySecondsInput] = useState(() => String(draft.delayMs / 1000))
  const [timeoutSecondsInput, setTimeoutSecondsInput] = useState(() => String(draft.timeoutMs / 1000))
  const [repeatCountInput, setRepeatCountInput] = useState(() => String(draft.repeatCount))
  const [error, setError] = useState<string | null>(null)

  const showBody = draft.method !== 'GET' && draft.method !== 'HEAD'

  function patch(fields: Partial<RequestConfig>) {
    setDraft((prev) => ({ ...prev, ...fields }))
  }

  function handleDelayChange(value: string) {
    setDelaySecondsInput(value)
    const n = Number(value)
    if (!Number.isNaN(n) && n >= 0) patch({ delayMs: Math.round(n * 1000) })
  }

  function handleTimeoutChange(value: string) {
    setTimeoutSecondsInput(value)
    const n = Number(value)
    if (!Number.isNaN(n) && n > 0) patch({ timeoutMs: Math.round(n * 1000) })
  }

  function handleRepeatCountChange(value: string) {
    setRepeatCountInput(value)
    const n = Number(value)
    if (!Number.isNaN(n) && n >= 1) patch({ repeatCount: Math.round(n) })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.url.trim()) {
      setError('URL is required.')
      return
    }
    if (draft.repeatMode === 'count' && draft.repeatCount < 1) {
      setError('Repeat count must be at least 1.')
      return
    }
    const name = draft.name.trim() || draft.url.trim()
    onSubmit({ ...draft, name, delayMs: Math.max(MIN_DELAY_MS, draft.delayMs) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="My API check"
          className={`mt-1 ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>Request</label>
        <div className="mt-1 flex gap-2">
          <select
            value={draft.method}
            onChange={(e) => patch({ method: e.target.value as HttpMethod })}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={draft.url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://api.example.com/resource"
            className={`min-w-0 flex-1 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Query parameters</label>
        <div className="mt-1">
          <KeyValueEditor items={draft.queryParams} onChange={(queryParams) => patch({ queryParams })} keyPlaceholder="Param" valuePlaceholder="Value" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Headers</label>
        <div className="mt-1">
          <KeyValueEditor items={draft.headers} onChange={(headers) => patch({ headers })} keyPlaceholder="Header" valuePlaceholder="Value" />
        </div>
      </div>

      {showBody && (
        <div>
          <label className={labelClass}>Body</label>
          <div className="mt-1 flex gap-4 text-sm text-slate-700 dark:text-slate-300">
            {(['none', 'json', 'text'] as BodyType[]).map((t) => (
              <label key={t} className="flex items-center gap-1.5">
                <input type="radio" name="bodyType" checked={draft.bodyType === t} onChange={() => patch({ bodyType: t })} className="accent-indigo-600" />
                {t === 'none' ? 'No body' : t === 'json' ? 'JSON' : 'Raw text'}
              </label>
            ))}
          </div>
          {draft.bodyType !== 'none' && (
            <textarea
              value={draft.body}
              onChange={(e) => patch({ body: e.target.value })}
              rows={6}
              placeholder={draft.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body'}
              className={`mt-2 font-mono ${inputClass}`}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Delay between requests (seconds)</label>
          <input
            type="number"
            min={MIN_DELAY_MS / 1000}
            step={0.1}
            value={delaySecondsInput}
            onChange={(e) => handleDelayChange(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className={labelClass}>Timeout (seconds)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={timeoutSecondsInput}
            onChange={(e) => handleTimeoutChange(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Repeat</label>
        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={draft.repeatMode === 'infinite'} onChange={() => patch({ repeatMode: 'infinite' })} className="accent-indigo-600" />
            Until stopped
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={draft.repeatMode === 'count'} onChange={() => patch({ repeatMode: 'count' })} className="accent-indigo-600" />
            Fixed number of times
          </label>
          {draft.repeatMode === 'count' && (
            <input
              type="number"
              min={1}
              step={1}
              value={repeatCountInput}
              onChange={(e) => handleRepeatCountChange(e.target.value)}
              className={`w-24 ${inputClass}`}
            />
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          {initial ? 'Save changes' : 'Create job'}
        </button>
      </div>
    </form>
  )
}
