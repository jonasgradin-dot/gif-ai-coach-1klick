import { guard, forward, json } from '../_proxy.js'

export async function POST(request) {
  const g = guard(request); if (g) return g
  const buf = await request.arrayBuffer()
  if (buf.byteLength > 4.4e6) return json({ error: 'Ljudfilen är för stor (max ca 4 MB, ungefär 15 min reflektion).' }, 413)
  return forward('/audio/transcriptions', buf, request.headers.get('content-type'))
}
