import { useEffect, useState } from 'react'
import { save } from '../lib/util'

const clean = (n) => (n === 'Tränare' ? '' : n || '') // äldre standardnamn räknas som "inte ifyllt"

export default function Profile({ coach, coaches, settings, setSettings, onSaveCoach, onNewCoach, onRemoveCoach }) {
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [pw, setPw] = useState('')
  const [ok, setOk] = useState(false)
  useEffect(() => { setName(clean(coach?.name)); setTeam(coach?.team || ''); setPw(settings.accessCode || '') }, [coach?.id])

  const submit = () => {
    if (!name.trim() || !coach) return
    onSaveCoach({ ...coach, name: name.trim(), team: team.trim() })
    const s = { ...settings, accessCode: pw }; save('gif_settings', s); setSettings(s)
    setOk(true); setTimeout(() => setOk(false), 1500)
  }
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-3">Profil</h1>
      <div className="card">
        <label className="block mb-4 font-semibold">Namn
          <input className="input mt-1 font-normal" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="För- och efternamn" /></label>
        <label className="block mb-4 font-semibold">Lag
          <input className="input mt-1 font-normal" value={team} onChange={(e) => setTeam(e.target.value)} autoComplete="off" placeholder="T.ex. P12 eller Herrar A" /></label>
        <label className="block font-semibold">Lösenord <span className="font-normal text-neutral-500">(om du fått ett av klubben)</span>
          <input className="input mt-1 font-normal" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" /></label>
      </div>
      <button className="btn w-full" onClick={submit} disabled={!name.trim()}>{ok ? 'Sparat ✓' : 'Spara'}</button>
      <div className="mt-6 text-sm flex gap-4">
        <button className="underline" onClick={onNewCoach}>+ Lägg till ytterligare tränare</button>
        {coaches.length > 1 && coach && <button className="underline text-red-600" onClick={() => confirm(`Radera ${coach.name || 'tränaren'} och alla pass?`) && onRemoveCoach(coach.id)}>Radera denna</button>}
      </div>
    </div>
  )
}
