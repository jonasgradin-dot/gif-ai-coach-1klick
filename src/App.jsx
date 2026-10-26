import { useEffect, useState, useCallback } from 'react'
import Dashboard from './pages/Dashboard'
import Train from './pages/Train'
import Report from './pages/Report'
import History from './pages/History'
import Profile from './pages/Profile'
import { allSessions, putSession } from './lib/db'
import { loadCoaches, saveCoach, removeCoach, removeSession, syncAll } from './lib/store'
import { load, uid } from './lib/util'

const TABS = [['dash', 'Start'], ['train', 'Träna'], ['hist', 'Historik'], ['profile', 'Profil']]
const unset = (c) => !c.name || c.name === 'Tränare'
const nm = (c) => (unset(c) ? 'Ny tränare' : c.name)

export default function App() {
  const [tab, setTab] = useState('dash')
  const [reportId, setReportId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [coaches, setCoaches] = useState([])
  const [activeId, setActiveId] = useState(localStorage.getItem('gif_active') || '')
  const [raw, setSettings] = useState(() => load('gif_settings', {})) // raw.accessCode = lösenordet (om klubben har ett)
  const settings = { provider: 'proxy', openaiKey: raw.accessCode || 'public' } // proxy: lösenordet skickas som Bearer

  const reload = useCallback(async () => setSessions(await allSessions()), [])
  const setActive = (id) => { setActiveId(id); localStorage.setItem('gif_active', id) }

  useEffect(() => {
    (async () => {
      let cs = loadCoaches()
      if (!cs.length) { const p = load('gif_profile', { name: '', team: '' }); cs = saveCoach({ id: uid(), name: p.name || '', team: p.team || '' }) }
      for (const s of await allSessions()) {
        let ch = false
        if (s.status === 'recording') { s.status = 'pending'; s.parts = []; ch = true }
        if (!s.coachId) { s.coachId = cs[0].id; ch = true }
        if (ch) await putSession(s)
      }
      const act = cs.find((c) => c.id === activeId) || cs[0]
      setCoaches(cs); setActive(act.id)
      if (unset(act)) setTab('profile') // första start: be om namn och lag
      await reload()
      const r = await syncAll()
      if (r.ok) { setCoaches(loadCoaches()); await reload() }
    })()
  }, [reload])

  const coach = coaches.find((c) => c.id === activeId) || coaches[0]
  const mine = sessions.filter((s) => s.coachId === coach?.id)
  const open = (id) => { setReportId(id); setTab('report') }
  const done = (id) => { reload(); open(id) }
  const onNewCoach = () => { const c = { id: uid(), name: '', team: '' }; setCoaches(saveCoach(c)); setActive(c.id); setTab('profile') }
  const onRemoveCoach = async (id) => {
    for (const s of sessions.filter((x) => x.coachId === id)) await removeSession(s.id, id)
    const rest = removeCoach(id); setCoaches(rest); if (id === activeId) setActive(rest[0].id); await reload()
  }
  const shown = coach && !unset(coach) ? coach : null

  return (
    <div className="max-w-xl mx-auto pb-24 min-h-screen">
      <div className="pitch" aria-hidden="true" />
      <header className="bg-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <img src="/logo.png" alt="Båstads GIF" className="h-11 w-auto" />
          <div className="flex-1 leading-tight">
            <div className="font-extrabold uppercase tracking-wide">Båstads GIF</div>
            <div className="text-xs font-semibold text-gold-700 uppercase tracking-widest">AI Coach</div>
          </div>
          {coaches.length > 1 && (
            <select className="input !w-auto !py-1 text-sm max-w-[9rem]" value={coach?.id || ''} aria-label="Tränare"
              onChange={(e) => { setActive(e.target.value); if (tab === 'report') setTab('dash') }}>
              {coaches.map((c) => <option key={c.id} value={c.id}>{nm(c)}</option>)}
            </select>
          )}
        </div>
        <div className="stripes" />
      </header>
      <main className="p-4">
        {tab === 'dash' && <Dashboard {...{ settings, open, reload }} coach={shown} sessions={mine} goTrain={() => setTab('train')} goHistory={() => setTab('hist')} />}
        {tab === 'train' && <Train {...{ settings }} coach={shown} onDone={done} />}
        {tab === 'hist' && <History coach={shown} sessions={mine} open={open} />}
        {tab === 'report' && <Report session={sessions.find((s) => s.id === reportId)} settings={settings} back={() => setTab('hist')} reload={reload} />}
        {tab === 'profile' && <Profile {...{ coach, coaches, onNewCoach, onRemoveCoach }} settings={raw} setSettings={setSettings} onSaveCoach={(c) => setCoaches(saveCoach(c))} onSaved={() => setTab('dash')} />}
      </main>
      <nav className="fixed bottom-0 inset-x-0 bg-black text-white pb-[env(safe-area-inset-bottom)]">
        <div className="flex max-w-xl mx-auto">
          {TABS.map(([k, l]) => {
            const on = tab === k || (tab === 'report' && k === 'hist')
            return <button key={k} onClick={() => setTab(k)} className={`flex-1 py-4 text-sm border-t-4 ${on ? 'border-gold-500 font-bold' : 'border-transparent text-stone-400'}`}>{l}</button>
          })}
        </div>
      </nav>
    </div>
  )
}
