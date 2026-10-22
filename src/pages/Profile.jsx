import { useEffect, useState } from 'react'
import { save, uid } from '../lib/util'
import { PROVIDERS } from '../lib/providers'
import { cloudEnabled, auth, onAuthStateChanged, emailLogin, logout } from '../services/firebase'

export default function Profile({ coaches, activeId, setActive, onSaveCoach, onRemoveCoach, settings, setSettings, onSync }) {
  const [s, setS] = useState(settings), [ok, setOk] = useState(false)
  const [nc, setNc] = useState({ name: '', team: '' })
  const [user, setUser] = useState(null)
  const [em, setEm] = useState({ email: '', pw: '' })
  const [cloudMsg, setCloudMsg] = useState('')
  useEffect(() => (cloudEnabled ? onAuthStateChanged(auth, setUser) : undefined), [])

  const P = PROVIDERS[s.provider] || PROVIDERS.proxy
  const isProxy = s.provider === 'proxy'
  const keyField = s.provider === 'openai' ? 'openaiKey' : 'groqKey'
  const submit = () => { save('gif_settings', s); setSettings(s); setOk(true); setTimeout(() => setOk(false), 1500) }
  const add = () => { if (!nc.name.trim()) return; const c = { id: uid(), name: nc.name.trim(), team: nc.team.trim() }; onSaveCoach(c); setActive(c.id); setNc({ name: '', team: '' }) }
  const sync = async () => { setCloudMsg('Synkar…'); const r = await onSync(); setCloudMsg(r.ok ? 'Synkad ✓' : r.reason) }
  const login = async () => {
    try { await emailLogin(em.email.trim(), em.pw); setCloudMsg('Inloggad.'); await sync() } catch (e) { setCloudMsg(e.code || e.message) }
  }
  const f = (st, set, k, label, type = 'text', ph = '') => (
    <label className="block mb-3 text-sm text-stone-500">{label}
      <input className="input mt-1 text-stone-900 dark:text-stone-100" type={type} placeholder={ph} value={st[k] || ''} onChange={(e) => set({ ...st, [k]: e.target.value })} /></label>
  )
  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Tränare</h1>
      <div className="card">
        {coaches.map((c) => (
          <div key={c.id} className="flex items-center gap-2 py-1">
            <button className={`flex-1 text-left ${c.id === activeId ? 'font-bold text-emerald-600' : ''}`} onClick={() => setActive(c.id)}>
              {c.id === activeId ? '● ' : '○ '}{c.name}{c.team ? ` · ${c.team}` : ''}</button>
            {coaches.length > 1 && <button className="text-red-600 text-sm" onClick={() => confirm(`Radera ${c.name} och alla pass?`) && onRemoveCoach(c.id)}>Radera</button>}
          </div>
        ))}
        <div className="border-t border-stone-200 dark:border-stone-800 mt-2 pt-3">
          {f(nc, setNc, 'name', 'Ny tränare – namn')}{f(nc, setNc, 'team', 'Lag / åldersgrupp')}
          <button className="btn !py-2 text-sm" onClick={add}>Lägg till tränare</button>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-2">AI-tjänst</h2>
      <div className="card">
        <label className="block mb-3 text-sm text-stone-500">Leverantör
          <select className="input mt-1 text-stone-900 dark:text-stone-100" value={s.provider} onChange={(e) => setS({ ...s, provider: e.target.value, model: '' })}>
            {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select></label>
        {isProxy
          ? f(s, setS, 'accessCode', 'Åtkomstkod (bara om klubben har satt en)', 'password', 'lämna tomt om ingen kod behövs')
          : <>{f(s, setS, keyField, (s.provider === 'openai' ? 'OpenAI' : 'Groq') + ' API-nyckel', 'password', s.provider === 'openai' ? 'sk-...' : 'gsk_...')}
            <p className="text-xs text-stone-500 mb-3">Skaffa nyckel: {P.keyUrl}</p></>}
        {!isProxy && f(s, setS, 'model', 'Chattmodell (valfritt)', 'text', P.chat)}
        {f(s, setS, 'vocab', 'Fackord för Whisper (valfritt)', 'text', 'press, omställning, överlapp …')}
        <p className="text-xs text-stone-500">{isProxy ? 'Ingen nyckel behövs – analysen körs via klubbens server.' : 'Nyckeln lagras bara på enheten och synkas aldrig till molnet.'}</p>
      </div>
      <button className="btn w-full mb-6" onClick={submit}>{ok ? 'Sparat ✓' : 'Spara inställningar'}</button>

      <h2 className="text-lg font-bold mb-2">Molnsynk (Firebase)</h2>
      <div className="card">
        {!cloudEnabled ? <p className="text-sm text-stone-500">Avstängd – lägg Firebase-nycklar i <code>.env</code> (se README).</p> : (
          <>
            <p className="text-sm mb-2">{user ? (user.isAnonymous ? 'Anonymt konto – datan följer inte med om du byter telefon.' : 'Inloggad: ' + user.email) : 'Ansluter…'}</p>
            {(!user || user.isAnonymous) && <>{f(em, setEm, 'email', 'E-post', 'email')}{f(em, setEm, 'pw', 'Lösenord (minst 6 tecken)', 'password')}
              <button className="btn !py-2 text-sm mr-2" onClick={login}>Logga in / skapa konto</button></>}
            <button className="btn !py-2 text-sm mr-2" onClick={sync}>Synka nu</button>
            {user && !user.isAnonymous && <button className="text-sm text-stone-500" onClick={() => logout()}>Logga ut</button>}
            {cloudMsg && <p className="text-sm text-stone-500 mt-2">{cloudMsg}</p>}
          </>
        )}
      </div>
    </div>
  )
}
