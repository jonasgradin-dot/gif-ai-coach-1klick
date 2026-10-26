// Båstads GIF:s spelarutbildningsplan – underlag för AI-feedbacken. Källa: "Spelarutbildningsplan" (klubbens PDF).
export const PLAN = {
  vision: 'Båstads GIF ska vara den naturliga mötesplatsen för ung som gammal.',
  navet: 'Närvaro, Ansvar, Vänskap',
  tranare: [
    'Främja relationer där alla spelare och ledare känner sig sedda och lyssnade på',
    'Skapa övningar med ett tydligt syfte som uppmuntrar spelarna till egen upptäckt',
    'Visa engagemang i träning och match',
    'Stötta lärandet med frågor, vägledning och ett positivt ledarskap där misstag ses som en viktig del i att utvecklas'
  ],
  traning: [
    'Övningar där bollen är ständigt närvarande',
    '50 % av träningstiden i spel eller spelliknande övningar',
    'Hög aktivitet och rörelseglädje med många aktioner',
    'Belysa vikten av att göra sin lagkamrat bättre och använda ett stöttande ledarskap som berömmer goda försök',
    'Föregå med gott exempel för hur vi vill uppfattas av andra'
  ],
  match: [
    'Matchen ses som en förlängning av träningen; tränaren hjälper spelarna fokusera på veckans tema och ger feedback på försök',
    'Vi coachar inte den som har bollen (hjälp spelarna när situationen är över)',
    'Vi spelar som vi har tränat',
    'Vi tackar motståndarna och domaren efter matchen',
    'Låt alla starta en match'
  ],
  mal: ['trygga med bollen', 'tar bra beslut i spelet', 'orkar spela hela matchen', 'bra lagkamrater', 'respekterar motståndare och domare'],
  spel: ['mycket boll i anfallsspelet', 'erövra bollen snabbt i försvarsspelet', 'hög intensitet i anfall och försvar', 'modiga och vågar utmana oss själva och motståndarna', 'fair play']
}

export const BANDS = [
  { id: '3v3', namn: '3 mot 3', alder: '5–7 år', fran: 5, till: 7, motto: 'Jag och bollen', fokus: ['Bollbehandling', 'Spel', 'Lekar med boll'],
    beskrivning: 'Spelarna följer nästan enbart bollen och har begränsad förståelse för samspelet. Anfall: de driver bollen själva och försöker avsluta med skott. Försvar: flera jagar bollen samtidigt.',
    match: 'Matchen handlar bara om barnens upplevelse – de ska ha roligt. Vi coachar inte den som har bollen, berömmer alla barn för goda försök (även motståndare) och använder inte ramsor som hyllar det egna laget. Efter matchen frågar vi vad som var roligast.' },
  { id: '5v5', namn: '5 mot 5', alder: '8–9 år', fran: 8, till: 9, motto: 'Jag, bollen och en lagkamrat', fokus: ['Bollbehandling', 'Spel', 'Lekar med boll'],
    beskrivning: 'Fokus på bollen och närmaste medspelare. Enklare passningsspel börjar, men spelet domineras av individuella aktioner. Försvaret sker främst individuellt med inslag av markering.',
    match: 'Vi spelar som vi tränat och vill se extra mycket av det som övats under veckan, alla spelar lika mycket och alla barn berömmer vi för goda försök. Efter matchen frågar vi vad som var roligast och om de känner igen något från träningen.' },
  { id: '7v7', namn: '7 mot 7', alder: '10–12 år', fran: 10, till: 12, motto: 'Jag, bollen och några lagkamrater', fokus: ['Bollbehandling', 'Spel', 'Lagdelar'],
    beskrivning: 'Förmågan att samarbeta ökar och spelarna uppfattar mer av vad som händer runt dem. Passningsspel och spelbarhet förbättras, och i försvaret förstår de vilka ytor och motståndare som är farliga.',
    match: 'Före matchen pratar vi om vad vi vill se i spelet (få punkter). Under matchen vill vi att spelarna gör varandra bättre genom att peppa och uppmuntra, även när en aktion inte lyckas. Efter matchen frågar vi vad som var roligast, om de lärt sig något och om de känner igen något från träningen.' },
  { id: '9v9', namn: '9 mot 9', alder: '13–14 år', fran: 13, till: 14, motto: 'Jag, bollen och många lagkamrater', fokus: ['Bollbehandling', 'Spel', 'Lagdelar', 'Kollektiva förflyttningar'],
    beskrivning: 'Samarbetet utvecklas i takt med fotbollserfarenheten. I anfall görs löpningar för att skapa ytor åt lagkamrater, och i försvaret förstår spelarna syftet med lagdelars gemensamma förflyttningar.',
    match: 'Vi vill att spelarna visar de beteenden som vi tillsammans med spelarna bestämt är viktiga i vårt lag. Alla kallade spelare ska spela. Efter matchen frågar vi vad som var roligast, om de lärt sig något och hur det vi tränat fungerade.' },
  { id: '11v11', namn: '11 mot 11', alder: '15 år och äldre', fran: 15, till: 99, motto: 'Jag, bollen och alla lagkamrater', fokus: ['Bollbehandling', 'Spel', 'Lagdelar', 'Kollektiva förflyttningar'],
    beskrivning: 'God samarbetsförmåga. Samverkan sker över hela planen i spelets alla skeden, och lagens spelsystem blir allt tydligare.',
    match: 'Vi vill att spelarna visar de beteenden som vi tillsammans bestämt är viktiga i vårt lag, och alla kallade spelare ska spela. Efter matchen frågar vi om de lärt sig något och om det är något vi behöver träna extra på.' }
]

// Gissar åldersgrupp ur lagnamnet: "P12" → 12 år, "F9", "U15", "P2014" (födelseår) eller Herrar/Damer/A-lag → 15+.
export function bandFor(team, year = new Date().getFullYear()) {
  const t = (team || '').toLowerCase(); let age = null
  for (const m of t.match(/\d{1,4}/g) || []) {
    const n = Number(m)
    if (m.length === 4 && n >= 1990 && n <= year) age = year - n
    else if (m.length <= 2 && n >= 4 && n <= 19) age = n
  }
  if (age === null && /herr|dam|senior|a-lag|a lag|junior/.test(t)) age = 15
  if (age === null) return null
  return BANDS.find((b) => age >= b.fran && age <= b.till) || BANDS[0]
}
export const bandInfo = (b) => b && { id: b.id, namn: b.namn, alder: b.alder, motto: b.motto, fokus: b.fokus }

export function planText(band) {
  const L = ['SPELARUTBILDNINGSPLANEN (Båstads GIF)',
    `Vision: ${PLAN.vision} Värdeord (NAVET): ${PLAN.navet}.`,
    `Tränarens roll: ${PLAN.tranare.join('; ')}.`,
    `Träningens genomförande: ${PLAN.traning.join('; ')}.`,
    `Match: ${PLAN.match.join('; ')}.`,
    `Utbildningsmål – vi utbildar spelare som är ${PLAN.mal.join(', ')}.`,
    `Vårt sätt att spela: ${PLAN.spel.join('; ')}.`]
  L.push(band ? `Tränarens åldersgrupp: ${band.namn}, ${band.alder} – "${band.motto}". Fokus: ${band.fokus.join(', ')}. ${band.beskrivning} I match: ${band.match}`
              : 'Åldersgrupp okänd – håll dig till planens generella principer.')
  return L.join('\n')
}
