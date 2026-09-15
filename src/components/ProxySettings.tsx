import { useState } from 'react'
import { Modal } from './Modal'

interface Props {
  value: string
  onSave: (value: string) => void
  onClose: () => void
}

export function ProxySettings({ value, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(value)

  function handleSave() {
    onSave(draft.trim())
    onClose()
  }

  return (
    <Modal title="Proxy settings" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Some APIs block cross-origin requests (CORS), which a browser-only app can never bypass on its own. Deploy the
          small proxy in this repo's <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">proxy/</code>{' '}
          folder (see <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">proxy/README.md</code>),
          paste its URL below, then enable "Route through proxy" on individual requests that need it.
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Proxy URL</label>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://your-proxy.workers.dev"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
