interface Props {
  values: number[]
  oks: boolean[]
  width?: number
  height?: number
}

export function Sparkline({ values, oks, width = 160, height = 32 }: Props) {
  if (values.length < 2) {
    return <div style={{ width, height }} className="flex items-center text-xs text-slate-400 dark:text-slate-500">Not enough data yet</div>
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const stepX = width / (values.length - 1)

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return { x, y }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lastFailed = !oks[oks.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-indigo-400 dark:text-indigo-500" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.6} className={oks[i] ? 'fill-indigo-400 dark:fill-indigo-500' : 'fill-red-500'} />
      ))}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} className={lastFailed ? 'fill-red-500' : 'fill-emerald-500'} />
    </svg>
  )
}
