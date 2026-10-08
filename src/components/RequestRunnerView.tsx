import { useState } from 'react'
import { useJobs } from '../hooks/useJobs'
import { useScheduler } from '../hooks/useScheduler'
import { createDemoConfig } from '../lib/factory'
import type { Job, RequestConfig } from '../lib/types'
import { BoltIcon } from './icons'
import { JobCard } from './JobCard'
import { JobForm } from './JobForm'
import { Modal } from './Modal'
import { PageHeader } from './PageHeader'

interface FormState {
  mode: 'create' | 'edit'
  job?: Job
}

interface Props {
  proxyUrl: string
}

export function RequestRunnerView({ proxyUrl }: Props) {
  const { jobs, addJob, updateJobConfig, removeJob, duplicateJob, setStatus, appendResult, clearHistory, importJobs } = useJobs()
  const [formState, setFormState] = useState<FormState | null>(null)

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
    <div>
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
      <PageHeader
        title="Request Runner"
        description="Send a request on a schedule and capture every response — status, timing, headers and body — with live stats per job."
        actions={
          <>
            <label
              htmlFor="import-input"
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Import
            </label>
            <button
              type="button"
              onClick={handleExportAll}
              disabled={jobs.length === 0}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Export all
            </button>
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create' })}
              className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              + New request
            </button>
          </>
        }
      />

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            <BoltIcon className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No requests yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Create a request, set a delay between runs, and API ToolKit will fire it automatically and capture every response.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create' })}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
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
          <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left text-xs text-slate-500 sm:grid-cols-3 dark:text-slate-400">
            {['Enter a URL, method, headers and body', 'Set the delay and how many times to repeat', 'Start it and watch responses arrive live'].map(
              (step, i) => (
                <li key={step} className="flex gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>
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
    </div>
  )
}
