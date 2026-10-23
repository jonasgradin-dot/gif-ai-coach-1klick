import { KEYS, LABEL, COLOR, total } from '../lib/distribution'

// Staplad stapel (100 %) över de fem språktyperna.
export default function DistributionBar({ counts, h = 'h-6' }) {
  const t = total(counts)
  if (!t) return <div className={`${h} rounded bg-stone-200 dark:bg-stone-800`} />
  return (
    <div className={`flex ${h} rounded overflow-hidden`} role="img" aria-label={KEYS.map((k) => `${LABEL[k]} ${counts[k] || 0}`).join(', ')}>
      {KEYS.map((k) => counts[k] > 0 && <div key={k} style={{ width: (100 * counts[k]) / t + '%', background: COLOR[k], boxShadow: 'inset -1px 0 #fff' }} title={`${LABEL[k]}: ${counts[k]}`} />)}
    </div>
  )
}
