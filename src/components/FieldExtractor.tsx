import { useMemo, useState } from 'react'
import { downloadText } from '../lib/download'
import {
  defaultLabel,
  discoverFields,
  displayPath,
  fieldId,
  formatSample,
  labelProblems,
  parsePathInput,
  projectRecords,
  toCsv,
} from '../lib/fieldExtract'
import type { ExportField } from '../lib/fieldExtract'

interface Props {
  records: unknown[]
  fields: ExportField[]
  dedupe: boolean
  onChange: (fields: ExportField[], dedupe: boolean) => void
  fileBaseName: string
}

const PREVIEW_ROWS = 20

export function FieldExtractor({ records, fields, dedupe, onChange, fileBaseName }: Props) {
  const [search, setSearch] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [copied, setCopied] = useState(false)

  const discovered = useMemo(() => discoverFields(records), [records])
  const selectedIds = useMemo(() => new Set(fields.map((f) => fieldId(f.path))), [fields])
  const visible = discovered.filter((f) => f.key.toLowerCase().includes(search.trim().toLowerCase()))
  const problem = labelProblems(fields)
  const rows = useMemo(() => (fields.length > 0 && !problem ? projectRecords(records, fields, dedupe) : []), [records, fields, dedupe, problem])
  const labels = fields.map((f) => f.label.trim())

  function setFields(next: ExportField[]) {
    onChange(next, dedupe)
  }

  function toggle(path: string[]) {
    const id = fieldId(path)
    if (selectedIds.has(id)) setFields(fields.filter((f) => fieldId(f.path) !== id))
    else setFields([...fields, { path, label: defaultLabel(path, fields) }])
  }

  function addCustomPath() {
    const path = parsePathInput(customPath)
    if (path.length === 0 || selectedIds.has(fieldId(path))) return
    setFields([...fields, { path, label: defaultLabel(path, fields) }])
    setCustomPath('')
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    ;[next[index], next[target]] = [next[target], next[index]]
    setFields(next)
  }

  function rename(index: number, label: string) {
    setFields(fields.map((f, i) => (i === index ? { ...f, label } : f)))
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rows, null, 2))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  if (records.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No JSON records in these results to pick fields from.</p>
  }

  const canExport = fields.length > 0 && !problem

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Available fields</span>
            <span className="text-xs text-slate-400">{discovered.length} found</span>
          </div>
          <div className="p-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fields…"
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <ul className="max-h-80 overflow-auto px-2 pb-2">
            {visible.map((field) => {
              const checked = selectedIds.has(fieldId(field.path))
              return (
                <li key={fieldId(field.path)}>
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs ${
                      checked ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(field.path)} className="mt-0.5 accent-indigo-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block break-all font-mono text-slate-800 dark:text-slate-200">{field.key}</span>
                      <span className="block truncate text-slate-400">{formatSample(field.sample) || '—'}</span>
                    </span>
                    <span
                      title="Share of records that contain this field"
                      className={`shrink-0 tabular-nums ${field.coverage < 1 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}
                    >
                      {Math.round(field.coverage * 100)}%
                    </span>
                  </label>
                </li>
              )
            })}
            {visible.length === 0 && <li className="px-2 py-4 text-center text-xs text-slate-400">No fields match “{search}”.</li>}
          </ul>
          <div className="mt-auto flex gap-2 border-t border-slate-200 p-2 dark:border-slate-700">
            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomPath()
                }
              }}
              placeholder="Add by path, e.g. vehicle.number"
              className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={addCustomPath}
              disabled={parsePathInput(customPath).length === 0}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Selected fields ({fields.length})</span>
            {fields.length > 0 && (
              <button type="button" onClick={() => setFields([])} className="text-xs font-medium text-slate-400 hover:text-red-500">
                Clear
              </button>
            )}
          </div>
          {fields.length === 0 ? (
            <p className="flex-1 px-3 py-8 text-center text-xs text-slate-400">
              Tick fields on the left. Each becomes one key in the exported records, in the order listed here.
            </p>
          ) : (
            <ul className="max-h-[22rem] space-y-1.5 overflow-auto p-2">
              {fields.map((field, index) => (
                <li key={fieldId(field.path)} className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => rename(index, e.target.value)}
                      aria-label={`Output name for ${displayPath(field.path)}`}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400" title={displayPath(field.path)}>
                      from {displayPath(field.path)}
                    </span>
                  </div>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700">
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === fields.length - 1}
                    aria-label="Move down"
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                  >
                    ↓
                  </button>
                  <button type="button" onClick={() => toggle(field.path)} aria-label="Remove field" className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={dedupe} onChange={(e) => onChange(fields, e.target.checked)} className="accent-indigo-600" />
          Remove duplicate rows
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {canExport ? `${rows.length} of ${records.length} records` : ''}
          </span>
          <button
            type="button"
            onClick={copyJson}
            disabled={!canExport}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            type="button"
            onClick={() => downloadText(`${fileBaseName}_fields.csv`, toCsv(rows, labels), 'text/csv')}
            disabled={!canExport}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => downloadText(`${fileBaseName}_fields.json`, JSON.stringify(rows, null, 2))}
            disabled={!canExport}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40"
          >
            Download JSON
          </button>
        </div>
      </div>

      {problem && <p className="text-sm text-red-600 dark:text-red-400">{problem}</p>}

      {canExport && (
        <div>
          <div className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Preview {rows.length > PREVIEW_ROWS ? `(first ${PREVIEW_ROWS} rows)` : ''}
          </div>
          <div className="max-h-80 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  {labels.map((label) => (
                    <th key={label} className="whitespace-nowrap px-2.5 py-1.5 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    {labels.map((label) => (
                      <td key={label} className="max-w-[16rem] truncate px-2.5 py-1.5 font-mono text-slate-700 dark:text-slate-300">
                        {row[label] === null ? <span className="text-slate-300 dark:text-slate-600">null</span> : formatSample(row[label])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
