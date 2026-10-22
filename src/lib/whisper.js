import { post } from './openai'
import { resolve } from './providers'

const DEFAULT_PROMPT = 'Fotbollsträning. Tränaren ger instruktioner och ställer frågor till spelarna: press, speluppbyggnad, passningsspel, omställning, överlapp, djupled, markering, backlinje, mittfält, ytterback.'
const HALLUCINATION = /undertexter|amara\.org|tack för att ni (tittade|lyssnade)|textning/i // Whisper hittar på detta vid tystnad
const ext = (t) => (/mp4/.test(t) ? 'm4a' : /ogg/.test(t) ? 'ogg' : 'webm')

// Transkriberar en ljudfil. offset = sekunder från passets start → absoluta tidsstämplar.
export async function transcribeChunk(cfg, blob, n, offset = 0) {
  const fd = new FormData()
  fd.append('file', new File([blob], `d${n}.${ext(blob.type)}`, { type: blob.type }))
  fd.append('model', resolve(cfg).whisper); fd.append('language', 'sv'); fd.append('temperature', '0')
  fd.append('response_format', 'verbose_json'); fd.append('timestamp_granularities[]', 'segment')
  fd.append('prompt', cfg.vocab || DEFAULT_PROMPT)
  const j = await (await post(cfg, '/audio/transcriptions', { form: fd })).json()
  const segs = (j.segments || [])
    .filter((s) => s.text.trim() && !(s.no_speech_prob > 0.6) && !(s.compression_ratio > 2.4) && !HALLUCINATION.test(s.text))
    .map((s) => ({ t: Math.round(offset + s.start), text: s.text.trim() }))
  if (!j.segments && j.text) segs.push({ t: Math.round(offset), text: j.text.trim() })
  return { dur: j.duration || 0, segs }
}
