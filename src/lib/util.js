export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10))
export const fmt = (ms) => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') }
export const when = (t) => new Date(t).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
export const load = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || '{}') } } catch { return d } }
export const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))
