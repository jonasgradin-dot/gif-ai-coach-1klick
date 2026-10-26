// Fördelning av tränarens språk under ett pass (ersätter Båstad-indexet).
export const KEYS = ['instruktion', 'oppen_fraga', 'sluten_fraga', 'positiv_specifik', 'positiv_generell']
export const LABEL = { instruktion: 'Instruktioner', oppen_fraga: 'Öppna frågor', sluten_fraga: 'Slutna frågor', positiv_specifik: 'Specifik feedback', positiv_generell: 'Allmän feedback' }
export const COLOR = { instruktion: '#1c1917', oppen_fraga: '#b45309', sluten_fraga: '#e3b15c', positiv_specifik: '#8b8176', positiv_generell: '#d9d2c5' } // svart = instruktion, guld = frågor, varmgrå/sand = feedback
export const MIN_UTTERANCES = 8 // färre än så → fördelningen markeras som osäker

export function countTypes(utterances) {
  const c = Object.fromEntries(KEYS.map((k) => [k, 0]))
  for (const u of utterances) if (u.typ in c) c[u.typ]++
  return c
}
export const total = (c) => KEYS.reduce((a, k) => a + (c[k] || 0), 0)
export const shares = (c) => { const t = total(c); return KEYS.map((k) => ({ k, n: c[k] || 0, pct: t ? Math.round((100 * (c[k] || 0)) / t) : 0 })) }
export const sumCounts = (list) => list.reduce((a, s) => { KEYS.forEach((k) => (a[k] = (a[k] || 0) + (s.counts?.[k] || 0))); return a }, {})

// Markeringar kopplade till spelarutbildningsplanen (valfri tagg per uttalande)
export const TAGS = ['forsok', 'lagkamrat', 'reflektion', 'fair_play', 'negativ']
export const TAG_LABEL = { forsok: 'Beröm av försök och mod', lagkamrat: 'Uppmuntran av lagkamrater', reflektion: 'Reflektionsfrågor', fair_play: 'Fair play och respekt', negativ: 'Kritiska tillrop' }
export const countTags = (utterances) => { const c = Object.fromEntries(TAGS.map((k) => [k, 0])); for (const u of utterances) if (u.tag in c) c[u.tag]++; return c }
