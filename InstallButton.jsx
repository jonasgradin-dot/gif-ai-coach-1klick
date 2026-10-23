import { useEffect, useState } from 'react'

// Android/Chrome: riktig installationsknapp. iPhone: Apple tillåter inte det via kod, så vi visar en kort anvisning.
export default function InstallButton() {
  const [evt, setEvt] = useState(null)
  const [hide, setHide] = useState(false)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setEvt(e) }
    const onInstalled = () => setHide(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  if (standalone || hide) return null
  if (evt) return <button className="btn w-full mb-3" onClick={async () => { evt.prompt(); await evt.userChoice; setEvt(null) }}>📲 Installera appen</button>
  if (ios) return <div className="card text-sm">📲 <b>Installera:</b> tryck på <b>Dela</b> (rutan med pilen) och välj <b>Lägg till på hemskärmen</b>.</div>
  return null
}
