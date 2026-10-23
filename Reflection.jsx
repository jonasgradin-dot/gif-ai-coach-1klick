import { useEffect, useState } from 'react'
import { useClip } from '../hooks/useClip'
import { processReflection, storeClip, resetClip, hasClip } from '../lib/reflection'
import { fmt } from '../lib/util'

const List = ({ title, items }) => items?.length ? (
  <div className="mb-2"><h4 className="font-semibold text-sm">{title}</h4>
    <ul className="list-disc pl-5 text-sm space-y-1">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
) : null

export default function Reflection({ session, settings, onChange }) {
  const clip = useClip()
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(false)
  useEffect(() => { hasClip(session).then(setPending) }, [session.id])

  const run = async () => {
    if (!settings.openaiKey) { setErr(true); return setMsg('Ange din API-nyckel under Profil.') }
    setBusy(true); setErr(false)
    try { await processReflection(session, settings, setMsg); setMsg(''); setPending(false); await onChange() }
    catch (e) { setErr(true); setMsg(e.message + (pending ? ' – inspelningen är sparad, försök igen.' : '')) }
    setBusy(false)
  }
  const toggle = async () => {
    setErr(false); setMsg('')
    if (!clip.on) {
      try { await resetClip(session); setPending(false); await clip.start() } catch (e) { setErr(true); setMsg(e.message) }
      return
    }
    await storeClip(session, await clip.stop()); setPending(true); await run()
  }

  const R = session.reflection, S = R?.summary
  return (
    <div className="card">
      <h3 className="font-semibold text-lg mb-1">Talad reflektion</h3>
      {S && !clip.on && (
        <div className="mb-3">
          <p className="mb-2">{S.sammanfattning}</p>
          <List title="Lärdomar" items={S.laranden} />
          <List title="Åtgärder till nästa pass" items={S.atgarder} />
          {S.koppling && <p className="text-sm text-stone-500 mb-2">{S.koppling}</p>}
          <details><summary className="cursor-pointer text-stone-500 text-sm">Din reflektion (transkribering)</summary>
            <p className="text-sm mt-1">{R.transcript}</p></details>
        </div>
      )}
      {!S && !clip.on && (
        <ul className="text-sm text-stone-500 list-disc pl-5 mb-3">
          <li>Vad gick bra på passet?</li>
          <li>Vilken situation hade du hanterat annorlunda?</li>
          {session.report?.fokus && <li>Hur gick det med fokuset: {session.report.fokus}</li>}
        </ul>
      )}
      <button className="btn w-full" onClick={pending && !clip.on ? run : toggle} disabled={busy}>
        {clip.on ? `Stoppa reflektion · ${fmt(clip.sec * 1000)}` : pending ? 'Försök analysera igen' : S ? 'Spela in ny reflektion' : 'Spela in reflektion'}
      </button>
      {pending && !clip.on && !busy && <button className="text-sm text-stone-500 mt-2" onClick={toggle}>Spela in på nytt</button>}
      {(msg || busy) && <p className={`text-sm mt-2 ${err ? 'text-red-600' : 'text-stone-500'}`}>{msg || 'Bearbetar…'}</p>}
    </div>
  )
}
