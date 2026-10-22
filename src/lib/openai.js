// Gemensam klient (OpenAI/Groq) med återförsök. Vid 429 (gräns nådd) väntar vi enligt Retry-After.
import { resolve } from './providers'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function post(cfg, path, { json, form }, tries = 4) {
  const url = resolve(cfg).base + path
  for (let a = 1; ; a++) {
    let r
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + cfg.openaiKey, ...(json ? { 'Content-Type': 'application/json' } : {}) }, // openaiKey = aktiv leverantörs nyckel
        body: json ? JSON.stringify(json) : form
      })
    } catch (e) {
      if (a >= tries) throw new Error('Nätverksfel: ' + e.message)
      await sleep(1000 * a * a); continue
    }
    if (r.ok) return r
    if ((r.status === 429 || r.status >= 500) && a < tries) {
      const ra = parseFloat(r.headers.get('retry-after'))
      await sleep(r.status === 429 && ra ? Math.min(ra, 90) * 1000 : 1500 * a * a); continue
    }
    const t = (await r.text()).slice(0, 200)
    if (r.status === 401) throw new Error('Fel eller saknad åtkomstkod – ange den under Profil.')
    throw new Error(r.status === 429 ? 'Gratisgränsen är nådd – vänta en stund och försök igen. ' + t : `API ${r.status}: ${t}`)
  }
}

export async function chatJson(cfg, system, user) {
  const r = await post(cfg, '/chat/completions', {
    json: {
      model: resolve(cfg).chat, temperature: 0.2, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    }
  })
  const text = (await r.json()).choices[0].message.content
  try { return JSON.parse(text) } catch { throw new Error('Modellen returnerade ogiltig JSON.') }
}
