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

// Fokusområden ur spelarutbildningsplanen (hur tränarens uttalanden fördelar sig över dem)
export const FOKUS_LABEL = { bollbehandling: 'Bollbehandling', lekar: 'Lekar med boll', spel: 'Spel', lagdelar: 'Lagdelar', kollektiva: 'Kollektiva förflyttningar', organisation: 'Organisation och praktiskt', annat: 'Övrigt' }
export const countFokus = (u) => { const c = Object.fromEntries(Object.keys(FOKUS_LABEL).map((k) => [k, 0])); for (const x of u) c[x.fokus in c ? x.fokus : 'annat']++; return c }
export const topSkills = (u, n = 6) => { const m = {}; for (const x of u) if (x.farg) m[x.farg] = (m[x.farg] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([namn, antal]) => ({ namn, antal })) }
export const countNytta = (u) => u.filter((x) => x.nytta).length
