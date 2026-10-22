// "proxy" är standard: appen pratar med serverfunktionerna under /api, som håller Groq-nyckeln. Inga nycklar hos användaren.
export const PROVIDERS = {
  proxy: { label: 'Standard (ingen nyckel behövs)', base: '/api', whisper: 'whisper-large-v3', chat: 'llama-3.3-70b-versatile' },
  groq: { label: 'Avancerat: egen Groq-nyckel', base: 'https://api.groq.com/openai/v1', whisper: 'whisper-large-v3', chat: 'llama-3.3-70b-versatile', keyUrl: 'console.groq.com/keys' },
  openai: { label: 'Avancerat: egen OpenAI-nyckel', base: 'https://api.openai.com/v1', whisper: 'whisper-1', chat: 'gpt-4o-mini', keyUrl: 'platform.openai.com/api-keys' }
}
export function resolve(cfg) {
  const p = PROVIDERS[cfg.provider] || PROVIDERS.proxy
  return { base: (cfg.baseUrl || p.base).replace(/\/$/, ''), whisper: p.whisper, chat: cfg.model || p.chat }
}
