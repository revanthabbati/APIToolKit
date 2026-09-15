import { useState } from 'react'
import { JobCard } from './components/JobCard'
import { JobForm } from './components/JobForm'
import { Modal } from './components/Modal'
import { ProxySettings } from './components/ProxySettings'
import { ThemeToggle } from './components/ThemeToggle'
import { useJobs } from './hooks/useJobs'
import { useProxyUrl } from './hooks/useProxyUrl'
import { useScheduler } from './hooks/useScheduler'
import { createDemoConfig } from './lib/factory'
import type { Job, RequestConfig } from './lib/types'

interface FormState {
  mode: 'create' | 'edit'
  job?: Job
}

function App() {
  const { jobs, addJob, updateJobConfig, removeJob, duplicateJob, setStatus, appendResult, clearHistory, importJobs } = useJobs()
  const { proxyUrl, setProxyUrl } = useProxyUrl()
  const [formState, setFormState] = useState<FormState | null>(null)
  const [showProxySettings, setShowProxySettings] = useState(false)

  const scheduler = useScheduler({
    onResult: appendResult,
    onStatusChange: setStatus,
    getProxyUrl: () => proxyUrl,
  })

  function handleSubmit(config: RequestConfig) {
    if (formState?.mode === 'edit') {
      updateJobConfig(config.id, config)
    } else {
      addJob(config)
    }
    setFormState(null)
  }

  function handleDelete(jobId: string) {
    scheduler.stop(jobId)
    removeJob(jobId)
  }

  function handleImportFile(file: File) {
    file
      .text()
      .then((text) => {
        const parsed: unknown = JSON.parse(text)
        const list = Array.isArray(parsed) ? parsed : [parsed]
        const valid = list.filter(
          (j): j is Job => !!j && typeof j === 'object' && 'config' in j && typeof (j as Job).config?.url === 'string',
        )
        if (valid.length === 0) {
          window.alert('No valid jobs found in that file.')
          return
        }
        importJobs(
          valid.map((j) => ({
            ...j,
            config: { ...j.config, id: crypto.randomUUID() },
            status: 'idle',
          })),
        )
      })
      .catch(() => window.alert('Could not parse that file as an API ToolKit export.'))
  }

  function handleExportAll() {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'apitoolkit-jobs.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">A</div>
            <span className="font-semibold">API ToolKit</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="import-input"
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFile(file)
                e.target.value = ''
              }}
            />
            <label
              htmlFor="import-input"
              className="cursor-pointer rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Import
            </label>
            <button
              type="button"
              onClick={handleExportAll}
              disabled={jobs.length === 0}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Export all
            </button>
            <button
              type="button"
              onClick={() => setShowProxySettings(true)}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Proxy settings
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create' })}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              + New request
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">No requests yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Create a request, set a delay between runs, and API ToolKit will fire it automatically and capture every response.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setFormState({ mode: 'create' })}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Create your first request
              </button>
              <button
                type="button"
                onClick={() => addJob(createDemoConfig())}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Load demo request
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.config.id}
                job={job}
                isRunning={scheduler.isRunning(job.config.id)}
                onStart={() => scheduler.start(job.config)}
                onStop={() => scheduler.stop(job.config.id)}
                onRunOnce={() => scheduler.runOnce(job.config)}
                onEdit={() => setFormState({ mode: 'edit', job })}
                onDuplicate={() => duplicateJob(job.config.id)}
                onDelete={() => handleDelete(job.config.id)}
                onClearHistory={() => clearHistory(job.config.id)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Runs entirely in your browser — nothing leaves your machine except the requests you configure. Keep this tab open for
        scheduled requests to keep firing. Target APIs must allow cross-origin requests (CORS) to be called directly from
        here — for ones that don't, set up the proxy under Proxy settings.
      </footer>

      {formState && (
        <Modal title={formState.mode === 'edit' ? 'Edit request' : 'New request'} onClose={() => setFormState(null)}>
          <JobForm
            initial={formState.job?.config}
            proxyConfigured={proxyUrl.trim() !== ''}
            onSubmit={handleSubmit}
            onCancel={() => setFormState(null)}
          />
        </Modal>
      )}

      {showProxySettings && <ProxySettings value={proxyUrl} onSave={setProxyUrl} onClose={() => setShowProxySettings(false)} />}
    </div>
  )
}

export default App
