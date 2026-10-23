# Båstads GIF AI Coach – 1-klicksversion (visar fördelning av språktyper, inget index) (ingen nyckel hos tränarna)

Analysen (Whisper + chatt) körs via serverfunktioner i `api/` som håller **din** gratis Groq-nyckel. Tränarna öppnar bara en länk och trycker **Installera appen**.

## A. Du som administratör – görs en gång (ca 5 min)
1. Skaffa en gratis nyckel: console.groq.com/keys (börjar med `gsk_`).
2. Lägg mappen på GitHub (ett repository) och gå till vercel.com → **Add New → Project → Import** → välj repot.
3. Innan du trycker **Deploy**: öppna **Environment Variables** och lägg till
   - `GROQ_API_KEY` = din nyckel
   - `ACCESS_CODE` = (valfritt) en kod, t.ex. `bastad2026`, så att bara din klubb kan använda tjänsten
4. Tryck **Deploy**. Skicka länken `https://….vercel.app` till tränarna.

**Ändra nyckel/kod senare:** Vercel → Settings → Environment Variables → Redeploy.

## B. Tränarna – ett knapptryck
1. Öppna länken på mobilen.
2. Android: tryck **📲 Installera appen**. iPhone (Safari): **Dela → Lägg till på hemskärmen**.
3. Har klubben satt en åtkomstkod: **Profil → Åtkomstkod** (en gång). Annars inget mer.

## Lokalt
```bash
npm install
cp .env.example .env   # fyll i GROQ_API_KEY
npm run dev
```
`/api` fungerar även lokalt via Vite. För mikrofon på mobil krävs HTTPS (deploya, eller tunnel).

## Gränser
Groqs gratisnivå har tak (ca 2 h ljud/timme, dagliga tak). Överskrids de väntar appen och försöker igen. Ljudfiler över ca 4 MB avvisas av Vercel (5-minuterssegmenten ligger runt 1,2 MB; reflektioner bör vara under ~15 min).
Firebase-synk är valfri, se `.env.example`.
