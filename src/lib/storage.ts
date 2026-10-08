import type { PaginationConfig } from './paginationTypes'
import type { SamsungRunConfig } from './samsungTypes'
import type { Job } from './types'

const STORAGE_KEY = 'apitoolkit.jobs.v1'
const THEME_KEY = 'apitoolkit.theme.v1'
const PROXY_URL_KEY = 'apitoolkit.proxyUrl.v1'
const SAMSUNG_CONFIG_KEY = 'apitoolkit.samsungConfig.v1'
const ACTIVE_MODULE_KEY = 'apitoolkit.activeModule.v1'
const PAGINATION_KEY = 'apitoolkit.pagination.v1'
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

export function loadProxyUrl(): string {
  try {
    return localStorage.getItem(PROXY_URL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveProxyUrl(url: string): void {
  try {
    localStorage.setItem(PROXY_URL_KEY, url)
  } catch {
    // ignore write failures (private browsing, storage full, etc.)
  }
}

export function loadSamsungConfig(): SamsungRunConfig | null {
  try {
    const raw = localStorage.getItem(SAMSUNG_CONFIG_KEY)
    return raw ? (JSON.parse(raw) as SamsungRunConfig) : null
  } catch {
    return null
  }
}

export function saveSamsungConfig(config: SamsungRunConfig): void {
  try {
    localStorage.setItem(SAMSUNG_CONFIG_KEY, JSON.stringify(config))
  } catch {
    // ignore write failures (private browsing, storage full, etc.)
  }
}

export type ActiveModule = 'requests' | 'pagination' | 'samsung'

export function loadActiveModule(): ActiveModule {
  try {
    const raw = localStorage.getItem(ACTIVE_MODULE_KEY)
    return raw === 'samsung' || raw === 'pagination' ? raw : 'requests'
  } catch {
    return 'requests'
  }
}

export interface StoredPaginationState {
  configs: PaginationConfig[]
  selectedId: string | null
}

export function loadPaginationState(): StoredPaginationState | null {
  try {
    const raw = localStorage.getItem(PAGINATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPaginationState
    return Array.isArray(parsed?.configs) ? parsed : null
  } catch {
    return null
  }
}

export function savePaginationState(state: StoredPaginationState): void {
  try {
    localStorage.setItem(PAGINATION_KEY, JSON.stringify(state))
  } catch {
    // ignore write failures (private browsing, storage full, etc.)
  }
}

export function saveActiveModule(module: ActiveModule): void {
  try {
    localStorage.setItem(ACTIVE_MODULE_KEY, module)
  } catch {
    // ignore write failures (private browsing, storage full, etc.)
  }
}
