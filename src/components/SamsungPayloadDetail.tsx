import { useState } from 'react'
import type { SamsungOrderResult } from '../lib/samsungTypes'
import { Modal } from './Modal'

interface Props {
  order: SamsungOrderResult
  onClose: () => void
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function SamsungPayloadDetail({ order, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(order.payload, null, 2)

  async function copy() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <Modal title={`Order ${order.orderNumber}`} onClose={onClose}>
      <div className="space-y-3">
        {order.error && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            Export details couldn't be fetched, so this payload was built from the fetch API and template only: {order.error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            doNo {order.doNo || '—'} · {order.customerName || 'no name'} · {order.itemCount} items
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => download(`import_${order.doNo || order.orderNumber}.json`, json)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Download
            </button>
          </div>
        </div>
        <pre className="max-h-[28rem] overflow-auto rounded-md bg-slate-50 p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {json}
        </pre>
      </div>
    </Modal>
  )
}
