import { guard, forward, json } from '../_proxy.js'

export async function POST(request) {
  const g = guard(request); if (g) return g
  let b; try { b = await request.json() } catch { return json({ error: 'Ogiltig JSON.' }, 400) }
  b.model = process.env.CHAT_MODEL || 'llama-3.3-70b-versatile' // modellen styrs av servern
  b.max_tokens = Math.min(b.max_tokens || 4000, 4000); b.stream = false
  return forward('/chat/completions', JSON.stringify(b), 'application/json')
}
