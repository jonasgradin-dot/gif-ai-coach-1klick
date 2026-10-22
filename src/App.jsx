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

export default function App() {
  const [tab, setTab] = useState('dash')
  const [reportId, setReportId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [coaches, setCoaches] = useState([])
  const [activeId, setActiveId] = useState(localStorage.getItem('gif_active') || '')
  const [raw, setSettings] = useState(() => { // raw = sparade inställningar; settings = med aktiv leverantörs nyckel
    const s = load('gif_settings', {})
    return { ...s, provider: s.provider || (s.openaiKey ? 'openai' : s.groqKey ? 'groq' : 'proxy'), openaiKey: s.openaiKey || import.meta.env.VITE_OPENAI_API_KEY || '' }
  })
  const settings = { ...raw, openaiKey: raw.provider === 'proxy' ? raw.accessCode || 'public' : raw.provider === 'groq' ? raw.groqKey : raw.openaiKey } // proxy: åtkomstkoden skickas som Bearer

  const reload = useCallback(async () => setSessions(await allSessions()), [])
  const setActive = (id) => { setActiveId(id); localStorage.setItem('gif_active', id) }

  useEffect(() => {
    (async () => {
      let cs = loadCoaches() // migrera v1/v2-profil till första tränaren
      if (!cs.length) { const p = load('gif_profile', { name: '', team: '' }); cs = saveCoach({ id: uid(), name: p.name || 'Tränare', team: p.team || '' }) }
      for (const s of await allSessions()) {
        let ch = false
        if (s.status === 'recording') { s.status = 'pending'; s.parts = []; ch = true }
        if (!s.coachId) { s.coachId = cs[0].id; ch = true }
        if (ch) await putSession(s)
      }
      setCoaches(cs); if (!cs.some((c) => c.id === activeId)) setActive(cs[0].id)
      await reload()
      const r = await syncAll()
      if (r.ok) { setCoaches(loadCoaches()); await reload() }
    })()
  }, [reload])

  const coach = coaches.find((c) => c.id === activeId) || coaches[0]
  const mine = sessions.filter((s) => s.coachId === coach?.id)
  const open = (id) => { setReportId(id); setTab('report') }
  const done = (id) => { reload(); open(id) }
  const onSync = async () => { const r = await syncAll(); setCoaches(loadCoaches()); await reload(); return r }
  const onRemoveCoach = async (id) => {
    for (const s of sessions.filter((x) => x.coachId === id)) await removeSession(s.id, id)
    const rest = removeCoach(id); setCoaches(rest); if (id === activeId) setActive(rest[0].id); await reload()
  }

  return (
    <div className="max-w-xl mx-auto pb-24">
      <header className="px-4 pt-3">
        <select className="input !py-1 text-sm" value={coach?.id || ''} onChange={(e) => { setActive(e.target.value); if (tab === 'report') setTab('dash') }} aria-label="Tränare">
          {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}{c.team ? ` · ${c.team}` : ''}</option>)}
        </select>
      </header>
      <main className="p-4">
        {tab === 'dash' && <Dashboard {...{ settings, coach, open, reload }} sessions={mine} goTrain={() => setTab('train')} goHistory={() => setTab('hist')} />}
        {tab === 'train' && <Train {...{ coach, settings }} onDone={done} />}
        {tab === 'hist' && <History coach={coach} sessions={mine} open={open} />}
        {tab === 'report' && <Report session={sessions.find((s) => s.id === reportId)} settings={settings} back={() => setTab('hist')} reload={reload} />}
        {tab === 'profile' && <Profile {...{ coaches, activeId: coach?.id, setActive, settings: raw, setSettings, onSync, onRemoveCoach }} onSaveCoach={(c) => setCoaches(saveCoach(c))} />}
      </main>
      <nav className="fixed bottom-0 inset-x-0 flex bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 py-4 text-sm ${tab === k ? 'text-emerald-600 font-semibold' : 'text-stone-500'}`}>{l}</button>
        ))}
      </nav>
    </div>
  )
}
