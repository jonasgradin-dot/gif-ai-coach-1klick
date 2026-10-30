import { chatJson } from './openai'
import { fmt, when } from './util'
import { shares, TAGS, FOKUS_LABEL } from './distribution'
import { planText, fokusPrompt, fokusIds, skillsFor } from './plan'

export const TYPER = ['oppen_fraga', 'sluten_fraga', 'instruktion', 'positiv_specifik', 'positiv_generell']

const SYS_CLASSIFY = `Du analyserar en transkribering (svenska, med tidsstämplar [mm:ss]) av en fotbollstränares tal under ett träningspass. Texten kan innehålla spelares röster, brus och Whisper-fel.
Plocka ut ENDAST tränarens tydliga uttalanden och klassa varje som exakt en av (fältet "typ"):
- oppen_fraga: fråga som kräver reflektion/eget svar ("Vad ser du för ytor?")
- sluten_fraga: ja/nej- eller envarsfråga ("Är du fri?")
- instruktion: order, anvisning, korrigering, organisation
- positiv_specifik: beröm som säger VAD som var bra ("Bra öppen kropp där!")
- positiv_generell: allmänt beröm ("Bra!", "Snyggt!")
Sätt dessutom, när det passar, högst EN "tag" (annars tom sträng) som speglar Båstads GIF:s spelarutbildningsplan:
- forsok: beröm/uppmuntran av försök, mod eller ansträngning, särskilt när det inte lyckades ("Bra försök!", "Våga!")
- lagkamrat: uppmaning att hjälpa, peppa eller göra lagkamrater bättre
- reflektion: fråga som får spelarna att reflektera (vad var roligast, vad lärde ni er, känner ni igen något från träningen)
- fair_play: respekt/fair play, t.ex. tacka motståndare eller domare, följa reglerna
- negativ: klandrande eller kritiskt tillrop riktat mot spelare, t.ex. för ett misstag
Bedöm bara ordval, inte tonfall. Hoppa över spelares prat, allmänt prat som inte rör träningen och oklara fragment. Citera kort (max 120 tecken).
Fyll dessutom i för varje uttalande:
- "fokus": vilket fokusområde i fotbollsspelet uttalandet handlar om (id enligt listan nedan)
- "farg": vilken färdighet ur färdighetslistan som nämns eller övas (annars tom sträng)
- "nytta": true om tränaren förklarar SYFTET eller NYTTAN med något spelarna gör – varför det hjälper laget, t.ex. att samarbeta i lagdelar, hålla avstånd eller flytta tillsammans ("så att…", "därför…", "för att…") – annars false
Svara ENDAST med JSON: {"uttranden":[{"tid":"mm:ss","typ":"<en av typerna>","tag":"<tagg eller tom>","fokus":"<id>","farg":"<färdighet eller tom>","nytta":false,"text":"..."}]}`

const SYS_REPORT = `Du är en erfaren, stödjande utbildare i Båstads GIF. Skriv tränarrapporten på svenska utifrån klubbens spelarutbildningsplan (längst ned) och mätdata om tränarens språk under ett pass: fördelning av instruktioner, öppna/slutna frågor och specifik/allmän feedback samt markeringar (beröm av försök, lagkamratsuppmuntran, reflektionsfrågor, fair play, kritiska tillrop).
Regler:
- Strukturera bedömningen efter åldersgruppens FOKUSOMRÅDEN i planen (t.ex. bollbehandling, spel, lagdelar). Mätdata visar hur stor andel av tränarens uttalanden som handlade om varje område, vilka färdigheter som nämndes och hur ofta tränaren förklarade syfte/nytta ("nytta_antal"). Kommentera varje fokusområde för åldersgruppen: syns det i språket, hur (instruktion, fråga eller beröm) och hur det kan stärkas. För lagdelar: syns det att tränaren hjälper spelarna förstå NYTTAN av att jobba tillsammans? Ett fokusområde som helt saknas nämns vänligt – planen anger ingen idealfördelning mellan områdena.
- Utgå från planens syn på tränarrollen: relationer, egen upptäckt, engagemang och att stötta lärandet med frågor, vägledning och positivt ledarskap där misstag är en del av utvecklingen, samt att berömma goda försök.
- Planen anger ingen idealfördelning. Beskriv fördelningen som en spegel, inte som betyg, och relatera till åldersgruppens beskrivning, fokus och matchsyn om den är känd.
- Bedöm bara det som syns i mätdatan (språket). Påstå inget om övningsupplägg, speltid, tonfall eller vem som coachas – det går inte att höra. Hitta inte på.
- Var konkret, ärlig och uppmuntrande. Använd planens ord där det passar.
Svara ENDAST med JSON:
{"sammanfattning":"3-4 meningar","trend":"1-2 meningar om hur fördelningen ändrats mot tidigare pass (eller att detta är första passet)","styrkor":["max 3, gärna kopplade till planen"],"utveckling":["max 3 konkreta förbättringsområden"],"fokus":"EN sak att öva på nästa pass, hämtad ur planen, med ett exempel på formulering","planen":"2-3 meningar om hur passet ligger i linje med spelarutbildningsplanen (åldersgruppens fokus, tränarens roll, matchsyn) – nämn bara sådant som syns eller saknas i data","fokusomraden":[{"id":"<fokusområdets id>","kommentar":"1-2 meningar, max 160 tecken"}]}
Skriv exakt en post i "fokusomraden" per fokusområde som gäller för åldersgruppen (id enligt planen).`

const SYS_REFLECT = `Du sammanfattar en fotbollstränares TALADE reflektion efter ett träningspass (svenska, talspråk, kan vara osammanhängande). Du får också passets mätdata och AI-rapport.
Håll dig till det tränaren faktiskt sa. Koppla gärna till Båstads GIF:s spelarutbildningsplan (egen upptäckt, frågor och vägledning, positivt ledarskap där misstag är en del av lärandet, beröm av goda försök) men bara när reflektionen ger underlag för det. Svara ENDAST med JSON:
{"sammanfattning":"2-4 meningar","laranden":["max 3 insikter tränaren själv nämnde"],"atgarder":["max 3 konkreta saker att göra på nästa pass"],"koppling":"1-2 meningar om hur reflektionen stämmer med eller skiljer sig från fördelningen och planen"}`

const SYS_FILTER = `Du får transkriberade rader (svenska) från en fotbollsträning. Varje rad har ett id inom hakparentes. Avgör vilka rader som är ALLMÄNT PRAT SOM INTE HAR MED TRÄNINGEN ATT GÖRA: privata samtal, vardagsprat (väder, mat, helg, jobb, familj), samtal mellan vuxna om annat, telefonsamtal, skämt som inte rör övningen, samt uppenbara transkriberingsfel utan innehåll.
BEHÅLL allt som kan vara instruktioner, korrigeringar, frågor till spelare, beröm eller uppmuntran, organisation av övningar och spel (indelning, regler, tid, material, byten), matchprat och spelares svar på tränarens frågor. Vid minsta tvekan: behåll raden.
Svara ENDAST med JSON: {"bort":[id,id,...]} (tom lista om inget ska bort).`

// Tar bort allmänt prat som inte rör träningen. Skydd: tar GPT bort orimligt mycket (>70 %) behålls allt.
export async function filterSegments(segments, cfg, onStatus = () => {}) {
  if (segments.length < 12) return { segments, removed: 0 }
  const lines = segments.map((s, i) => `[${i}] ${s.text.trim()}`)
  const wins = []; let cur = ''
  for (const l of lines) { if (cur && cur.length + l.length > 6000) { wins.push(cur); cur = '' } cur += l + '\n' }
  if (cur) wins.push(cur)
  const drop = new Set()
  for (let i = 0; i < wins.length; i++) {
    onStatus(`Filtrerar bort allmänt prat (${i + 1}/${wins.length})…`)
    const j = await chatJson(cfg, SYS_FILTER, wins[i])
    for (const id of Array.isArray(j.bort) ? j.bort : []) if (Number.isInteger(id) && id >= 0 && id < segments.length) drop.add(id)
  }
  if (drop.size > segments.length * 0.7) return { segments, removed: 0 }
  return { segments: segments.filter((_, i) => !drop.has(i)), removed: drop.size }
}

export async function classify(segments, cfg, onStatus = () => {}, band = null) {
  const sys = SYS_CLASSIFY + '\n\nFokusområden (id: innebörd):\n' + fokusPrompt(band) + '\n\nFärdighetslista: ' + skillsFor(band).join(', ')
  const allowed = new Set([...fokusIds(band), 'organisation', 'annat'])
  const lines = segments.map((s) => (s.t != null ? `[${fmt(s.t * 1000)}] ` : '') + s.text.trim()).filter(Boolean)
  const wins = []; let cur = ''
  for (const l of lines) { if (cur && cur.length + l.length > 6000) { wins.push(cur); cur = '' } cur += l + '\n' }
  if (cur) wins.push(cur)
  const out = []
  for (let i = 0; i < wins.length; i++) {
    onStatus(`Analyserar tränarspråk (${i + 1}/${wins.length})…`)
    const j = await chatJson(cfg, sys, wins[i])
    for (const u of j.uttranden || []) if (TYPER.includes(u.typ) && u.text) out.push({ tid: u.tid || '', typ: u.typ, tag: TAGS.includes(u.tag) ? u.tag : '', fokus: allowed.has(u.fokus) ? u.fokus : 'annat', farg: typeof u.farg === 'string' ? u.farg.toLowerCase().trim().slice(0, 40) : '', nytta: u.nytta === true, text: String(u.text).slice(0, 160) })
  }
  return out
}

const arr = (x) => (Array.isArray(x) ? x.map(String).slice(0, 3) : [])

export async function writeReport(cfg, { counts, utterances, history, band = null, tags = {}, team = '', fokus = {}, skills = [], nytta = 0 }) {
  const sample = TYPER.flatMap((t) => utterances.filter((u) => u.typ === t).slice(0, 3)).map((u) => `${u.typ}: "${u.text}"`)
  const hist = history.filter((h) => h.counts).map((h) => `${when(h.start)}: ` + shares(h.counts).map((x) => `${x.k} ${x.pct}%`).join(', '))
  const input = { lag: team || null, aldersgrupp: band ? `${band.namn}, ${band.alder}` : null, antal: counts, procent: shares(counts), markeringar: tags, fokusomraden: fokus, farigheter: skills, nytta_antal: nytta, exempel: sample, tidigare_pass: hist }
  const j = await chatJson(cfg, SYS_REPORT + '\n\n' + planText(band), JSON.stringify(input))
  return { sammanfattning: j.sammanfattning || '', trend: j.trend || '', styrkor: arr(j.styrkor), utveckling: arr(j.utveckling), fokus: j.fokus || '', planen: j.planen || '', fokusomraden: (Array.isArray(j.fokusomraden) ? j.fokusomraden : []).filter((x) => x && x.id in FOKUS_LABEL && x.kommentar).slice(0, 5).map((x) => ({ id: x.id, kommentar: String(x.kommentar).slice(0, 220) })) }
}

export async function summarizeReflection(cfg, { transcript, counts, report }) {
  const j = await chatJson(cfg, SYS_REFLECT, JSON.stringify({ reflektion: transcript.slice(0, 12000), antal: counts, rapport: report }))
  return { sammanfattning: j.sammanfattning || '', laranden: arr(j.laranden), atgarder: arr(j.atgarder), koppling: j.koppling || '' }
}
