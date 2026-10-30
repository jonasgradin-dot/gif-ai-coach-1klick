// Lagringslager: IndexedDB är källan på enheten, Firestore speglar (users/{uid}/sessions|coaches).
// Borttagningar sparas som "tombstones" så att andra enheter också tar bort posten.
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore'
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

// --- Delning med klubbens administratör (top-level: members/{coachId}, reports/{sessionId}) ---
// Delas: AI-rapport, fördelning, fokusområden, markeringar. Delas INTE: ljud, transkribering, enskilda uttalanden, talad reflektion.
async function shared(name, id, data) {
  if (!cloudEnabled) return false
  try {
    const u = await whenAuthed(); if (!u) return false
    await setDoc(doc(db, name, id), clone({ ...data, ownerUid: u.uid })); return true
  } catch (e) { console.warn('Firestore:', e.message); return false }
}
const SH = 'gif_shared'
const sharedIds = () => { try { return new Set(JSON.parse(localStorage.getItem(SH) || '[]')) } catch { return new Set() } }
const markShared = (id) => { const s = sharedIds(); s.add(id); localStorage.setItem(SH, JSON.stringify([...s])) }

export async function shareReport(s) {
  if (!cloudEnabled || s.status !== 'done' || s.v !== 2 || !s.counts) return
  const coach = loadCoaches().find((c) => c.id === s.coachId)
  const ok = await shared('reports', s.id, {
    id: s.id, coachId: s.coachId, coachName: s.coach || coach?.name || '', team: s.team || coach?.team || '', start: s.start, dur: s.dur || 0,
    v: 2, status: 'done', band: s.band || null, counts: s.counts, tags: s.tags || null, fokusCount: s.fokusCount || null,
    skills: s.skills || [], nytta: s.nytta ?? 0, audio: s.audio || null, filtered: s.filtered || null, lowData: !!s.lowData, report: s.report || {}, updatedAt: s.updatedAt || Date.now()
  })
  if (ok) markShared(s.id)
}
export function touchMember(coach, force = false) {
  if (!cloudEnabled || !coach || !coach.name || coach.name === 'Tränare') return
  const k = 'gif_touch_' + coach.id, last = +localStorage.getItem(k) || 0
  if (!force && Date.now() - last < 36e5) return // högst en gång per timme
  localStorage.setItem(k, String(Date.now()))
  return shared('members', coach.id, { coachId: coach.id, name: coach.name, team: coach.team || '', firstSeen: coach.createdAt || Date.now(), lastActive: Date.now() })
}
const unshare = async (name, id) => { if (!cloudEnabled) return; try { await whenAuthed(); await deleteDoc(doc(db, name, id)) } catch (e) { console.warn('Firestore:', e.message) } }

export async function saveSession(s) { s.updatedAt = Date.now(); await putSession(s); push('sessions', s); shareReport(s) }
export async function removeSession(id, coachId) {
  await delSession(id)
  push('sessions', { id, coachId, deleted: true, updatedAt: Date.now() })
  unshare('reports', id)
}

export const loadCoaches = () => { try { const l = JSON.parse(localStorage.getItem(LC) || '[]'); return Array.isArray(l) ? l.filter((c) => c && typeof c.id === 'string') : [] } catch { return [] } } // tål trasig lagrad data
const storeCoaches = (l) => localStorage.setItem(LC, JSON.stringify(l))
export function saveCoach(c) {
  const l = loadCoaches().filter((x) => x.id !== c.id); const item = { ...c, updatedAt: Date.now(), createdAt: c.createdAt || Date.now() }
  l.push(item); storeCoaches(l); push('coaches', item); touchMember(item, true); return l
}
export function removeCoach(id) {
  const l = loadCoaches().filter((c) => c.id !== id); storeCoaches(l)
  push('coaches', { id, deleted: true, updatedAt: Date.now() }); unshare('members', id); return l
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
    const done = sharedIds()
    local.filter((l) => l.status === 'done' && l.v === 2 && !done.has(l.id)).forEach((l) => shareReport(l)) // äldre rapporter delas första gången
    return { ok: true }
  } catch (e) { return { ok: false, reason: e.message } }
}
