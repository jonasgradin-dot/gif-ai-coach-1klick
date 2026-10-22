// Lagringslager: IndexedDB är källan på enheten, Firestore speglar (users/{uid}/sessions|coaches).
// Borttagningar sparas som "tombstones" så att andra enheter också tar bort posten.
import { collection, doc, setDoc, getDocs } from 'firebase/firestore'
import { cloudEnabled, db, whenAuthed } from '../services/firebase'
import { putSession, allSessions, delSession } from './db'

const LC = 'gif_coaches'
const clone = (o) => JSON.parse(JSON.stringify(o)) // tar bort undefined (Firestore tillåter inte det)
const strip = ({ segments, chunkSegs, parts, ...rest }) => clone(rest) // tunga hjälpfält stannar på enheten

async function push(name, obj) {
  if (!cloudEnabled) return
  try {
    const u = await whenAuthed(); if (!u) return
    await setDoc(doc(collection(db, 'users', u.uid, name), obj.id), name === 'sessions' ? strip(obj) : clone(obj))
  } catch (e) { console.warn('Firestore:', e.message) }
}

export async function saveSession(s) { s.updatedAt = Date.now(); await putSession(s); push('sessions', s) }
export async function removeSession(id, coachId) {
  await delSession(id)
  push('sessions', { id, coachId, deleted: true, updatedAt: Date.now() })
}

export const loadCoaches = () => { try { return JSON.parse(localStorage.getItem(LC) || '[]') } catch { return [] } }
const storeCoaches = (l) => localStorage.setItem(LC, JSON.stringify(l))
export function saveCoach(c) {
  const l = loadCoaches().filter((x) => x.id !== c.id); const item = { ...c, updatedAt: Date.now() }
  l.push(item); storeCoaches(l); push('coaches', item); return l
}
export function removeCoach(id) {
  const l = loadCoaches().filter((c) => c.id !== id); storeCoaches(l)
  push('coaches', { id, deleted: true, updatedAt: Date.now() }); return l
}

// Tvåvägssynk: hämtar nyare poster från molnet, skickar upp lokala som saknas/är nyare.
export async function syncAll() {
  if (!cloudEnabled) return { ok: false, reason: 'Molnsynk är inte konfigurerad.' }
  try {
    const u = await whenAuthed(); if (!u) return { ok: false, reason: 'Ej inloggad (offline?).' }
    const [rs, rc] = await Promise.all([getDocs(collection(db, 'users', u.uid, 'sessions')), getDocs(collection(db, 'users', u.uid, 'coaches'))])
    const local = await allSessions(), lmap = new Map(local.map((s) => [s.id, s])), rmap = new Map()
    for (const d of rs.docs) {
      const r = d.data(), l = lmap.get(r.id); rmap.set(r.id, r)
      if (r.deleted) { if (l) await delSession(l.id); continue }
      if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) await putSession({ ...l, ...r })
    }
    for (const l of local) {
      if (l.status !== 'done') continue
      const r = rmap.get(l.id)
      if (!r || (!r.deleted && (l.updatedAt || 0) > (r.updatedAt || 0))) push('sessions', l)
    }
    let lc = loadCoaches(); const have = new Set(lc.map((c) => c.id)), gone = new Set(), rids = new Set()
    for (const d of rc.docs) { const c = d.data(); rids.add(c.id); if (c.deleted) gone.add(c.id); else if (!have.has(c.id)) lc.push(c) }
    lc = lc.filter((c) => !gone.has(c.id)); storeCoaches(lc)
    lc.filter((c) => !rids.has(c.id)).forEach((c) => push('coaches', c))
    return { ok: true }
  } catch (e) { return { ok: false, reason: e.message } }
}
