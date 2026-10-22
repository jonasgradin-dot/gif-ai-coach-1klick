import { fmt } from '../lib/util'

const LABEL = { oppen_fraga: 'Öppna frågor', sluten_fraga: 'Slutna frågor', instruktion: 'Instruktioner', positiv_specifik: 'Specifik feedback', positiv_generell: 'Allmän feedback' }
const BARS = [['balans', 'Balans i språket'], ['fragekvalitet', 'Frågekvalitet'], ['feedbackkvalitet', 'Feedbackkvalitet']]

function List({ title, items, tone }) {
  if (!items?.length) return null
  return (
    <div className="mb-3"><h4 className={`font-semibold ${tone}`}>{title}</h4>
      <ul className="list-disc pl-5 text-sm space-y-1">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
  )
}

function Legacy({ s }) { // pass från v1.0
  const r = s.result
  if (!r) return null
  return (
    <div>
      <div className="text-center text-6xl font-extrabold text-emerald-600">{s.index}</div>
      <p className="text-center text-sm text-stone-500 mb-3">Båstad-index (v1) · frågor {r.fragor.antal} · instruktioner {r.instruktioner.antal} · positiv {r.positiv.antal}</p>
      <p className="mb-2">{r.rapport}</p>
      {r.tips && <p><b>Tips:</b> {r.tips}</p>}
    </div>
  )
}

export default function ReportCard({ s }) {
  if (s.v !== 2) return <Legacy s={s} />
  const R = s.report || {}
  return (
    <div>
      <div className="text-center">
        <div className="text-6xl font-extrabold text-emerald-600">{s.index}</div>
        <div className="text-sm text-stone-500">Båstad-index</div>
      </div>
      {s.lowData && <p className="my-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 p-2 text-sm">Få uttalanden kunde identifieras (kort pass eller dåligt ljud) – tolka indexet försiktigt.</p>}
      <div className="my-3 space-y-2">
        {BARS.map(([k, l]) => (
          <div key={k}><div className="flex justify-between text-xs text-stone-500"><span>{l}</span><span>{s.indexParts[k]}</span></div>
            <div className="h-2 rounded bg-stone-200 dark:bg-stone-800"><div className="h-2 rounded bg-emerald-600" style={{ width: s.indexParts[k] + '%' }} /></div></div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 mb-4">
        {Object.keys(LABEL).map((k) => (
          <div key={k} className="rounded-xl bg-stone-100 dark:bg-stone-800 p-2 text-center">
            <b className="block text-lg">{s.counts[k]}</b><span className="text-[10px] leading-tight text-stone-500 block">{LABEL[k]}</span></div>
        ))}
      </div>

      <h3 className="font-semibold text-lg">Tränarrapport</h3>
      <p className="mb-2">{R.sammanfattning}</p>
      {R.trend && <p className="mb-3 text-sm text-stone-500">{R.trend}</p>}
      <List title="Styrkor" items={R.styrkor} tone="text-emerald-600" />
      <List title="Utvecklingsområden" items={R.utveckling} tone="text-amber-600" />
      {R.fokus && <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-3 mb-3 text-sm"><b>Fokus nästa pass:</b> {R.fokus}</div>}

      <details className="mb-2"><summary className="cursor-pointer text-stone-500">Alla uttalanden ({s.utterances.length})</summary>
        <ul className="text-sm mt-2 space-y-1 max-h-72 overflow-auto">
          {s.utterances.map((u, i) => <li key={i}><span className="text-stone-500">{u.tid} · {LABEL[u.typ]}</span><br />{u.text}</li>)}
        </ul></details>
      <details><summary className="cursor-pointer text-stone-500">Transkribering</summary>
        <pre className="whitespace-pre-wrap text-sm max-h-72 overflow-auto mt-2">{s.transcript}</pre></details>
    </div>
  )
}
