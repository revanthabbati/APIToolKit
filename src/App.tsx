import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BoltIcon, BoxIcon, GitHubIcon, GlobeIcon, InfoIcon, LogoIcon, StackIcon } from './components/icons'
import { PaginationModule } from './components/PaginationModule'
import { ProxySettings } from './components/ProxySettings'
import { RequestRunnerView } from './components/RequestRunnerView'
import { SamsungModule } from './components/SamsungModule'
import { ThemeToggle } from './components/ThemeToggle'
import { useProxyUrl } from './hooks/useProxyUrl'
import { isActiveModule, loadActiveModule, saveActiveModule } from './lib/storage'
import type { ActiveModule } from './lib/storage'

const MODULES: { key: ActiveModule; label: string; icon: ReactNode }[] = [
  { key: 'requests', label: 'Request Runner', icon: <BoltIcon /> },
  { key: 'pagination', label: 'Pagination Runner', icon: <StackIcon /> },
  { key: 'samsung', label: 'Samsung Import Builder', icon: <BoxIcon /> },
]

const REPO_URL = 'https://github.com/revanthabbati/APIToolKit'

function moduleFromHash(): ActiveModule | null {
  const value = window.location.hash.replace(/^#\/?/, '')
  return isActiveModule(value) ? value : null
}

function App() {
  const { proxyUrl, setProxyUrl } = useProxyUrl()
  const [activeModule, setActiveModuleState] = useState<ActiveModule>(() => moduleFromHash() ?? loadActiveModule())
  const [showProxySettings, setShowProxySettings] = useState(false)
  const proxyConfigured = proxyUrl.trim() !== ''

  // Keep the tab in the URL so it can be bookmarked and back/forward works.
  useEffect(() => {
    function onHashChange() {
      const fromHash = moduleFromHash()
      if (fromHash) {
        setActiveModuleState(fromHash)
        saveActiveModule(fromHash)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('popstate', onHashChange)
    }
  }, [])

  function setActiveModule(module: ActiveModule) {
    setActiveModuleState(module)
    saveActiveModule(module)
    if (moduleFromHash() !== module) window.history.pushState(null, '', `#/${module}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3">
          <a href={`#/${activeModule}`} className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
              <LogoIcon className="size-[18px]" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-semibold tracking-tight">API ToolKit</span>
              <span className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Schedule, paginate & capture API calls</span>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProxySettings(true)}
              title={proxyConfigured ? `Proxy: ${proxyUrl}` : 'No proxy configured'}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span className="relative">
                <GlobeIcon />
                <span
                  className={`absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                    proxyConfigured ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              </span>
              <span className="hidden sm:inline">{proxyConfigured ? 'Proxy on' : 'Proxy'}</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Modules" className="mx-auto max-w-6xl px-4">
          <div role="tablist" className="no-scrollbar -mb-px mt-2 flex gap-1 overflow-x-auto">
            {MODULES.map((m) => {
              const active = activeModule === m.key
              return (
                <button
                  key={m.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveModule(m.key)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        {activeModule === 'requests' && <RequestRunnerView proxyUrl={proxyUrl} />}
        {activeModule === 'pagination' && <PaginationModule proxyUrl={proxyUrl} />}
        {activeModule === 'samsung' && <SamsungModule proxyUrl={proxyUrl} />}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">
            © {new Date().getFullYear()} <span className="font-semibold text-slate-700 dark:text-slate-200">Revanth Reddy Abbati</span>
          </span>
          <span
            className="hidden items-center gap-1 md:flex"
            title="Requests are sent straight from your browser, so target APIs must allow CORS — or route them through your own proxy (Proxy settings). Keep this tab open while requests are running."
          >
            <InfoIcon className="size-3.5" />
            Runs entirely in your browser — nothing is stored on a server
          </span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 font-medium hover:text-slate-800 dark:hover:text-slate-200"
          >
            <GitHubIcon className="size-3.5" />
            Source
          </a>
        </div>
      </footer>

      {showProxySettings && <ProxySettings value={proxyUrl} onSave={setProxyUrl} onClose={() => setShowProxySettings(false)} />}
    </div>
  )
}

export default App
