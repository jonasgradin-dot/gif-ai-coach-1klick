import { useState } from 'react'
import { useRecorder } from '../hooks/useRecorder'
import { processSession } from '../lib/analyze'
import { putSession } from '../lib/db'
import { fmt } from '../lib/util'

export default function Train({ coach, settings, onDone }) {
  const rec = useRecorder()
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const fail = (m) => { setMsg(m); setErr(true) }

  const toggle = async () => {
    setErr(false)
    if (!rec.recording) {
      if (!coach) return fail('Skapa en tränarprofil under Profil först.')
      if (!settings.openaiKey) return fail('Ange din API-nyckel under Profil först.')
      try { await rec.start(); setMsg('') } catch (e) { fail(e.message) }
      return
    }
    const info = await rec.stop()
    setBusy(true)
    const session = { ...info, coachId: coach.id, coach: coach.name, status: 'pending', parts: [] }
    await putSession(session)
    try { const s = await processSession(session, settings, setMsg); onDone(s.id) }
    catch (e) { fail(e.message + ' – ljudet är sparat. Försök igen från Dashboard.') }
    setBusy(false)
  }
  return (
    <div className="text-center">
      <p className="text-sm text-stone-500">Tränare: {coach?.name}</p>
      <div className="text-6xl font-mono my-6">{fmt(rec.elapsed)}</div>
      <button onClick={toggle} disabled={busy}
        className={`w-full rounded-3xl py-8 text-2xl font-bold text-white disabled:opacity-50 ${rec.recording ? 'bg-red-600' : 'bg-black'}`}>
        {rec.recording ? 'STOPPA TRÄNING' : 'STARTA TRÄNING'}
      </button>
      <p className={`mt-4 text-sm ${err ? 'text-red-600' : 'text-stone-500'}`}>
        {rec.recording ? '● Spelar in – lägg telefonen i fickan med skärmen tänd.' : msg || (busy ? 'Bearbetar…' : 'Redo.')}
      </p>
      <p className="mt-6 text-xs text-stone-500">Webbappar kan inte spela in med låst skärm. Skärmen hålls tänd under passet.</p>
    </div>
  )
}
