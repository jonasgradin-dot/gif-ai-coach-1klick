import { getChunks, putSession, dropChunks, allSessions } from './db'
import { saveSession, loadCoaches } from './store'
import { transcribeChunk } from './whisper'
import { classify, writeReport, filterSegments } from './gpt'
import { trimSilence, mapTime } from './vad'
import { countTypes, countTags, countFokus, topSkills, countNytta, total, MIN_UTTERANCES } from './distribution'
import { bandFor, bandInfo } from './plan'
import { fmt } from './util'

async function transcribe(s, cfg, onStatus) {
  const chunks = (await getChunks(s.id)).sort((a, b) => a.n - b.n)
  if (!chunks.length) throw new Error('Ingen ljuddata hittades.')
  s.chunkSegs = s.chunkSegs || []
  for (let i = s.chunkSegs.length; i < chunks.length; i++) {
    const c = chunks[i], offset = s.chunkSegs.reduce((a, x) => a + x.dur, 0)
    onStatus(`Rensar tystnad och transkriberar (${i + 1}/${chunks.length})…`)
    const tr = await trimSilence(c.blob) // null = kunde inte avkodas → originalet används
    let segs = [], dur, kept
    if (!tr || tr.pieces === null) {
      const r = await transcribeChunk(cfg, c.blob, c.n, offset)
      segs = r.segs; dur = tr ? tr.dur : r.dur; kept = dur
    } else {
      dur = tr.dur; kept = tr.kept
      for (let k = 0; k < tr.pieces.length; k++) { // tom lista = ingen hörbar tal → inget anrop
        const pc = tr.pieces[k]
        segs.push(...(await transcribeChunk(cfg, pc.blob, c.n, offset, (t) => mapTime(pc.map, t), k + 1)).segs)
      }
    }
    s.chunkSegs.push({ dur, segs, kept })
    await putSession(s)
  }
  s.audio = { total: Math.round(s.chunkSegs.reduce((a, x) => a + x.dur, 0)), kept: Math.round(s.chunkSegs.reduce((a, x) => a + (x.kept ?? x.dur), 0)) }
  s.segments = s.chunkSegs.flatMap((c) => c.segs)
  s.transcript = s.segments.map((x) => `[${fmt(x.t * 1000)}] ${x.text}`).join('\n')
  await putSession(s)
}

async function analyze(s, cfg, onStatus) {
  if (!s.segments) {
    if (!s.transcript) throw new Error('Saknar transkribering.')
    s.segments = s.transcript.split('\n').filter(Boolean).map((text) => ({ t: null, text }))
  }
  if (!s.filtered) { // ta bort allmänt prat innan analysen (och innan transkriberingen sparas)
    onStatus('Filtrerar bort allmänt prat…')
    const f = await filterSegments(s.segments, cfg, onStatus)
    s.segments = f.segments
    s.transcript = s.segments.map((x) => (x.t != null ? `[${fmt(x.t * 1000)}] ` : '') + x.text).join('\n')
    s.filtered = { removed: f.removed, kept: f.segments.length }
    await putSession(s)
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
