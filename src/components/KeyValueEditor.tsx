import { createKeyValue } from '../lib/factory'
import type { KeyValue } from '../lib/types'

interface Props {
  items: KeyValue[]
  onChange: (items: KeyValue[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  disabled?: boolean
  showIncrement?: boolean
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  disabled,
  showIncrement,
}: Props) {
  function update(id: string, patch: Partial<KeyValue>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }

  function add() {
    onChange([...items, createKeyValue()])
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => update(item.id, { enabled: e.target.checked })}
            disabled={disabled}
            aria-label="Enabled"
            className="size-4 shrink-0 accent-indigo-600"
          />
          <input
            type="text"
            value={item.key}
            onChange={(e) => update(item.id, { key: e.target.value })}
            placeholder={keyPlaceholder}
            disabled={disabled}
            aria-label={keyPlaceholder}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <input
            type="text"
            value={item.increment ? '' : item.value}
            onChange={(e) => update(item.id, { value: e.target.value })}
            placeholder={item.increment ? 'iterated value' : valuePlaceholder}
            disabled={disabled || item.increment}
            aria-label={valuePlaceholder}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {showIncrement && (
            <label
              title="Replace this value with the iteration number on each request"
              className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                item.increment
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={!!item.increment}
                onChange={(e) => update(item.id, { increment: e.target.checked })}
                disabled={disabled}
                className="size-3 accent-indigo-600"
              />
              Iterate
            </label>
          )}
          <button
            type="button"
            onClick={() => remove(item.id)}
            disabled={disabled}
            aria-label="Remove row"
            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
      >
        + Add row
      </button>
    </div>
  )
}
