import type { ReactNode } from 'react'

interface Props {
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
