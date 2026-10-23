import DistributionBar from './DistributionBar'
import { KEYS, LABEL, COLOR, shares, total } from '../lib/distribution'

function List({ title, items, tone }) {
  if (!items?.length) return null
  return (
    <div className="mb-3"><h4 className={`font-semibold ${tone}`}>{title}</h4>
      <ul className="list-disc pl-5 text-sm space-y-1">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
  )
}

function Legacy({ s }) { // pass från v1.0 (ingen uppdelning i typer)
  const r = s.result
  if (!r) return null
  return (
    <div>
      <p className="text-sm text-stone-500 mb-2">Frågor {r.fragor.antal} · instruktioner {r.instruktioner.antal} · positiv feedback {r.positiv.antal}</p>
      <p className="mb-2">{r.rapport}</p>
      {r.tips && <p><b>Tips:</b> {r.tips}</p>}
    </div>
  )
}

export default function ReportCard({ s }) {
  if (s.v !== 2 || !s.counts) return <Legacy s={s} />
  const R = s.report || {}, t = total(s.counts)
  return (
    <div>
      <h3 className="font-semibold text-lg mb-1">Fördelning under passet</h3>
      <p className="text-sm text-stone-500 mb-2">{t} uttalanden identifierade</p>
      {t < 8 && <p className="mb-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 p-2 text-sm">Få uttalanden kunde identifieras (kort pass eller dåligt ljud) – tolka fördelningen försiktigt.</p>}
      <DistributionBar counts={s.counts} h="h-8" />
      <div className="mt-3 mb-4 space-y-1">
        {shares(s.counts).map(({ k, n, pct }) => (
          <div key={k} className="flex items-center text-sm">
            <span className="inline-block w-3 h-3 rounded-sm mr-2 border border-neutral-400" style={{ background: COLOR[k] }} />
            <span className="flex-1">{LABEL[k]}</span><span className="text-stone-500 mr-3">{n} st</span><b className="w-12 text-right">{pct} %</b>
          </div>
        ))}
      </div>

      <h3 className="font-semibold text-lg">Tränarrapport</h3>
      <p className="mb-2">{R.sammanfattning}</p>
      {R.trend && <p className="mb-3 text-sm text-stone-500">{R.trend}</p>}
      <List title="Styrkor" items={R.styrkor} tone="text-black" />
      <List title="Utvecklingsområden" items={R.utveckling} tone="text-neutral-600" />
      {R.fokus && <div className="rounded-xl bg-neutral-100 border border-neutral-400 p-3 mb-3 text-sm"><b>Fokus nästa pass:</b> {R.fokus}</div>}

      <details className="mb-2"><summary className="cursor-pointer text-stone-500">Alla uttalanden ({s.utterances.length})</summary>
        <ul className="text-sm mt-2 space-y-1 max-h-72 overflow-auto">
          {s.utterances.map((u, i) => <li key={i}><span className="text-stone-500">{u.tid} · {LABEL[u.typ]}</span><br />{u.text}</li>)}
        </ul></details>
      <details><summary className="cursor-pointer text-stone-500">Transkribering</summary>
        <pre className="whitespace-pre-wrap text-sm max-h-72 overflow-auto mt-2">{s.transcript}</pre></details>
    </div>
  )
}
