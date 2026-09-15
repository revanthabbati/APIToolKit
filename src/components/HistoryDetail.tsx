import { useState } from 'react'
import { formatBytes, formatDuration, formatTimestamp, prettyBody, statusBadgeClass, statusLabel } from '../lib/format'
import type { RequestResult } from '../lib/types'
import { Modal } from './Modal'

interface Props {
  result: RequestResult
  onClose: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function HeaderTable({ headers }: { headers?: Record<string, string> }) {
  const entries = Object.entries(headers ?? {})
  if (entries.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500">No headers</p>
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
      {entries.map(([key, value], i) => (
        <div
          key={key}
          className={`flex gap-2 px-2.5 py-1.5 text-xs ${i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}
        >
          <span className="w-1/3 shrink-0 font-medium text-slate-500 dark:text-slate-400">{key}</span>
          <span className="min-w-0 flex-1 break-all text-slate-700 dark:text-slate-300">{value}</span>
        </div>
      ))}
    </div>
  )
}

export function HistoryDetail({ result, onClose }: Props) {
  return (
    <Modal title="Request details" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(result)}`}>{statusLabel(result)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{formatDuration(result.durationMs)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(result.responseSize)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{formatTimestamp(result.startedAt)}</span>
          {result.attempt >= 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">Attempt #{result.attempt}</span>
          )}
        </div>

        {result.error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{result.error}</div>
        )}

        <section>
          <h3 className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Request — {result.requestMethod} <span className="break-all font-normal text-slate-500 dark:text-slate-400">{result.requestUrl}</span>
          </h3>
          <HeaderTable headers={result.requestHeaders} />
          {result.requestBody && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Body</span>
                <CopyButton text={result.requestBody} />
              </div>
              <pre className="max-h-48 overflow-auto rounded-md bg-slate-50 p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {prettyBody(result.requestBody)}
              </pre>
            </div>
          )}
        </section>

        {!result.error && (
          <section>
            <h3 className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">Response</h3>
            <HeaderTable headers={result.responseHeaders} />
            {result.responseBody !== undefined && (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Body{result.responseTruncated ? ' (truncated)' : ''}
                  </span>
                  <CopyButton text={result.responseBody} />
                </div>
                <pre className="max-h-72 overflow-auto rounded-md bg-slate-50 p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {prettyBody(result.responseBody) || '(empty body)'}
                </pre>
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  )
}
