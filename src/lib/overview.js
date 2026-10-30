// Sammanställning för administratörsvyn. Ren logik (inga Firebase-beroenden) så att den går att testa.
import { sumCounts } from './distribution'
export const DAY = 864e5

export function overview(members, reports, now = Date.now()) {
  const map = new Map()
  const get = (id) => { if (!map.has(id)) map.set(id, { coachId: id, name: '', team: '', firstSeen: 0, lastActive: 0, reports: [] }); return map.get(id) }
  for (const m of members) { const c = get(m.coachId || m.id); c.name = m.name || c.name; c.team = m.team || c.team; c.firstSeen = m.firstSeen || c.firstSeen; c.lastActive = Math.max(c.lastActive, m.lastActive || 0) }
  for (const r of reports) { const c = get(r.coachId); c.name = c.name || r.coachName || ''; c.team = c.team || r.team || ''; c.reports.push(r) }
  const coaches = [...map.values()].map((c) => {
    c.reports.sort((a, b) => b.start - a.start)
    const lastReport = c.reports[0]?.start || 0
    return { ...c, name: c.name || 'Okänd tränare', count: c.reports.length, lastReport, lastActive: Math.max(c.lastActive, lastReport), counts: sumCounts(c.reports) }
  }).sort((a, b) => b.lastActive - a.lastActive)
  const since = now - 30 * DAY
  return {
    coaches,
    totals: { coaches: coaches.length, active30: coaches.filter((c) => c.lastActive >= since).length, reports: reports.length, reports30: reports.filter((r) => r.start >= since).length }
  }
}

export function ago(t, now = Date.now()) {
  if (!t) return '–'
  const d = Math.floor((now - t) / DAY)
  if (d < 1) return 'idag'
  if (d === 1) return 'igår'
  if (d < 30) return `${d} dagar sedan`
  return new Date(t).toLocaleDateString('sv-SE')
}
