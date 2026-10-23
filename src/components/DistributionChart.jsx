import { KEYS, LABEL, COLOR, total } from '../lib/distribution'

// En stapel per pass (senaste 12), 100 % = alla uttalanden under passet.
export default function DistributionChart({ sessions }) {
  const d = sessions.filter((s) => s.counts && total(s.counts) > 0).slice(-12)
  if (!d.length) return <p className="text-sm text-stone-500">Ingen data än – spela in ditt första pass.</p>
  const W = 320, H = 150, top = 8, bottom = H - 22, ph = bottom - top, slot = (W - 40) / d.length, bw = Math.min(34, slot - 6)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Fördelning av språktyper per pass">
        {[0, 50, 100].map((p) => (
          <g key={p}><line x1="28" x2={W - 4} y1={bottom - (p / 100) * ph} y2={bottom - (p / 100) * ph} className="stroke-stone-300 dark:stroke-stone-700" />
            <text x="0" y={bottom - (p / 100) * ph + 3} className="fill-stone-500 text-[10px]">{p}%</text></g>
        ))}
        {d.map((s, i) => {
          const t = total(s.counts), cx = 32 + (i + 0.5) * slot; let cum = 0
          return (
            <g key={s.id}>
              {KEYS.map((k) => { const f = (s.counts[k] || 0) / t; const y = bottom - (cum + f) * ph; cum += f; return f > 0 && <rect key={k} x={cx - bw / 2} y={y} width={bw} height={f * ph} fill={COLOR[k]} stroke="#fff" strokeWidth="0.75" /> })}
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-stone-500 text-[10px]">{new Date(s.start).toLocaleDateString('sv-SE', { day: 'numeric', month: 'numeric' })}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {KEYS.map((k) => <span key={k} className="text-xs text-stone-500"><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 border border-stone-400" style={{ background: COLOR[k] }} />{LABEL[k]}</span>)}
      </div>
    </div>
  )
}
