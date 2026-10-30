// Tystnadsborttagning (VAD) i telefonen, innan ljudet skickas till Whisper. Sänker kostnad och kvotanvändning.
// Energibaserad: tröskeln följer ljudets egen brusnivå, så den klarar både vind och dämpat ljud från en ficka.
// Justera konstanterna nedan om för mycket (marginDb högre) eller för lite (marginDb lägre) klipps bort.
export const VAD = {
  frameMs: 30,        // analysfönster
  marginDb: 6,        // hur mycket över brusnivån tal ska ligga
  floorDb: -55,       // absolut golv (dBFS)
  minRangeDb: 8,      // är skillnaden mellan tyst och högt mindre än så finns inget tydligt tal
  joinMs: 180,        // slå ihop korta uppehåll mellan ord
  minSpeechMs: 150,   // kortare ljud (bollsmäll, klick) ignoreras – men "Bra!" behålls
  hangMs: 500,        // behåll lite efter tal
  padMs: 300,         // och lite före
  mergeGapMs: 1200,   // uppehåll kortare än så behålls (naturliga pauser)
  minKeepRatio: 0.02, // mindre än 2 % tal i en fil → hoppa över filen
  maxKeepRatio: 0.92, // mer än 92 % tal → skicka originalet (ingen vinst)
  maxPieceBytes: 3.4e6 // varje WAV-del hålls under Vercels gräns på 4,5 MB
}

const pct = (arr, p) => { const a = Float32Array.from(arr).sort(); return a[Math.min(a.length - 1, Math.floor(a.length * p))] }

// x: Float32Array (mono), sr: samplingsfrekvens → lista med [start, slut] i sekunder där det finns tal.
export function detectSpeech(x, sr, o = VAD) {
  const fl = Math.max(1, Math.round((sr * o.frameMs) / 1000)), n = Math.floor(x.length / fl), dur = x.length / sr
  if (n < 5) return [[0, dur]]
  const db = new Float32Array(n)
  for (let i = 0; i < n; i++) { let s = 0; const b = i * fl; for (let k = 0; k < fl; k++) { const v = x[b + k]; s += v * v } db[i] = 10 * Math.log10(s / fl + 1e-12) }
  const floor = pct(db, 0.1), peak = pct(db, 0.95)
  if (peak - floor < o.minRangeDb) return peak > -35 ? [[0, dur]] : [] // helt jämnt ljud: antingen jämnt tal (behåll) eller bara brus
  const thr = Math.max(o.floorDb, Math.min(floor + o.marginDb, peak - 12))
  const f = (ms) => Math.ceil(ms / o.frameMs)
  let runs = []
  for (let i = 0; i < n;) { if (db[i] > thr) { let j = i; while (j < n && db[j] > thr) j++; runs.push([i, j]); i = j } else i++ }
  const join = (rs, gap) => { const out = []; for (const r of rs) { const l = out[out.length - 1]; if (l && r[0] - l[1] <= gap) l[1] = Math.max(l[1], r[1]); else out.push([...r]) } return out }
  runs = join(runs, f(o.joinMs)).filter(([a, b]) => b - a >= f(o.minSpeechMs))
  runs = join(runs.map(([a, b]) => [Math.max(0, a - f(o.padMs)), Math.min(n, b + f(o.hangMs))]), f(o.mergeGapMs))
  return runs.map(([a, b]) => [(a * fl) / sr, Math.min(b * fl, x.length) / sr])
}

function wav(pcm, sr) {
  const buf = new ArrayBuffer(44 + pcm.length * 2), dv = new DataView(buf), w = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)))
  w(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, pcm.length * 2, true)
  new Int16Array(buf, 44).set(pcm)
  return new Blob([buf], { type: 'audio/wav' })
}

// Klistrar ihop talintervallen till WAV-delar. "map" gör att tider i delen kan översättas tillbaka till originalets tidslinje.
export function buildPieces(x, sr, intervals, o = VAD) {
  const maxN = Math.floor(o.maxPieceBytes / 2), pieces = []; let cur = null
  const flush = () => {
    if (!cur) return
    const pcm = new Int16Array(cur.n); let p = 0
    for (const part of cur.parts) for (let k = 0; k < part.length; k++) { const v = Math.max(-1, Math.min(1, part[k])); pcm[p++] = v < 0 ? v * 32768 : v * 32767 }
    pieces.push({ blob: wav(pcm, sr), map: cur.map, sec: cur.n / sr }); cur = null
  }
  for (const [a, b] of intervals) {
    let s = Math.floor(a * sr); const e = Math.min(x.length, Math.floor(b * sr))
    while (s < e) {
      if (!cur) cur = { parts: [], map: [], n: 0 }
      const take = Math.min(e - s, maxN - cur.n)
      cur.parts.push(x.subarray(s, s + take)); cur.map.push({ t0: cur.n / sr, o0: s / sr, len: take / sr }); cur.n += take; s += take
      if (cur.n >= maxN) flush()
    }
  }
  flush()
  return pieces
}

// Tid i en WAV-del → tid i originalfilen (sekunder).
export function mapTime(map, T) {
  for (const m of map) if (T < m.t0 + m.len) return m.o0 + Math.max(0, T - m.t0)
  const l = map[map.length - 1]; return l.o0 + l.len
}

const decode = (buf) => new Promise((res, rej) => { const C = window.OfflineAudioContext || window.webkitOfflineAudioContext; new C(1, 16000, 16000).decodeAudioData(buf, res, rej) })
const mono = (a) => {
  if (a.numberOfChannels === 1) return a.getChannelData(0)
  const out = new Float32Array(a.length), ch = [...Array(a.numberOfChannels)].map((_, i) => a.getChannelData(i))
  for (let i = 0; i < out.length; i++) { let s = 0; for (const c of ch) s += c[i]; out[i] = s / ch.length }
  return out
}

// Returnerar { dur, kept, pieces } – pieces: null = skicka originalet, [] = ingen hörbar tal (hoppa över), annars WAV-delar.
// Returnerar null om ljudet inte kunde avkodas (då används originalfilen).
export async function trimSilence(blob, o = VAD) {
  try {
    const audio = await decode(await blob.arrayBuffer())
    const x = mono(audio), sr = audio.sampleRate, dur = audio.duration
    const iv = detectSpeech(x, sr, o), kept = iv.reduce((a, [s, e]) => a + (e - s), 0)
    if (kept / dur >= o.maxKeepRatio) return { dur, kept: dur, pieces: null }
    return { dur, kept, pieces: kept / dur < o.minKeepRatio ? [] : buildPieces(x, sr, iv, o) }
  } catch (e) { console.warn('Tystnadsborttagning hoppades över:', e); return null }
}
