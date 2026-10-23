import { addChunk, getChunks, dropChunks } from './db'
import { saveSession } from './store'
import { transcribeChunk } from './whisper'
import { summarizeReflection } from './gpt'

const key = (s) => 'refl-' + s.id // klippet sparas lokalt tills analysen lyckats
export const resetClip = (s) => dropChunks(key(s))
export const storeClip = (s, blob) => addChunk({ sid: key(s), n: 0, blob })
export const hasClip = async (s) => (await getChunks(key(s))).length > 0

export async function processReflection(s, cfg, onStatus = () => {}) {
  const [c] = await getChunks(key(s))
  if (!c) throw new Error('Ingen reflektionsinspelning hittades.')
  onStatus('Transkriberar reflektionen…')
  const { segs } = await transcribeChunk(cfg, c.blob, 0, 0)
  const transcript = segs.map((x) => x.text).join(' ').trim()
  if (!transcript) throw new Error('Inget tal kunde uppfattas – spela in igen.')
  onStatus('Sammanfattar reflektionen…')
  const summary = await summarizeReflection(cfg, { transcript, counts: s.counts, report: s.report })
  s.reflection = { transcript, summary, at: Date.now() }
  await saveSession(s); await dropChunks(key(s))
  return s
}
