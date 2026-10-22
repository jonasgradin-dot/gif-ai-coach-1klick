export default function TrendChart({ data }) {
  if (!data.length) return <p className="text-sm text-stone-500">Ingen data än – spela in ditt första pass.</p>
  const W = 320, H = 140
  const x = (i) => (data.length > 1 ? 20 + (i * (W - 40)) / (data.length - 1) : W / 2)
  const y = (v) => H - 25 - (v * (H - 45)) / 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Båstad-index över tid">
      {[0, 50, 100].map((v) => (
        <g key={v}><line x1="20" x2={W - 10} y1={y(v)} y2={y(v)} className="stroke-stone-300 dark:stroke-stone-700" />
          <text x="0" y={y(v) + 3} className="fill-stone-500 text-[10px]">{v}</text></g>
      ))}
      <polyline fill="none" className="stroke-emerald-600" strokeWidth="2.5" points={data.map((s, i) => `${x(i)},${y(s.index)}`).join(' ')} />
      {data.map((s, i) => (
        <g key={s.id}><circle cx={x(i)} cy={y(s.index)} r="4" className="fill-emerald-600" />
          <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-stone-500 text-[10px]">
            {new Date(s.start).toLocaleDateString('sv-SE', { day: 'numeric', month: 'numeric' })}</text></g>
      ))}
    </svg>
  )
}
