import DistributionChart from '../components/DistributionChart'
import DistributionBar from '../components/DistributionBar'
import { when } from '../lib/util'
import { sumCounts } from '../lib/distribution'

const month = (t) => new Date(t).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })
const line = (s) => s.reflection?.summary?.sammanfattning || s.report?.sammanfattning || s.result?.rapport || ''

export default function History({ coach, sessions, open }) {
  const done = sessions.filter((s) => s.status === 'done').sort((a, b) => b.start - a.start)
  const groups = []
  for (const s of done) {
    const k = month(s.start); let g = groups.find((x) => x.k === k)
    if (!g) groups.push((g = { k, items: [] })); g.items.push(s)
  }
  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Historik – {coach?.name}</h1>
      <div className="card"><DistributionChart sessions={done.slice().reverse()} /></div>
      {!done.length && <p className="text-stone-500">Inga analyserade pass än.</p>}
      {groups.map((g) => (
        <div key={g.k} className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <h2 className="font-semibold capitalize">{g.k}</h2><span className="text-sm text-stone-500">{g.items.length} pass</span>
          </div>
          <div className="mb-2"><DistributionBar counts={sumCounts(g.items)} h="h-3" /></div>
          {g.items.map((s) => (
            <div key={s.id} className="card cursor-pointer" onClick={() => open(s.id)}>
              <div className="text-sm text-stone-500 mb-1">{when(s.start)}{s.reflection ? ' · 🎙 reflektion' : ''}</div>
              {s.counts && <div className="mb-2"><DistributionBar counts={s.counts} h="h-3" /></div>}
              <p className="text-sm line-clamp-2">{line(s)}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
