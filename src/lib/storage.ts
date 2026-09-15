import type { Job } from './types'

const STORAGE_KEY = 'apitoolkit.jobs.v1'
const THEME_KEY = 'apitoolkit.theme.v1'
export const MAX_RESULTS_PER_JOB = 200

export function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Job[]
  } catch {
    return []
  }
}

export function saveJobs(jobs: Job[]): void {
  try {
    const trimmed = jobs.map((job) => ({
      ...job,
      results: job.results.slice(0, MAX_RESULTS_PER_JOB),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (err) {
    console.warn('APIToolKit: failed to save jobs to localStorage', err)
  }
}

export type ThemePreference = 'light' | 'dark' | 'system'

export function loadTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
    return 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore write failures (private browsing, storage full, etc.)
  }
}
