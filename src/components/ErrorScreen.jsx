import React from 'react'

// Fångar körningsfel i appen: visar felet och ger återställning i stället för en tom vit sida.
// Inline-stilar används med flit så att skärmen fungerar även om CSS inte har laddats.
export default class ErrorScreen extends React.Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err, info) { console.error('App-fel:', err, info?.componentStack) }

  clearCache = async () => {
    try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister() } catch {}
    try { for (const k of await caches.keys()) await caches.delete(k) } catch {}
    location.reload()
  }
  resetData = async () => {
    if (!confirm('Detta raderar alla pass och profiler som bara finns på den här telefonen. Fortsätta?')) return
    try { localStorage.clear() } catch {}
    try { await new Promise((res) => { const r = indexedDB.deleteDatabase('gifcoach'); r.onsuccess = r.onerror = r.onblocked = () => res() }) } catch {}
    await this.clearCache()
  }

  render() {
    if (!this.state.err) return this.props.children
    const b = { display: 'block', width: '100%', padding: '14px', margin: '8px 0', borderRadius: 12, border: '1px solid #6fb066', background: '#a9d8a0', fontSize: 16, fontWeight: 600 }
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif', background: '#fff', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 22 }}>Något gick fel</h1>
        <p>Appen kunde inte visas. Försök igen – hjälper det inte, rensa cachen.</p>
        <button style={b} onClick={() => location.reload()}>Försök igen</button>
        <button style={b} onClick={this.clearCache}>Rensa cache och starta om</button>
        <details style={{ marginTop: 16 }}><summary>Teknisk information</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.err?.stack || this.state.err).slice(0, 800)}</pre>
          <button style={{ ...b, background: '#fff', border: '1px solid #c00', color: '#c00' }} onClick={this.resetData}>Nollställ lokal data</button>
        </details>
      </div>
    )
  }
}
