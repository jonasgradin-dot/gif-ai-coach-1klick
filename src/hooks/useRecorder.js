import { useRef, useState, useCallback, useEffect } from 'react'
import { addChunk, putSession } from '../lib/db'
import { uid } from '../lib/util'

const SEG = 5 * 60 * 1000 // 5 min per ljudfil: under Whispers 25 MB, och minimal förlust vid krasch

export function useRecorder() {
  const r = useRef(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const vis = async () => { if (r.current && !document.hidden) { try { r.current.wl = await navigator.wakeLock.request('screen') } catch {} } }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [])

  const seg = () => {
    const s = r.current
    const rec = new MediaRecorder(s.stream, s.mime ? { mimeType: s.mime, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 })
    const parts = []
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(parts, { type: rec.mimeType || s.mime })
      s.writes.push(addChunk({ sid: s.id, n: s.n++, blob }))
      s.run ? seg() : s.done()
    }
    rec.start(); s.rec = rec
    s.timer = setTimeout(() => rec.state === 'recording' && rec.stop(), SEG)
  }

  const start = useCallback(async () => {
    if (!window.isSecureContext || !navigator.mediaDevices || !window.MediaRecorder)
      throw new Error('Inspelning kräver HTTPS eller http://localhost och en webbläsare med MediaRecorder.')
    let stream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } }) }
    catch { throw new Error('Mikrofon nekad. Tillåt mikrofonen i webbläsaren.') }
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m)) || ''
    const s = (r.current = { id: uid(), start: Date.now(), stream, mime, n: 0, run: true, writes: [] })
    await putSession({ id: s.id, start: s.start, status: 'recording' })
    seg()
    try { s.wl = await navigator.wakeLock.request('screen') } catch {}
    s.tick = setInterval(() => setElapsed(Date.now() - s.start), 500)
    setElapsed(0); setRecording(true)
  }, [])

  const stop = useCallback(async () => {
    const s = r.current
    s.run = false; clearTimeout(s.timer); clearInterval(s.tick)
    const fin = new Promise((res) => (s.done = res)); s.rec.stop(); await fin; await Promise.all(s.writes)
    s.stream.getTracks().forEach((t) => t.stop()); try { s.wl && s.wl.release() } catch {}
    r.current = null; setRecording(false); setElapsed(0)
    return { id: s.id, start: s.start, dur: Date.now() - s.start }
  }, [])

  return { recording, elapsed, start, stop }
}
