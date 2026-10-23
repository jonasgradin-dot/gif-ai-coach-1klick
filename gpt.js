import { chatJson } from './openai'
import { fmt, when } from './util'
import { shares } from './distribution'

export const TYPER = ['oppen_fraga', 'sluten_fraga', 'instruktion', 'positiv_specifik', 'positiv_generell']

const SYS_CLASSIFY = `Du analyserar en transkribering (svenska, med tidsstämplar [mm:ss]) av en fotbollstränares tal under ett träningspass. Texten kan innehålla spelares röster, brus och Whisper-fel.
Plocka ut ENDAST tränarens tydliga uttalanden och klassa varje som exakt en av:
- oppen_fraga: fråga som kräver reflektion/eget svar ("Vad ser du för ytor?")
- sluten_fraga: ja/nej- eller envarsfråga ("Är du fri?")
- instruktion: order, anvisning, korrigering, organisation
- positiv_specifik: beröm som säger VAD som var bra ("Bra öppen kropp där!")
- positiv_generell: allmänt beröm ("Bra!", "Snyggt!")
Hoppa över spelares prat och oklara fragment. Citera kort (max 120 tecken).
Svara ENDAST med JSON: {"uttranden":[{"tid":"mm:ss","typ":"<en av typerna>","text":"..."}]}`

const SYS_REPORT = `Du är en erfaren, stödjande fotbollsutbildare i Båstads GIF. Skriv en tränarrapport på svenska utifrån mätdata om fördelningen av tränarens språk under ett pass (instruktioner, öppna/slutna frågor, specifik/allmän feedback, antal och procent) och tidigare pass. Använd inget poängsystem eller index – beskriv bara fördelningen.
Var konkret, ärlig och uppmuntrande; hitta inte på sådant som inte syns i data. Svara ENDAST med JSON:
{"sammanfattning":"3-4 meningar","trend":"1-2 meningar om hur fördelningen ändrats mot tidigare pass (eller att detta är första passet)","styrkor":["max 3"],"utveckling":["max 3 konkreta förbättringsområden"],"fokus":"EN sak att öva på nästa pass, med ett exempel på formulering"}`

const SYS_REFLECT = `Du sammanfattar en fotbollstränares TALADE reflektion efter ett träningspass (svenska, talspråk, kan vara osammanhängande). Du får också passets mätdata (fördelning av språktyper) och AI-rapport.
Håll dig till det tränaren faktiskt sa. Svara ENDAST med JSON:
{"sammanfattning":"2-4 meningar","laranden":["max 3 insikter tränaren själv nämnde"],"atgarder":["max 3 konkreta saker att göra på nästa pass"],"koppling":"1-2 meningar om hur reflektionen stämmer med eller skiljer sig från fördelningen"}`

export async function classify(segments, cfg, onStatus = () => {}) {
  const lines = segments.map((s) => (s.t != null ? `[${fmt(s.t * 1000)}] ` : '') + s.text.trim()).filter(Boolean)
  const wins = []; let cur = ''
  for (const l of lines) { if (cur && cur.length + l.length > 6000) { wins.push(cur); cur = '' } cur += l + '\n' }
  if (cur) wins.push(cur)
  const out = []
  for (let i = 0; i < wins.length; i++) {
    onStatus(`Analyserar tränarspråk (${i + 1}/${wins.length})…`)
    const j = await chatJson(cfg, SYS_CLASSIFY, wins[i])
    for (const u of j.uttranden || []) if (TYPER.includes(u.typ) && u.text) out.push({ tid: u.tid || '', typ: u.typ, text: String(u.text).slice(0, 160) })
  }
  return out
}

const arr = (x) => (Array.isArray(x) ? x.map(String).slice(0, 3) : [])

export async function writeReport(cfg, { counts, utterances, history }) {
  const sample = TYPER.flatMap((t) => utterances.filter((u) => u.typ === t).slice(0, 3)).map((u) => `${u.typ}: "${u.text}"`)
  const hist = history.filter((h) => h.counts).map((h) => `${when(h.start)}: ` + shares(h.counts).map((x) => `${x.k} ${x.pct}%`).join(', '))
  const j = await chatJson(cfg, SYS_REPORT, JSON.stringify({ antal: counts, procent: shares(counts), exempel: sample, tidigare_pass: hist }))
  return { sammanfattning: j.sammanfattning || '', trend: j.trend || '', styrkor: arr(j.styrkor), utveckling: arr(j.utveckling), fokus: j.fokus || '' }
}

export async function summarizeReflection(cfg, { transcript, counts, report }) {
  const j = await chatJson(cfg, SYS_REFLECT, JSON.stringify({ reflektion: transcript.slice(0, 12000), antal: counts, rapport: report }))
  return { sammanfattning: j.sammanfattning || '', laranden: arr(j.laranden), atgarder: arr(j.atgarder), koppling: j.koppling || '' }
}
