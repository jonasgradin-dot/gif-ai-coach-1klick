// Fördelning av tränarens språk under ett pass (ersätter Båstad-indexet).
export const KEYS = ['instruktion', 'oppen_fraga', 'sluten_fraga', 'positiv_specifik', 'positiv_generell']
export const LABEL = { instruktion: 'Instruktioner', oppen_fraga: 'Öppna frågor', sluten_fraga: 'Slutna frågor', positiv_specifik: 'Specifik feedback', positiv_generell: 'Allmän feedback' }
export const COLOR = { instruktion: '#111111', oppen_fraga: '#525252', sluten_fraga: '#8a8a8a', positiv_specifik: '#bdbdbd', positiv_generell: '#e2e2e2' }
export const MIN_UTTERANCES = 8 // färre än så → fördelningen markeras som osäker

export function countTypes(utterances) {
  const c = Object.fromEntries(KEYS.map((k) => [k, 0]))
  for (const u of utterances) if (u.typ in c) c[u.typ]++
  return c
}
export const total = (c) => KEYS.reduce((a, k) => a + (c[k] || 0), 0)
export const shares = (c) => { const t = total(c); return KEYS.map((k) => ({ k, n: c[k] || 0, pct: t ? Math.round((100 * (c[k] || 0)) / t) : 0 })) }
export const sumCounts = (list) => list.reduce((a, s) => { KEYS.forEach((k) => (a[k] = (a[k] || 0) + (s.counts?.[k] || 0))); return a }, {})
