// Delad logik för serverfunktionerna. Filer som börjar med _ blir inte egna endpoints på Vercel.
// Nyckeln GROQ_API_KEY finns bara här på servern – användarna behöver ingen nyckel.
export const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } })

// Valfri lösenord (ACCESS_CODE) så att inte vem som helst kan använda din gratiskvot.
export function guard(request) {
  const code = process.env.ACCESS_CODE
  if (code && request.headers.get('authorization') !== 'Bearer ' + code) return json({ error: 'Fel eller saknat lösenord.' }, 401)
  if (!process.env.GROQ_API_KEY) return json({ error: 'Servern saknar GROQ_API_KEY (se README).' }, 500)
  return null
}

export async function forward(path, body, contentType) {
  const r = await fetch('https://api.groq.com/openai/v1' + path, {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY, 'Content-Type': contentType }, body
  })
  const headers = { 'Content-Type': r.headers.get('content-type') || 'application/json' }
  if (r.headers.get('retry-after')) headers['Retry-After'] = r.headers.get('retry-after')
  return new Response(r.body, { status: r.status, headers })
}
