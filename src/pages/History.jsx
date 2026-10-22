import TrendChart from '../components/TrendChart'
import { when } from '../lib/util'

const month = (t) => new Date(t).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })
const line = (s) => s.reflection?.summary?.sammanfattning || s.report?.sammanfattning || s.result?.rapport || ''

export default function History({ coach, sessions, open }) {
  const done = sessions.filter((s) => s.status === 'done').sort((a, b) => b.start - a.start)
  const groups = []
  for (const s of done) {
    const k = month(s.start); let g = groups.find((x) => x.k === k)
    if (!g) groups.push((g = { k, items: [] })); g.items.push(s)
  }
  groups.forEach((g) => (g.avg = Math.round(g.items.reduce((a, s) => a + s.index, 0) / g.items.length)))
  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Historik – {coach?.name}</h1>
      <div className="card"><TrendChart data={done.slice().reverse()} /></div>
      {!done.length && <p className="text-stone-500">Inga analyserade pass än.</p>}
      {groups.map((g, gi) => {
        const prev = groups[gi + 1], d = prev ? g.avg - prev.avg : null
        return (
          <div key={g.k} className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <h2 className="font-semibold capitalize">{g.k}</h2>
              <span className="text-sm text-stone-500">{g.items.length} pass · snitt <b className="text-emerald-600">{g.avg}</b>
                {d !== null && <span className={d >= 0 ? 'text-emerald-600' : 'text-red-600'}> {d >= 0 ? '▲' : '▼'}{Math.abs(d)}</span>}</span>
            </div>
            {g.items.map((s) => (
              <div key={s.id} className="card cursor-pointer" onClick={() => open(s.id)}>
                <div className="flex justify-between"><span className="text-sm text-stone-500">{when(s.start)}{s.reflection ? ' · 🎙 reflektion' : ''}</span>
                  <b className="text-xl text-emerald-600">{s.index}</b></div>
                <p className="text-sm line-clamp-2">{line(s)}</p>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
