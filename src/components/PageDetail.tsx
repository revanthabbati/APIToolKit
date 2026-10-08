import { useState } from 'react'
import { downloadText } from '../lib/download'
import { formatBytes, formatDuration, prettyBody } from '../lib/format'
import type { PageResult } from '../lib/paginationTypes'
import { Modal } from './Modal'

const PREVIEW_CHARS = 500_000

export function PageDetail({ page, onClose }: { page: PageResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const pretty = prettyBody(page.bodyText)
  const preview = pretty.length > PREVIEW_CHARS ? `${pretty.slice(0, PREVIEW_CHARS)}\n… (preview truncated — download for the full response)` : pretty

  async function copy() {
    try {
      await navigator.clipboard.writeText(pretty)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <Modal title={`Request #${page.index + 1} — value ${page.value}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{page.status ? `${page.status} ${page.statusText ?? ''}` : 'No response'}</span>
          <span>{formatDuration(page.durationMs)}</span>
          <span>{formatBytes(page.bodyText.length)}</span>
          {page.recordCount !== undefined && <span>{page.recordCount} records</span>}
        </div>
        <div className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">{page.url || '—'}</div>
        {page.error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{page.error}</div>
        )}
        {page.truncated && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Response was larger than 2 MB; the stored body is truncated.</p>
        )}
        {page.bodyText && (
          <>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={copy} className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => downloadText(`page_${page.value}.json`, pretty)}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Download
              </button>
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded-md bg-slate-50 p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {preview}
            </pre>
          </>
        )}
      </div>
    </Modal>
  )
}
