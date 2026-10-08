import { usePaginationConfigs } from '../hooks/usePaginationConfigs'
import { usePaginationRun } from '../hooks/usePaginationRun'
import { PageHeader } from './PageHeader'
import { PaginationEditor } from './PaginationEditor'
import { PaginationResults } from './PaginationResults'

interface Props {
  proxyUrl: string
}

export function PaginationModule({ proxyUrl }: Props) {
  const { configs, selected, select, update, create, duplicate, remove } = usePaginationConfigs()
  const runState = usePaginationRun()
  const running = runState.status === 'running'
  const proxy = proxyUrl.trim() || undefined

  function switchTo(id: string) {
    if (running || id === selected.id) return
    select(id)
    runState.reset()
  }

  return (
    <>
    <PageHeader
      title="Pagination Runner"
      description="Import a cURL command or URL, choose which parameters to iterate, and walk through every page — results merged into one response or viewed page by page."
    />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Saved endpoints</h2>
          <button
            type="button"
            onClick={() => {
              create()
              runState.reset()
            }}
            disabled={running}
            className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            + New
          </button>
        </div>
        <ul className="space-y-1">
          {configs.map((config) => (
            <li key={config.id}>
              <div
                className={`group rounded-lg border px-3 py-2 ${
                  config.id === selected.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                }`}
              >
                <button type="button" onClick={() => switchTo(config.id)} disabled={running} className="block w-full text-left disabled:cursor-not-allowed">
                  <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{config.name || 'Untitled'}</div>
                  <div className="truncate font-mono text-[11px] text-slate-400">
                    {config.method} {config.baseUrl.replace(/^https?:\/\//, '') || '—'}
                  </div>
                </button>
                <div className="mt-1 flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => duplicate(config.id)}
                    disabled={running}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-50 dark:hover:text-slate-200"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${config.name}"?`)) {
                        if (config.id === selected.id) runState.reset()
                        remove(config.id)
                      }
                    }}
                    disabled={running}
                    className="text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PaginationEditor
            key={selected.id}
            config={selected}
            onChange={update}
            proxyConfigured={proxy !== undefined}
            running={running}
            onRun={() => runState.run(selected, proxy)}
            onCancel={runState.cancel}
          />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PaginationResults
            status={runState.status}
            pages={runState.pages}
            planned={runState.planned}
            stopReason={runState.stopReason}
            runError={runState.runError}
            runConfig={runState.runConfig}
            onRetryFailed={() => runState.retryFailed(proxy)}
          />
        </section>
      </div>
    </div>
    </>
  )
}
