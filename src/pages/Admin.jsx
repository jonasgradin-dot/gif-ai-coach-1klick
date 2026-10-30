import { useEffect, useMemo, useState } from 'react'
import ReportCard from '../components/ReportCard'
import DistributionBar from '../components/DistributionBar'
import { cloudEnabled } from '../services/firebase'
import { adminUser, adminSignIn, adminSignOut, isAdmin, loadAll } from '../lib/admin'
import { overview, ago } from '../lib/overview'
import { when, fmt } from '../lib/util'

const Stat = ({ label, value }) => <div className="card !mb-0 text-center"><b className="block text-2xl">{value}</b><span className="text-xs text-stone-500">{label}</span></div>
const who = (c) => c.name + (c.team ? ' · ' + c.team : '')

export default function Admin({ back }) {
  const [phase, setPhase] = useState('init') // init | off | login | no | ready
  const [user, setUser] = useState(null)
  const [data, setData] = useState({ members: [], reports: [] })
  const [form, setForm] = useState({ email: '', pw: '' })
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('coaches')
  const [coachId, setCoachId] = useState(null)
  const [reportId, setReportId] = useState(null)

  const refresh = async () => { setErr(''); try { setData(await loadAll()) } catch (e) { setErr('Kunde inte hämta data: ' + (e.code || e.message)) } }
  const enter = async (u) => { setUser(u); if (await isAdmin(u.uid)) { setPhase('ready'); refresh() } else setPhase('no') }
  useEffect(() => {
    if (!cloudEnabled) return setPhase('off')
    adminUser().then((u) => (u ? enter(u) : setPhase('login'))).catch((e) => { setErr(e.message); setPhase('login') })
  }, [])
  const login = async () => {
    setErr('')
    try { const c = await adminSignIn(form.email.trim(), form.pw); await enter(c.user) }
    catch (e) { setErr(/invalid|wrong|not-found/.test(e.code || '') ? 'Fel e-post eller lösenord.' : e.code || e.message) }
  }
  const logout = async () => { await adminSignOut(); setUser(null); setPhase('login'); setCoachId(null); setReportId(null) }

  const ov = useMemo(() => overview(data.members, data.reports), [data])
  const report = data.reports.find((r) => r.id === reportId)
  const coach = ov.coaches.find((c) => c.coachId === coachId)

  const Shell = ({ children }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-extrabold">Administratör</h1>
        <button className="text-sm underline" onClick={back}>Stäng</button>
      </div>
      {children}
    </div>
  )

  if (phase === 'init') return <Shell><p className="text-stone-700">Laddar…</p></Shell>
  if (phase === 'off') return <Shell><div className="card text-sm">Molnsynk är inte konfigurerad. Lägg in Firebase-nycklarna (se README) för att kunna se tränarnas rapporter.</div></Shell>
  if (phase === 'login') return (
    <Shell>
      <div className="card">
        <label className="block mb-4 font-semibold">E-post<input className="input mt-1 font-normal" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="username" /></label>
        <label className="block font-semibold">Lösenord<input className="input mt-1 font-normal" type="password" value={form.pw} onChange={(e) => setForm({ ...form, pw: e.target.value })} autoComplete="current-password" /></label>
      </div>
      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}
      <button className="btn w-full" onClick={login} disabled={!form.email || !form.pw}>Logga in</button>
    </Shell>
  )
  if (phase === 'no') return (
    <Shell>
      <div className="card text-sm"><p className="mb-2">Kontot <b>{user?.email}</b> är inte administratör.</p>
        <p className="mb-2">Lägg till dokumentet <code>admins/{user?.uid}</code> i Firestore (se README) och logga in igen.</p></div>
      <button className="btn w-full" onClick={logout}>Logga ut</button>
    </Shell>
  )

  // ---- ready ----
  if (report) return (
    <Shell>
      <button className="font-semibold text-gold-700 mb-2" onClick={() => setReportId(null)}>← Tillbaka</button>
      <p className="text-sm text-stone-700 mb-2"><b>{report.coachName}</b>{report.team ? ' · ' + report.team : ''} · {when(report.start)}{report.dur ? ' · ' + fmt(report.dur) : ''}</p>
      <div className="card"><ReportCard s={report} /></div>
    </Shell>
  )
  const list = (rs, showCoach) => rs.length === 0 ? <p className="text-stone-700 text-sm">Inga rapporter än.</p> : rs.map((r) => (
    <div key={r.id} className="card cursor-pointer" onClick={() => setReportId(r.id)}>
      <div className="text-sm text-stone-500 mb-1">{showCoach ? <b className="text-black">{who({ name: r.coachName || 'Okänd', team: r.team })}</b> : null}{showCoach ? ' · ' : ''}{when(r.start)}</div>
      {r.counts && <div className="mb-2"><DistributionBar counts={r.counts} h="h-3" /></div>}
      <p className="text-sm line-clamp-2">{r.report?.sammanfattning}</p>
    </div>
  ))

  if (coach) return (
    <Shell>
      <button className="font-semibold text-gold-700 mb-2" onClick={() => setCoachId(null)}>← Alla tränare</button>
      <div className="card">
        <h2 className="text-xl font-bold">{who(coach)}</h2>
        <p className="text-sm text-stone-600 mb-2">{coach.count} rapporter · senast aktiv {ago(coach.lastActive)}{coach.firstSeen ? ' · med sedan ' + new Date(coach.firstSeen).toLocaleDateString('sv-SE') : ''}</p>
        <DistributionBar counts={coach.counts} />
      </div>
      {list(coach.reports, false)}
    </Shell>
  )

  const all = data.reports.slice().sort((a, b) => b.start - a.start)
  return (
    <Shell>
      <div className="flex gap-2 mb-3 text-sm">
        <button className="btn !py-1 !px-3" onClick={refresh}>Uppdatera</button>
        <button className="underline" onClick={logout}>Logga ut</button>
      </div>
      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Stat label="Tränare" value={ov.totals.coaches} /><Stat label="Aktiva senaste 30 dagarna" value={ov.totals.active30} />
        <Stat label="Rapporter" value={ov.totals.reports} /><Stat label="Rapporter senaste 30 dagarna" value={ov.totals.reports30} />
      </div>
      <div className="flex gap-2 mb-3">
        {[['coaches', 'Tränare'], ['reports', 'Alla rapporter']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-xl py-2 text-sm font-semibold border ${tab === k ? 'bg-black text-white border-black' : 'bg-white border-sand-300'}`}>{l}</button>
        ))}
      </div>
      {tab === 'coaches' ? (ov.coaches.length === 0 ? <p className="text-stone-700 text-sm">Inga tränare har anslutit än.</p> : ov.coaches.map((c) => (
        <div key={c.coachId} className="card cursor-pointer" onClick={() => setCoachId(c.coachId)}>
          <div className="flex justify-between"><b>{who(c)}</b><span className="text-sm text-stone-500">{c.count} rapporter</span></div>
          <div className="text-xs text-stone-500 mb-2">Senast aktiv {ago(c.lastActive)}{c.lastReport ? ' · senaste rapport ' + ago(c.lastReport) : ' · ingen rapport än'}</div>
          <DistributionBar counts={c.counts} h="h-2" />
        </div>
      ))) : list(all, true)}
    </Shell>
  )
}
