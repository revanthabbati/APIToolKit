import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { formatDispatchTrackTimestamp } from '../lib/samsungFactory'
import type { SamsungRunConfig } from '../lib/samsungTypes'

interface Props {
  config: SamsungRunConfig
  onChange: (config: SamsungRunConfig) => void
  proxyConfigured: boolean
  running: boolean
  onRun: () => void
  onCancel: () => void
}

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

export function SamsungForm({ config, onChange, proxyConfigured, running, onRun, onCancel }: Props) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function patch(fields: Partial<SamsungRunConfig>) {
    onChange({ ...config, ...fields })
  }

  function patchOverrides(fields: Partial<SamsungRunConfig['overrides']>) {
    onChange({ ...config, overrides: { ...config.overrides, ...fields } })
  }

  function handleTemplateFile(file: File) {
    file.text().then((text) => patch({ templateText: text }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!config.code.trim() || !config.serviceRouteId.trim() || !config.timeStamp.trim() || !config.apiKey.trim()) {
      setError('Code, route ID, timestamp, and API key are all required.')
      return
    }
    try {
      JSON.parse(config.templateText)
    } catch {
      setError('Import template is not valid JSON.')
      return
    }
    setError(null)
    onRun()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Code</label>
          <input
            type="text"
            value={config.code}
            onChange={(e) => patch({ code: e.target.value })}
            disabled={running}
            placeholder="pulsesea"
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className={labelClass}>Service route ID</label>
          <input
            type="text"
            value={config.serviceRouteId}
            onChange={(e) => patch({ serviceRouteId: e.target.value })}
            disabled={running}
            placeholder="615311"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Timestamp</label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={config.timeStamp}
            onChange={(e) => patch({ timeStamp: e.target.value })}
            disabled={running}
            placeholder="2026-09-02T19:36-0400"
            className={`min-w-0 flex-1 font-mono ${inputClass}`}
          />
          <button
            type="button"
            onClick={() => patch({ timeStamp: formatDispatchTrackTimestamp(new Date()) })}
            disabled={running}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Use current time
          </button>
        </div>
      </div>

      <div>
        <label className={labelClass}>API key</label>
        <div className="mt-1 flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => patch({ apiKey: e.target.value })}
            disabled={running}
            autoComplete="off"
            className={`min-w-0 flex-1 font-mono ${inputClass}`}
          />
          <button
            type="button"
            onClick={() => setShowApiKey((v) => !v)}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Kept in this browser only. Never shown in the run log below, only used to call the export API.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelClass}>Import template</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={running}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-60 dark:text-indigo-400"
            >
              Upload JSON…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleTemplateFile(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>
        <textarea
          value={config.templateText}
          onChange={(e) => patch({ templateText: e.target.value })}
          disabled={running}
          rows={10}
          spellCheck={false}
          className={`mt-1 font-mono ${inputClass}`}
        />
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Everything except <code>doItemList</code> is kept as written, for every order in this run.
        </p>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={config.carryOrderFields}
            onChange={(e) => patch({ carryOrderFields: e.target.checked })}
            disabled={running}
            className="accent-indigo-600"
          />
          Carry order fields (doNo, customerCd) from the fetched order
        </label>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Off by default — payloads keep the template's <code>doNo</code>. When on, <code>doNo</code> comes from the
          fetched order's <code>do_no</code>, and <code>customerCd</code> falls back to it only if the export API
          didn't provide one.
        </p>
      </div>

      <div>
        <label className={labelClass}>Overrides applied to every order in this run (optional)</label>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <input
            type="text"
            value={config.overrides.firstName}
            onChange={(e) => patchOverrides({ firstName: e.target.value })}
            disabled={running}
            placeholder="First name"
            className={inputClass}
          />
          <input
            type="text"
            value={config.overrides.lastName}
            onChange={(e) => patchOverrides({ lastName: e.target.value })}
            disabled={running}
            placeholder="Last name"
            className={inputClass}
          />
          <input
            type="text"
            value={config.overrides.rdd}
            onChange={(e) => patchOverrides({ rdd: e.target.value })}
            disabled={running}
            placeholder="RDD (YYYYMMDD)"
            className={`font-mono ${inputClass}`}
          />
          <input
            type="text"
            value={config.overrides.eta}
            onChange={(e) => patchOverrides({ eta: e.target.value })}
            disabled={running}
            placeholder="ETA (YYYYMMDD)"
            className={`font-mono ${inputClass}`}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Blank fields are left as whatever the export API (or template) already provided — these apply to the whole
          run, not per order.
        </p>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={config.useProxy}
            onChange={(e) => patch({ useProxy: e.target.checked })}
            disabled={!proxyConfigured || running}
            className="accent-indigo-600"
          />
          Route through proxy (needed to call DispatchTrack from the deployed site)
        </label>
        {!proxyConfigured && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Set a proxy URL in Settings to enable this.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-400"
          >
            Cancel run
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Run
          </button>
        )}
      </div>
    </form>
  )
}
