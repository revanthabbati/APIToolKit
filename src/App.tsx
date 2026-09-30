import { useState } from 'react'
import { ProxySettings } from './components/ProxySettings'
import { RequestRunnerView } from './components/RequestRunnerView'
import { SamsungModule } from './components/SamsungModule'
import { ThemeToggle } from './components/ThemeToggle'
import { useProxyUrl } from './hooks/useProxyUrl'
import { loadActiveModule, saveActiveModule } from './lib/storage'
import type { ActiveModule } from './lib/storage'

const MODULE_LABELS: Record<ActiveModule, string> = {
  requests: 'Request Runner',
  samsung: 'Samsung Import Builder',
}

function App() {
  const { proxyUrl, setProxyUrl } = useProxyUrl()
  const [activeModule, setActiveModuleState] = useState<ActiveModule>(() => loadActiveModule())
  const [showProxySettings, setShowProxySettings] = useState(false)

  function setActiveModule(module: ActiveModule) {
    setActiveModuleState(module)
    saveActiveModule(module)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">A</div>
            <span className="font-semibold">API ToolKit</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProxySettings(true)}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Proxy settings
            </button>
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-2">
          {(Object.keys(MODULE_LABELS) as ActiveModule[]).map((moduleKey) => (
            <button
              key={moduleKey}
              type="button"
              onClick={() => setActiveModule(moduleKey)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeModule === moduleKey
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {MODULE_LABELS[moduleKey]}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {activeModule === 'requests' ? <RequestRunnerView proxyUrl={proxyUrl} /> : <SamsungModule proxyUrl={proxyUrl} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Runs entirely in your browser — nothing leaves your machine except the requests you configure. Keep this tab open
        while requests are running. Target APIs must allow cross-origin requests (CORS) to be called directly from here —
        for ones that don't, set up the proxy under Proxy settings.
      </footer>

      {showProxySettings && <ProxySettings value={proxyUrl} onSave={setProxyUrl} onClose={() => setShowProxySettings(false)} />}
    </div>
  )
}

export default App
