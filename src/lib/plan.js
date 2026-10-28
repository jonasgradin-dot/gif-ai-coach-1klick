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


// Fokusområden i fotbollsspelet (planens "Fokusera på"). Nycklarna används som id i analysen.
export const FOKUS = {
  bollbehandling: { namn: 'Bollbehandling', syfte: 'Tekniska färdigheter med bollen – att vara trygg med bollen: driva boll, vända, skjuta, passa, ta emot, utmana/finta/dribbla.' },
  lekar: { namn: 'Lekar med boll', syfte: 'Lekfullt lärande där bollen är ständigt närvarande, barnen får många aktioner och rörelseglädje (t.ex. bollekar, svansleken, stafetter).' },
  spel: { namn: 'Spel', syfte: 'Spelförståelse och beslut i spelets skeden: anfallsspel (speluppbyggnad, kontring, komma till avslut), försvarsspel (återerövring, förhindra speluppbyggnad, förhindra och rädda avslut) och omställningar, samt att vara spelbar och utnyttja ytor.' },
  lagdelar: { namn: 'Lagdelar', syfte: 'Att spelarna förstår nyttan av att jobba tillsammans i lagdelar (backlinje, mittfält, anfall): rätt avstånd, understöd och täckning, spela igenom/förbi motståndarnas lagdelar och skydda centrala ytor.' },
  kollektiva: { namn: 'Kollektiva förflyttningar', syfte: 'Att laget och lagdelarna rör sig tillsammans: uppflyttning, nedflyttning och överflyttning, pressa som lag, spelvändning och löpningar som skapar ytor åt lagkamrater.' }
}
export const fokusIds = (band) => (band ? band.fokusIds : ['bollbehandling', 'spel', 'lagdelar'])

export const BANDS = [
  { id: '3v3', namn: '3 mot 3', alder: '5–7 år', fran: 5, till: 7, motto: 'Jag och bollen', fokusIds: ['bollbehandling', 'spel', 'lekar'],
    saSpelarVi: 'Vi driver bollen så fort vi kan för att komma förbi motståndarna och närma oss deras mål, och försöker skjuta när vi är nära. När vi har bollen följer alla spelare med i anfallet, ingen står kvar vid det egna målet. Tappar vi bollen vill vi vinna tillbaka den snabbt. Inga positioner används.',
    fardigheter: { anfall: ['driva boll', 'vända', 'skjuta'], forsvar: ['bryta'], malvakt: [], lag: [] },
    beskrivning: 'Spelarna följer nästan enbart bollen och har begränsad förståelse för samspelet. Anfall: de driver bollen själva och försöker avsluta med skott. Försvar: flera jagar bollen samtidigt.',
    match: 'Matchen handlar bara om barnens upplevelse – de ska ha roligt. Vi coachar inte den som har bollen, berömmer alla barn för goda försök (även motståndare) och använder inte ramsor som hyllar det egna laget. Efter matchen frågar vi vad som var roligast.' },
  { id: '5v5', namn: '5 mot 5', alder: '8–9 år', fran: 8, till: 9, motto: 'Jag, bollen och en lagkamrat', fokusIds: ['bollbehandling', 'spel', 'lekar'],
    saSpelarVi: 'Vi driver, dribblar och passar bollen för att komma förbi motståndarna och nära mål, och skjuter när vi är nära. Alla följer med i anfallet och målvakten deltar som extra utespelare. Det är viktigt att alltid röra sig för att vara spelbar. Tappar vi bollen vill vi vinna tillbaka den snabbt – alla hjälps åt. Förslag på positioner: 2-2.',
    fardigheter: { anfall: ['driva boll', 'vända', 'skjuta', 'passa bollen', 'ta emot bollen', 'utmana', 'finta', 'dribbla'], forsvar: ['bryta'], malvakt: ['rulla bollen', 'kasta bollen', 'fånga bollen', 'stöta bollen', 'kasta sig och fånga bollen'], lag: ['spelbarhet'] },
    beskrivning: 'Fokus på bollen och närmaste medspelare. Enklare passningsspel börjar, men spelet domineras av individuella aktioner. Försvaret sker främst individuellt med inslag av markering.',
    match: 'Vi spelar som vi tränat och vill se extra mycket av det som övats under veckan, alla spelar lika mycket och alla barn berömmer vi för goda försök. Efter matchen frågar vi vad som var roligast och om de känner igen något från träningen.' },
  { id: '7v7', namn: '7 mot 7', alder: '10–12 år', fran: 10, till: 12, motto: 'Jag, bollen och några lagkamrater', fokusIds: ['bollbehandling', 'spel', 'lagdelar'],
    saSpelarVi: 'Vi strävar efter att spela igenom motståndarnas lagdelar; går inte det spelar vi förbi på utsidan för att komma nära deras mål. När vi tappar bollen vill vi vinna tillbaka den snabbt och alla hjälps åt. När motståndaren har speluppbyggnad vill vi inte att de spelar igenom våra lagdelar – vi skyddar i första hand centrala ytor. Förslag på positioner: 2-3-1.',
    fardigheter: { anfall: ['driva boll', 'vända', 'skjuta', 'passa bollen', 'ta emot bollen', 'utmana', 'finta', 'dribbla'], forsvar: ['bryta', 'pressa', 'markera', 'tackla'], malvakt: ['rulla bollen', 'kasta bollen', 'utspark', 'fånga bollen', 'stöta bollen', 'bryta djupledspass'], lag: ['spelbarhet', 'spelbredd', 'speldjup', 'spelavstånd', 'positionering', 'djupledsspel', 'spelvändning', 'uppflyttning', 'väggspel', 'försvarssida', 'täckning', 'understöd', 'nedflyttning'] },
    beskrivning: 'Förmågan att samarbeta ökar och spelarna uppfattar mer av vad som händer runt dem. Passningsspel och spelbarhet förbättras, och i försvaret förstår de vilka ytor och motståndare som är farliga.',
    match: 'Före matchen pratar vi om vad vi vill se i spelet (få punkter). Under matchen vill vi att spelarna gör varandra bättre genom att peppa och uppmuntra, även när en aktion inte lyckas. Efter matchen frågar vi vad som var roligast, om de lärt sig något och om de känner igen något från träningen.' },
  { id: '9v9', namn: '9 mot 9', alder: '13–14 år', fran: 13, till: 14, motto: 'Jag, bollen och många lagkamrater', fokusIds: ['bollbehandling', 'spel', 'lagdelar', 'kollektiva'],
    saSpelarVi: 'Vi strävar efter att spela igenom motståndarnas lagdelar; går inte det spelar vi förbi på utsidan. När vi tappar bollen vill vi vinna tillbaka den snabbt. När motståndaren har speluppbyggnad skyddar vi i första hand centrala ytor. Förslag på positioner: 3-2-3.',
    fardigheter: { anfall: ['driva boll', 'vända', 'skjuta', 'passa bollen', 'ta emot bollen', 'utmana', 'finta', 'dribbla', 'nicka'], forsvar: ['bryta', 'pressa', 'markera', 'tackla', 'blockera', 'nicka'], malvakt: ['rulla bollen', 'kasta bollen', 'utspark', 'fånga bollen', 'stöta bollen', 'boxa bollen', 'upphopp'], lag: ['spelbarhet', 'spelbredd', 'speldjup', 'spelavstånd', 'positionering', 'djupledsspel', 'spelvändning', 'uppflyttning', 'väggspel', 'överlappning', 'avledande rörelse', 'försvarssida', 'täckning', 'understöd', 'nedflyttning', 'överflyttning', 'centrering'] },
    beskrivning: 'Samarbetet utvecklas i takt med fotbollserfarenheten. I anfall görs löpningar för att skapa ytor åt lagkamrater, och i försvaret förstår spelarna syftet med lagdelars gemensamma förflyttningar.',
    match: 'Vi vill att spelarna visar de beteenden som vi tillsammans med spelarna bestämt är viktiga i vårt lag. Alla kallade spelare ska spela. Efter matchen frågar vi vad som var roligast, om de lärt sig något och hur det vi tränat fungerade.' },
  { id: '11v11', namn: '11 mot 11', alder: '15 år och äldre', fran: 15, till: 99, motto: 'Jag, bollen och alla lagkamrater', fokusIds: ['bollbehandling', 'spel', 'lagdelar', 'kollektiva'],
    saSpelarVi: 'Vi strävar efter att spela igenom motståndarnas lagdelar och använder centrala korridorer för att komma in på deras planhalva; därifrån varierar vi med yttre och inre korridorer för att komma till avslut. Tappar vi bollen vill vi vinna tillbaka den snabbt, annars formerar vi lagdelar för att ha bollen framför oss. När motståndaren har speluppbyggnad skyddar vi i första hand centrala ytor. Förslag på positioner: 3-4-3.',
    fardigheter: { anfall: ['driva boll', 'vända', 'skjuta', 'passa bollen', 'ta emot bollen', 'utmana', 'finta', 'dribbla', 'nicka'], forsvar: ['bryta', 'pressa', 'markera', 'tackla', 'blockera', 'nicka'], malvakt: ['rulla bollen', 'kasta bollen', 'utspark', 'fånga bollen', 'stöta bollen', 'boxa bollen', 'upphopp'], lag: ['spelbarhet', 'spelbredd', 'speldjup', 'spelavstånd', 'positionering', 'djupledsspel', 'spelvändning', 'uppflyttning', 'väggspel', 'överlappning', 'avledande rörelse', 'motrörelse', 'korslöpning', 'rotation', 'försvarssida', 'täckning', 'understöd', 'nedflyttning', 'överflyttning', 'centrering'] },
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
export const bandInfo = (b) => b && { id: b.id, namn: b.namn, alder: b.alder, motto: b.motto, fokus: b.fokusIds.map((i) => FOKUS[i].namn), fokusIds: b.fokusIds }


const uniq = (a) => [...new Set(a)]
export const skillsFor = (band) => uniq((band ? [band] : BANDS).flatMap((b) => Object.values(b.fardigheter).flat()))
// Fokusområden som GPT ska använda vid klassning (id: definition)
export function fokusPrompt(band) {
  return [...fokusIds(band).map((id) => `- ${id}: ${FOKUS[id].syfte}`), '- organisation: praktiskt (indelning, regler, tid, ordning)', '- annat: sådant som inte hör till något fokusområde'].join('\n')
}

export function planText(band) {
  const L = ['SPELARUTBILDNINGSPLANEN (Båstads GIF)',
    `Vision: ${PLAN.vision} Värdeord (NAVET): ${PLAN.navet}.`,
    `Tränarens roll: ${PLAN.tranare.join('; ')}.`,
    `Träningens genomförande: ${PLAN.traning.join('; ')}.`,
    `Match: ${PLAN.match.join('; ')}.`,
    `Utbildningsmål – vi utbildar spelare som är ${PLAN.mal.join(', ')}.`,
    `Vårt sätt att spela: ${PLAN.spel.join('; ')}.`]
  L.push(band ? `Tränarens åldersgrupp: ${band.namn}, ${band.alder} – "${band.motto}". Fokus: ${band.fokusIds.map((i) => FOKUS[i].namn).join(', ')}. ${band.beskrivning} Så spelar vi ${band.namn}: ${band.saSpelarVi} I match: ${band.match}`
              : 'Åldersgrupp okänd – håll dig till planens generella principer.')
  L.push('Fokusområden och vad de innebär:\n' + fokusPrompt(band))
  if (band) L.push('Färdigheter som prioriteras i åldersgruppen – anfall: ' + band.fardigheter.anfall.join(', ') + '; försvar: ' + band.fardigheter.forsvar.join(', ') + (band.fardigheter.malvakt.length ? '; målvakt: ' + band.fardigheter.malvakt.join(', ') : '') + (band.fardigheter.lag.length ? '; lagets: ' + band.fardigheter.lag.join(', ') : '') + '.')
  return L.join('\n')
}
