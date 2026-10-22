// Båstad-index v2 (0–100) = 60 % balans + 20 % frågekvalitet + 20 % feedbackkvalitet.
//  balans:           hur nära fördelningen frågor/instruktioner/positiv feedback är TARGET
//  frågekvalitet:    andel öppna frågor av alla frågor (60 % öppna = full poäng)
//  feedbackkvalitet: andel specifik feedback av all positiv feedback (50 % specifik = full poäng)
export const TARGET = { fragor: 0.3, instruktioner: 0.4, positiv: 0.3 }
export const MIN_UTTERANCES = 8 // färre än så → index markeras som osäkert

export function countTypes(utterances) {
  const c = { oppen_fraga: 0, sluten_fraga: 0, instruktion: 0, positiv_specifik: 0, positiv_generell: 0 }
  for (const u of utterances) if (u.typ in c) c[u.typ]++
  return c
}

export function bastadIndex(c) {
  const q = c.oppen_fraga + c.sluten_fraga, i = c.instruktion, p = c.positiv_specifik + c.positiv_generell, t = q + i + p
  if (!t) return { total: 0, parts: { balans: 0, fragekvalitet: 0, feedbackkvalitet: 0 }, lowData: true }
  const dist = Math.abs(q / t - TARGET.fragor) + Math.abs(i / t - TARGET.instruktioner) + Math.abs(p / t - TARGET.positiv)
  const parts = {
    balans: Math.round(100 * (1 - dist / 2)),
    fragekvalitet: q ? Math.round(Math.min(100, (c.oppen_fraga / q / 0.6) * 100)) : 0,
    feedbackkvalitet: p ? Math.round(Math.min(100, (c.positiv_specifik / p / 0.5) * 100)) : 0
  }
  const total = Math.round(0.6 * parts.balans + 0.2 * parts.fragekvalitet + 0.2 * parts.feedbackkvalitet)
  return { total, parts, lowData: t < MIN_UTTERANCES }
}
