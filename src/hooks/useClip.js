import { useRef, useState, useCallback, useEffect } from 'react'

// Enkel inspelning av ett kort klipp (talad reflektion) → Blob.
export function useClip() {
  const r = useRef(null)
  const [on, setOn] = useState(false)
  const [sec, setSec] = useState(0)

  useEffect(() => () => { const c = r.current; if (c) { clearInterval(c.tick); c.stream.getTracks().forEach((t) => t.stop()) } }, [])

  const start = useCallback(async () => {
    if (!window.isSecureContext || !navigator.mediaDevices || !window.MediaRecorder) throw new Error('Inspelning kräver HTTPS eller localhost.')
    let stream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { throw new Error('Mikrofon nekad.') }
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m)) || ''
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 })
    const parts = []; rec.ondataavailable = (e) => e.data.size && parts.push(e.data)
    const t0 = Date.now(); rec.start()
    r.current = { rec, stream, parts, mime, tick: setInterval(() => setSec(Math.floor((Date.now() - t0) / 1000)), 500) }
    setSec(0); setOn(true)
  }, [])

  const stop = useCallback(() => new Promise((res) => {
    const c = r.current
    c.rec.onstop = () => {
      clearInterval(c.tick); c.stream.getTracks().forEach((t) => t.stop()); r.current = null; setOn(false)
      res(new Blob(c.parts, { type: c.rec.mimeType || c.mime }))
    }
    c.rec.stop()
  }), [])

  return { on, sec, start, stop }
}
