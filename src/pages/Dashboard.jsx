import { useState } from 'react'
import TrendChart from '../components/TrendChart'
import InstallButton from '../components/InstallButton'
import { when, fmt } from '../lib/util'
import { processSession } from '../lib/analyze'

export default function Dashboard({ sessions, settings, coach, open, reload, goTrain, goHistory }) {
  const [msg, setMsg] = useState('')
  const all = sessions.filter((s) => s.status !== 'recording').sort((a, b) => a.start - b.start)
  const done = all.filter((s) => s.status === 'done')
  const rows = [...all.filter((s) => s.status !== 'done'), ...done.slice(-3).reverse()]
  const avg = done.length ? Math.round(done.reduce((a, s) => a + s.index, 0) / done.length) : '–'
  const retry = async (s) => {
    if (!settings.openaiKey) return setMsg('Ange din API-nyckel under Profil.')
    try { await processSession(s, settings, setMsg); setMsg('') } catch (e) { setMsg(e.message) }
    reload()
  }
  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Hej{coach?.name ? ', ' + coach.name : ''}!</h1>
      <InstallButton />
      <button className="btn w-full mb-3" onClick={goTrain}>Starta träning</button>
      <div className="flex gap-2 mb-3">
        {[['Senaste', done.length ? done[done.length - 1].index : '–'], ['Snitt', avg], ['Pass', done.length]].map(([l, v]) => (
          <div key={l} className="card flex-1 text-center !mb-0"><b className="block text-2xl text-emerald-600">{v}</b><span className="text-xs text-stone-500">{l}</span></div>
        ))}
      </div>
      <div className="card"><h2 className="font-semibold mb-1">Utveckling</h2><TrendChart data={done} /></div>
      {msg && <p className="text-red-600 text-sm mb-2">{msg}</p>}
      {rows.map((s) => (
        <div key={s.id} className="card flex items-center justify-between">
          <div onClick={() => s.status === 'done' && open(s.id)} className="flex-1">{when(s.start)}{s.dur ? ' · ' + fmt(s.dur) : ''}</div>
          {s.status === 'done' ? <b className="text-xl text-emerald-600">{s.index}</b>
            : <button className="btn !py-1 !px-3 text-sm" onClick={() => retry(s)}>Försök igen</button>}
        </div>
      ))}
      {done.length > 3 && <button className="text-emerald-700 text-sm" onClick={goHistory}>Se all historik →</button>}
    </div>
  )
}
