import { useState } from 'react'
import ReportCard from '../components/ReportCard'
import Reflection from '../components/Reflection'
import { when } from '../lib/util'
import { dropChunks } from '../lib/db'
import { removeSession } from '../lib/store'
import { reanalyze } from '../lib/analyze'
import { shares, LABEL } from '../lib/distribution'

function asText(s) {
  const R = s.report || {}, S = s.reflection?.summary
  return [`Tränarrapport ${when(s.start)}`, s.counts ? 'Fördelning: ' + shares(s.counts).map((x) => `${LABEL[x.k]} ${x.pct} %`).join(', ') : '', R.sammanfattning, R.trend, R.planen ? 'Spelarutbildningsplanen: ' + R.planen : '',
    'Styrkor: ' + (R.styrkor || []).join('; '), 'Utveckling: ' + (R.utveckling || []).join('; '), 'Fokus: ' + (R.fokus || ''),
    S ? `Reflektion: ${S.sammanfattning}\nÅtgärder: ${(S.atgarder || []).join('; ')}` : ''].filter(Boolean).join('\n\n')
}

export default function Report({ session, settings, back, reload }) {
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState(false)
  if (!session) return <button className="btn" onClick={back}>Tillbaka</button>
  const remove = async () => {
    if (!confirm('Radera passet (även i molnet)?')) return
    await removeSession(session.id, session.coachId); await dropChunks(session.id); await dropChunks('refl-' + session.id); await reload(); back()
  }
  const again = async () => {
    if (!settings.openaiKey) { setErr(true); return setMsg('Ange din API-nyckel under Profil.') }
    setErr(false)
    try { await reanalyze(session, settings, setMsg); setMsg('Klart!'); await reload() } catch (e) { setErr(true); setMsg(e.message) }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(asText(session)); setMsg('Rapport kopierad.') } catch { setMsg('Kunde inte kopiera.') } }
  return (
    <div>
      <button className="text-gold-700 font-semibold mb-2" onClick={back}>← Tillbaka</button>
      <p className="text-sm text-stone-700 mb-2">{when(session.start)}</p>
      <div className="card"><ReportCard s={session} /></div>
      {session.v === 2 && <Reflection session={session} settings={settings} onChange={reload} />}
      {msg && <p className={`text-sm mb-2 ${err ? 'text-red-600' : 'text-stone-500'}`}>{msg}</p>}
      <div className="flex gap-2 mb-3">
        {session.v === 2 && <button className="btn !py-2 flex-1 text-sm" onClick={copy}>Kopiera rapport</button>}
        {session.transcript && <button className="btn !py-2 flex-1 text-sm" onClick={again}>Analysera om</button>}
      </div>
      <button className="text-red-600 text-sm" onClick={remove}>Radera pass</button>
    </div>
  )
}
