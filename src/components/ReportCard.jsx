import DistributionBar from './DistributionBar'
import { KEYS, LABEL, COLOR, TAGS, TAG_LABEL, FOKUS_LABEL, shares, total } from '../lib/distribution'

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

function PlanBlock({ s, R }) {
  const b = s.band, f = s.fokusCount
  const sum = f ? Object.values(f).reduce((x, y) => x + y, 0) : 0
  const ids = b?.fokusIds || (f ? ['bollbehandling', 'lekar', 'spel', 'lagdelar', 'kollektiva'].filter((k) => f[k] > 0) : [])
  const note = Object.fromEntries((R.fokusomraden || []).map((x) => [x.id, x.kommentar]))
  const Row = ({ id, muted }) => {
    const n = f?.[id] || 0, pct = sum ? Math.round((100 * n) / sum) : 0
    return (
      <div className="mb-2">
        <div className="flex justify-between"><span className={muted ? 'text-stone-500' : 'font-semibold'}>{FOKUS_LABEL[id]}</span><span><b>{pct} %</b> <span className="text-stone-500">({n} st)</span></span></div>
        <div className="h-2 rounded bg-sand-200"><div className="h-2 rounded" style={{ width: pct + '%', background: muted ? '#a8a29e' : '#1c1917' }} /></div>
        {note[id] && <p className="text-xs text-stone-600 mt-1">{note[id]}</p>}
      </div>
    )
  }
  return (
    <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 mb-4 text-sm">
      <h3 className="font-semibold text-base mb-1">Spelarutbildningsplanen</h3>
      {b ? <p className="mb-2"><b>{b.namn} · {b.alder}</b> – ”{b.motto}”<br /><span className="text-stone-600">Fokus: {b.fokus.join(', ')}</span></p>
         : <p className="mb-2 text-stone-600">Åldersgrupp okänd – skriv t.ex. P12 som lag i Profil, så anpassas feedbacken.</p>}
      {sum > 0 && (
        <div className="mb-3">
          <h4 className="font-semibold mb-1">Fokusområden i passet</h4>
          <p className="text-xs text-stone-600 mb-2">Andel av dina uttalanden som handlade om varje område.</p>
          {ids.map((id) => <Row key={id} id={id} />)}
          <Row id="organisation" muted /><Row id="annat" muted />
        </div>
      )}
      {s.skills?.length > 0 && <p className="mb-2"><b>Färdigheter som nämndes:</b> {s.skills.map((x) => `${x.namn} (${x.antal})`).join(', ')}</p>}
      {s.nytta !== undefined && <div className="flex justify-between py-0.5 mb-1"><span>Förklarar syfte och nytta</span><b>{s.nytta} st</b></div>}
      {s.tags && <div className="mb-2">{TAGS.map((k) => (
        <div key={k} className="flex justify-between py-0.5"><span>{TAG_LABEL[k]}</span><b>{s.tags[k] || 0} st</b></div>))}</div>}
      {R.planen && <p>{R.planen}</p>}
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
            <span className="inline-block w-3 h-3 rounded-sm mr-2 border border-stone-400" style={{ background: COLOR[k] }} />
            <span className="flex-1">{LABEL[k]}</span><span className="text-stone-500 mr-3">{n} st</span><b className="w-12 text-right">{pct} %</b>
          </div>
        ))}
      </div>

      {(s.band || s.tags || s.fokusCount || R.planen) && <PlanBlock s={s} R={R} />}
      <h3 className="font-semibold text-lg">Tränarrapport</h3>
      <p className="mb-2">{R.sammanfattning}</p>
      {R.trend && <p className="mb-3 text-sm text-stone-500">{R.trend}</p>}
      <List title="Styrkor" items={R.styrkor} tone="text-black" />
      <List title="Utvecklingsområden" items={R.utveckling} tone="text-gold-700" />
      {R.fokus && <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 mb-3 text-sm"><b>Fokus nästa pass:</b> {R.fokus}</div>}

      <details className="mb-2"><summary className="cursor-pointer text-stone-500">Alla uttalanden ({(s.utterances || []).length})</summary>
        <ul className="text-sm mt-2 space-y-1 max-h-72 overflow-auto">
          {(s.utterances || []).map((u, i) => <li key={i}><span className="text-stone-500">{u.tid} · {LABEL[u.typ]}</span><br />{u.text}</li>)}
        </ul></details>
      <details><summary className="cursor-pointer text-stone-500">Transkribering</summary>
        <pre className="whitespace-pre-wrap text-sm max-h-72 overflow-auto mt-2">{s.transcript}</pre></details>
    </div>
  )
}
