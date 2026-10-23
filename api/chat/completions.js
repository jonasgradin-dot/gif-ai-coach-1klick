import { guard, forward, json } from '../_proxy.js'

// Groq stängde llama-3.3-70b-versatile 2026-08-16. Standard är nu openai/gpt-oss-120b; byt med miljövariabeln CHAT_MODEL vid behov.
const MODEL = process.env.CHAT_MODEL || 'openai/gpt-oss-120b'

export async function POST(request) {
  const g = guard(request); if (g) return g
  let b; try { b = await request.json() } catch { return json({ error: 'Ogiltig JSON.' }, 400) }
  b.model = MODEL // modellen styrs av servern
  delete b.max_tokens; b.max_completion_tokens = 6000; b.stream = false
  if (/gpt-oss/.test(MODEL)) b.reasoning_effort = 'low' // mindre "tänkande" = snabbare och inom gratiskvoten
  return forward('/chat/completions', JSON.stringify(b), 'application/json')
}
