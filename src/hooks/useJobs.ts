import { useEffect, useRef, useState } from 'react'
import { loadJobs, MAX_RESULTS_PER_JOB, saveJobs } from '../lib/storage'
import type { Job, JobStatus, RequestConfig, RequestResult } from '../lib/types'

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>(() => loadJobs())
  const saveTimer = useRef<number>(undefined)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveJobs(jobs), 250)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [jobs])

  function addJob(config: RequestConfig) {
    const job: Job = { config, status: 'idle', results: [], totalRuns: 0, createdAt: Date.now() }
    setJobs((prev) => [job, ...prev])
  }

  function updateJobConfig(id: string, config: RequestConfig) {
    setJobs((prev) => prev.map((j) => (j.config.id === id ? { ...j, config } : j)))
  }

  function removeJob(id: string) {
    setJobs((prev) => prev.filter((j) => j.config.id !== id))
  }

  function duplicateJob(id: string) {
    setJobs((prev) => {
      const found = prev.find((j) => j.config.id === id)
      if (!found) return prev
      const copy: Job = {
        config: { ...found.config, id: crypto.randomUUID(), name: `${found.config.name} (copy)` },
        status: 'idle',
        results: [],
        totalRuns: 0,
        createdAt: Date.now(),
      }
      return [copy, ...prev]
    })
  }

  function setStatus(id: string, status: JobStatus) {
    setJobs((prev) => prev.map((j) => (j.config.id === id ? { ...j, status } : j)))
  }

  function appendResult(id: string, result: RequestResult) {
    setJobs((prev) =>
      prev.map((j) =>
        j.config.id === id
          ? { ...j, results: [result, ...j.results].slice(0, MAX_RESULTS_PER_JOB), totalRuns: j.totalRuns + 1 }
          : j,
      ),
    )
  }

  function clearHistory(id: string) {
    setJobs((prev) => prev.map((j) => (j.config.id === id ? { ...j, results: [], totalRuns: 0 } : j)))
  }

  function importJobs(newJobs: Job[]) {
    setJobs((prev) => [...newJobs, ...prev])
  }

  return {
    jobs,
    addJob,
    updateJobConfig,
    removeJob,
    duplicateJob,
    setStatus,
    appendResult,
    clearHistory,
    importJobs,
  }
}
