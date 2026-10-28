import { getChunks, putSession, dropChunks, allSessions } from './db'
import { saveSession, loadCoaches } from './store'
import { transcribeChunk } from './whisper'
import { classify, writeReport } from './gpt'
import { countTypes, countTags, countFokus, topSkills, countNytta, total, MIN_UTTERANCES } from './distribution'
import { bandFor, bandInfo } from './plan'
import { fmt } from './util'

async function transcribe(s, cfg, onStatus) {
  const chunks = (await getChunks(s.id)).sort((a, b) => a.n - b.n)
  if (!chunks.length) throw new Error('Ingen ljuddata hittades.')
  s.chunkSegs = s.chunkSegs || []
  for (let i = s.chunkSegs.length; i < chunks.length; i++) {
    onStatus(`Transkriberar med Whisper (${i + 1}/${chunks.length})…`)
    const offset = s.chunkSegs.reduce((a, c) => a + c.dur, 0)
    s.chunkSegs.push(await transcribeChunk(cfg, chunks[i].blob, chunks[i].n, offset))
    await putSession(s)
  }
  s.segments = s.chunkSegs.flatMap((c) => c.segs)
  s.transcript = s.segments.map((x) => `[${fmt(x.t * 1000)}] ${x.text}`).join('\n')
  await putSession(s)
}

async function analyze(s, cfg, onStatus) {
  if (!s.segments) {
    if (!s.transcript) throw new Error('Saknar transkribering.')
    s.segments = s.transcript.split('\n').filter(Boolean).map((text) => ({ t: null, text }))
  }
  const team = s.team ?? loadCoaches().find((c) => c.id === s.coachId)?.team ?? ''
  const band = bandFor(team)
  const utterances = await classify(s.segments, cfg, onStatus, band)
  const counts = countTypes(utterances), tags = countTags(utterances)
  const fokusCount = countFokus(utterances), skills = topSkills(utterances), nytta = countNytta(utterances)
  onStatus('Skriver tränarrapport…')
  const history = (await allSessions())
    .filter((x) => x.status === 'done' && x.id !== s.id && x.coachId === s.coachId && x.start < s.start)
    .sort((a, b) => a.start - b.start).slice(-3)
  s.report = await writeReport(cfg, { counts, utterances, history, band, tags, team, fokus: fokusCount, skills, nytta })
  Object.assign(s, { v: 2, utterances, counts, tags, fokusCount, skills, nytta, team, band: bandInfo(band), lowData: total(counts) < MIN_UTTERANCES, status: 'done' })
  await saveSession(s) // lokalt + Firestore
}

export async function processSession(s, cfg, onStatus = () => {}) {
  try {
    if (!s.segments) await transcribe(s, cfg, onStatus)
    await analyze(s, cfg, onStatus)
    await dropChunks(s.id)
    return s
  } catch (e) { s.status = 'error'; await putSession(s); throw e }
}

export const reanalyze = (s, cfg, onStatus = () => {}) => analyze(s, cfg, onStatus).then(() => s)
