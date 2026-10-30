# Båstads GIF – Din coachkompis – 1-klicksversion (visar fördelning av språktyper, inget index) (ingen nyckel hos tränarna)

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
3. Har klubben satt en lösenord: **Profil → Lösenord** (en gång). Annars inget mer.

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

## Administratörsvy (tränaröversikt och rapporter)
Administratören ser vilka tränare som använder appen och deras AI-rapporter. Kräver Firebase (gratis Spark-nivå räcker).

**Vad som delas:** tränarens namn och lag, när appen senast användes, samt varje rapport (fördelning, fokusområden, markeringar, AI-text). **Delas inte:** ljud, transkribering, enskilda uttalanden eller den talade reflektionen. Tränarna ser en rad om detta i Profil. Informera tränarna innan ni börjar använda vyn.

### Uppsättning (görs en gång)
1. console.firebase.google.com → **Skapa projekt** → lägg till en **Webbapp** och kopiera nycklarna.
2. **Authentication → Sign-in method:** aktivera **Anonymous** och **Email/Password**.
3. **Firestore Database → Skapa databas** (produktionsläge).
4. **Firestore → Regler:** klistra in innehållet i `firebase/firestore.rules` och tryck **Publicera**.
5. **Vercel → Settings → Environment Variables:** lägg till `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID` → **Redeploy**.
6. **Skapa administratörskonto:** Firebase → Authentication → **Users → Add user** (e-post + lösenord). Kopiera användarens **UID**.
7. **Firestore → Start collection** `admins` → Document ID = UID:t från steg 6 → lägg till ett valfritt fält (t.ex. `namn` = ditt namn) → **Save**.
8. I appen: **Profil → Administratör** (längst ned) → logga in med e-post och lösenord från steg 6.

Administratören loggar in separat från tränarens egen session, så samma telefon kan användas för båda.
