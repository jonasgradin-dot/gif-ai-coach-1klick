import { useState } from 'react'
import DistributionChart from '../components/DistributionChart'
import DistributionBar from '../components/DistributionBar'
import InstallButton from '../components/InstallButton'
import { when, fmt } from '../lib/util'
import { processSession } from '../lib/analyze'
import { shares, total } from '../lib/distribution'

export default function Dashboard({ sessions, settings, coach, open, reload, goTrain, goHistory }) {
  const [msg, setMsg] = useState('')
  const all = sessions.filter((s) => s.status !== 'recording').sort((a, b) => a.start - b.start)
  const done = all.filter((s) => s.status === 'done')
  const rows = [...all.filter((s) => s.status !== 'done'), ...done.slice(-3).reverse()]
  const last = done.filter((s) => s.counts && total(s.counts) > 0).pop()
  const sh = last ? shares(last.counts) : null
  const grp = sh && [['Frågor', sh[1].pct + sh[2].pct], ['Instruktioner', sh[0].pct], ['Feedback', sh[3].pct + sh[4].pct]]
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
      <div className="card">
        <h2 className="font-semibold mb-2">Senaste passet <span className="text-sm font-normal text-stone-500">· {done.length} pass totalt</span></h2>
        {grp ? (
          <><div className="flex gap-2 mb-2">{grp.map(([l, v]) => (
            <div key={l} className="flex-1 rounded-xl bg-sand-100 p-2 text-center"><b className="block text-xl">{v} %</b><span className="text-xs text-stone-500">{l}</span></div>
          ))}</div><DistributionBar counts={last.counts} /></>
        ) : <p className="text-sm text-stone-500">Inget analyserat pass än.</p>}
      </div>
      <div className="card"><h2 className="font-semibold mb-1">Fördelning över tid</h2><DistributionChart sessions={done} /></div>
      {msg && <p className="text-red-600 text-sm mb-2">{msg}</p>}
      {rows.map((s) => (
        <div key={s.id} className="card flex items-center justify-between">
          <div onClick={() => s.status === 'done' && open(s.id)} className="flex-1">{when(s.start)}{s.dur ? ' · ' + fmt(s.dur) : ''}</div>
          {s.status === 'done' ? <span className="text-sm font-semibold text-gold-700" onClick={() => open(s.id)}>Visa →</span>
            : <button className="btn !py-1 !px-3 text-sm" onClick={() => retry(s)}>Försök igen</button>}
        </div>
      ))}
      {done.length > 3 && <button className="text-gold-700 font-semibold text-sm" onClick={goHistory}>Se all historik →</button>}
    </div>
  )
}
