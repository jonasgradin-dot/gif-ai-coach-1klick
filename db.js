// Lokal lagring (IndexedDB). I v1.1 speglas sessions till Firestore, ljud till Firebase Storage.
let dbp
const db = () => dbp || (dbp = new Promise((res, rej) => {
  const r = indexedDB.open('gifcoach', 1)
  r.onupgradeneeded = () => {
    r.result.createObjectStore('sessions', { keyPath: 'id' })
    r.result.createObjectStore('chunks', { autoIncrement: true }).createIndex('sid', 'sid')
  }
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
}))
async function tx(store, mode, fn) {
  const d = await db()
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode); const q = fn(t.objectStore(store))
    t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error)
  })
}
export const putSession = (s) => tx('sessions', 'readwrite', (o) => o.put(s))
export const allSessions = () => tx('sessions', 'readonly', (o) => o.getAll())
export const delSession = (id) => tx('sessions', 'readwrite', (o) => o.delete(id))
export const addChunk = (c) => tx('chunks', 'readwrite', (o) => o.add(c))
export const getChunks = (sid) => tx('chunks', 'readonly', (o) => o.index('sid').getAll(sid))
export const dropChunks = (sid) => tx('chunks', 'readwrite', (o) => {
  o.index('sid').openCursor(IDBKeyRange.only(sid)).onsuccess = (e) => { const c = e.target.result; if (c) { c.delete(); c.continue() } }
})
