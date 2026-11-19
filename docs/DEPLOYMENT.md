# FitTrack Pro — Deployment Guide

Ez a dokumentum lépésről lépésre végigvezet a FitTrack Pro production
környezetbe (Vercel + Supabase + Stripe + OpenRouter) telepítésén.

## Tartalomjegyzék

## Helyi futtatás friss klónból (Windows)

### Szükséges eszközök

Git, Node.js és npm, böngésző, működő Supabase-projekt és internetkapcsolat szükséges. A VS Code opcionális szerkesztő. A projekt dokumentált Node-alapja 22.22.2+ vagy 24.15.0+; a tényleges próbán használt verziót külön rögzíteni kell. A Node Windows MSI telepítője az npm-et is telepíti; fnm nem szükséges. Telepítés után nyiss új terminált.

```cmd
node -v
npm -v
git clone https://github.com/Almasip442/FitTrack.git
cd FitTrack
git rev-parse HEAD
copy .env.example .env.local
```

A copy parancsot csak akkor futtasd, ha még nincs kitöltött `.env.local`. A fájl a projekt gyökerébe kerüljön, ne `.env.local.txt` néven. PowerShellben használható a `Copy-Item .env.example .env.local` is.

### Konfiguráció

| Változó | Mikor kell? |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Hitelesítéshez és adatbázis-eléréshez |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | A Supabase projekt publikus klienskulcsa |
| `SUPABASE_SERVICE_ROLE_KEY` | Seedeléshez és a Stripe webhook szerveroldali műveleteihez; titkos |
| `OPENROUTER_API_KEY` | Valódi AI-magyarázathoz; nélküle a szabályalapú eredmény használható |
| `STRIPE_SECRET_KEY` | Stripe teszt Checkout indításához |
| `STRIPE_WEBHOOK_SECRET` | Webhook aláírás-ellenőrzéséhez |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe mintakonfiguráció publikus tesztkulcsa |
| `NEXT_PUBLIC_SITE_URL` | Helyileg `http://localhost:3000`, telepítve a saját cím |

A szükségtelen szolgáltatások mintakulcsait ne tekintsd működő konfigurációnak. Titkos érték ne kerüljön Gitbe, képernyőképbe vagy e-mailbe. Környezeti változó módosítása után indítsd újra a szervert; production próbánál új build is szükséges lehet.

Meglévő, előkészített Supabase-projekt esetén a friss klón nem igényel új seedet vagy a már alkalmazott migrációk újrafuttatását. Új adatbázishoz a lent leírt migrációk, RLS, Auth és storage beállítások szükségesek. Az Auth engedélyezett visszairányításai között a helyi cím is szerepeljen. A Supabase-projekt ne legyen szüneteltetve.

### Telepítés, ellenőrzés és indítás

A parancsokat egyenként futtasd, sikeres befejezés után folytatva:

```cmd
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build
npm start
```

Nyisd meg a `http://localhost:3000` címet. A szerver terminálja maradjon nyitva; leállítás: Ctrl+C. Fejlesztéshez a build/start helyett `npm run dev` használható. PowerShell végrehajtási házirendi hiba esetén `npm.cmd` és `npx.cmd` használható.

Ha nincs gyakorlatkatalógus, a megfelelő tesztadatbázison `npm run seed:exercises` futtatható. Shop-mintákhoz `npm run seed:products`, demófiókhoz `npm run seed:demo-user` használható. Mindegyik adatbázisba ír; a demóseed törli és újraépíti a demófelhasználó adatait, ezért puszta indítás céljából ne futtasd.

Az ételkeresés külső szolgáltatást használ; külön étel-CSV nem szükséges az alapfolyamathoz. A Stripe helyi webhookpróbához külön terminálban futó CLI szükséges, például `stripe listen --events checkout.session.completed --forward-to http://localhost:3000/api/webhooks/stripe`. A CLI által kiírt signing secret tartozik ehhez a helyi listenerhez. A webshop jelenleg ismert kosár/Checkout összegeltérése miatt nem tekinthető lezárt fizetési tesztnek.

### Gyakori indítási hibák

- `node` vagy `npm` nem ismert: telepíts Node.js-t, majd nyiss új terminált; ellenőrizd a PATH-ot.
- `next` vagy `eslint` nem ismert: előbb sikeresen le kell futnia az `npm ci` parancsnak. Nem globális Next.js telepítés szükséges.
- Supabase URL/key hiányzik: a gyökérben lévő `.env.local` nevét és a két kötelező értéket ellenőrizd.
- Hiányzó adatbázisoszlop: ellenőrizd az alkalmazott migrációkat; a klónozás önmagában nem frissíti a távoli adatbázist.
- Foglalt 3000-es port: állítsd le a korábbi példányt, vagy válassz másik portot, és igazítsd hozzá az URL-beállításokat.

### Rögzített frissklón-próba

2026-11-19: a hallgató saját Windows gépén, külön friss klónból sikeres futtatást jelzett az `npm ci` és az ajánlott ellenőrzési/indítási lépések után. Kezdetben a függőségek hiánya miatt a `next` parancs nem volt elérhető; telepítés után működött. Ez friss forráskönyvtárból végzett helyi telepítési próba, nem új operációs rendszeren vagy másik gépen végzett vizsgálat. A pontos Node/npm-verzió, a klón commitazonosítója és az egyes parancsok kimenete még nincs csatolva. Meglévő távoli adatbázis használata nem igazolja az üres adatbázisból történő inicializálást.

Az eredményhez érdemes megőrizni: dátum, OS, `node -v`, `npm -v`, `git rev-parse HEAD`, ellenőrzési kimenetek, belépés és a fő képernyők megnyitásának eredménye, valamint mentés utáni frissítés próbája. A hiányzó bizonyítékokat ne helyettesítsd feltételezett sikerrel.

1. [Előfeltételek](#1-eloefeltetelek)
2. [Supabase projekt létrehozása](#2-supabase-projekt-letrehozasa)
3. [Adatbázis migráció és RLS](#3-adatbazis-migracio-es-rls)
4. [Storage bucket konfiguráció](#4-storage-bucket-konfiguracio)
5. [Auth provider beállítása](#5-auth-provider-beallitasa)
6. [Stripe integráció](#6-stripe-integracio)
7. [OpenRouter API kulcs](#7-openrouter-api-kulcs)
8. [Seed scriptek futtatása](#8-seed-scriptek-futtatasa)
9. [Demo user létrehozása](#9-demo-user-letrehozasa)
10. [Vercel deployment](#10-vercel-deployment)
11. [Stripe webhook konfiguráció (post-deploy)](#11-stripe-webhook-konfiguracio-post-deploy)
12. [Post-deploy ellenőrző lista](#12-post-deploy-ellenorzo-lista)
13. [Backup beállítása](#13-backup-beallitasa)
14. [Monitoring és hibakeresés](#14-monitoring-es-hibakereses)

---

## 1. Előfeltételek

- Node.js 22.22.2+ vagy 24.15.0+ és npm helyileg (lásd a README követelményét)
- GitHub fiók (a kód forrásrepóhoz)
- Supabase fiók ([supabase.com](https://supabase.com))
- Stripe fiók ([stripe.com](https://stripe.com)) — TEST módban használjuk
- OpenRouter fiók ([openrouter.ai](https://openrouter.ai))
- Vercel fiók ([vercel.com](https://vercel.com))
- Stripe CLI helyi fejlesztéshez (opcionális, de ajánlott)

---

## 2. Supabase projekt létrehozása

1. Jelentkezz be a [Supabase Dashboard](https://supabase.com/dashboard)-ra.
2. **New project** → adj meg egy projektnevet (pl. `fittrack-pro`).
3. Válassz egy régiót (lehetőleg EU, pl. Frankfurt), állíts be erős
   adatbázis jelszót és mentsd el biztonságos helyre.
4. Várd meg, amíg a projekt elindul (~2 perc).
5. Settings → API menüben jegyezd fel:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
     (TILOS bárhol kliens kódba vagy git-be elhelyezni)

---

## 3. Adatbázis migráció és RLS

A `supabase/migrations/` könyvtár a teljes séma + RLS policy-ket tartalmazza.

### 3.1 Migráció futtatása (Supabase CLI)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 3.2 Vagy SQL Editor-ben manuálisan

Másold be időrendi sorrendben minden migráció tartalmát a Dashboard → SQL
Editor felületre, és futtasd egyenként:

1. `20260101000000_initial_schema.sql` — táblák, indexek, `handle_new_user`
   trigger
2. `20260430000003_rls_policies.sql` — RLS policy-k
3. `20260430000004_auth_config.sql` — no-op (manuális Auth beállítás)
4. `20260430000005_storage_buckets.sql` — `avatars` bucket + policy-k
5. `20260430000007_workout_rpc.sql` — `update_exercise_order` és
   `set_active_workout_plan` RPC
6. `20260430000008_exercises_search.sql` — `search_vector` GIN index
7. `20261021000009_workout_exercise_skip.sql` — kihagyott edzésgyakorlat jelölése
8. `20261021000010_weekly_analysis_comparison.sql` — szabályalapú eredmény, AI állapot és bemeneti heti adatok mentése

### 3.3 RLS ellenőrzés (kötelező)

A Supabase Studio Tables nézetben minden alkalmazás táblán a "RLS enabled"
zöld jelzésnek kell látszania:

- `profiles`, `workout_plans`, `workout_days`, `workout_day_exercises`
- `daily_logs`, `food_entries`, `weight_logs`, `weekly_analyses`
- `products`, `orders`, `order_items`, `workout_exercise_logs`
- `exercises`

Manuális verifikációs lépések (két test userrel) lásd a
`20260430000003_rls_policies.sql` fájl 3.4 szekcióját.

---

## 4. Storage bucket konfiguráció

A migráció létrehozza az `avatars` publikus bucket-et és a RLS policy-ket
(`{auth.uid()}/...` prefix korlátozással). Verifikáció:

- Dashboard → Storage → Buckets: `avatars` bucket szerepel, **Public**
  jelzéssel.
- Storage → Policies: négy policy aktív:
  - "Avatars are publicly readable" (SELECT)
  - "Users can upload own avatar" (INSERT)
  - "Users can update own avatar" (UPDATE)
  - "Users can delete own avatar" (DELETE)

---

## 5. Auth provider beállítása

A Supabase Auth konfigurációja **NEM** futtatható SQL-ből — Dashboard-ban
kell beállítani.

### 5.1 Email + Password provider

Settings → Authentication → Providers → **Email**:

- Enable Email provider: **ON**
- Confirm email: **OFF** (egyszerűbb fejlesztéshez) vagy **ON**
  (production-ben ajánlott; az alkalmazás mindkettővel kompatibilis)

### 5.2 Site URL és Redirect URLs

Settings → Authentication → URL Configuration:

- **Site URL**: a production deployment URL
  (pl. `https://fittrack-pro.vercel.app`)
- **Redirect URLs**: add hozzá az összes érvényes origint:
  - `https://fittrack-pro.vercel.app`
  - `https://*.vercel.app` (preview deployment-ekhez, ha kell)
  - `http://localhost:3000` (lokális fejlesztéshez)

### 5.3 Rate limit (production)

Settings → Authentication → Rate Limits — alapértelmezett értékek
általában elegendőek. A signUp / signIn endpoint-okra IP alapú
korlátozás van.

### 5.4 Email Templates (opcionális)

Authentication → Email Templates: testreszabható confirm / reset / magic
link sablonok. Ha enabled a Confirm email, érdemes magyar nyelvű
sablont megadni.

---

## 6. Stripe integráció

### 6.1 Test mode kulcsok

1. [Stripe Dashboard](https://dashboard.stripe.com) → ellenőrizd, hogy
   **Test mode** van bekapcsolva (jobb felső kapcsoló).
2. Developers → API keys:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (Reveal test key) → `STRIPE_SECRET_KEY`

### 6.2 Webhook endpoint (a Vercel deploy UTÁN állítható be)

A `/api/webhooks/stripe` endpoint regisztrálása a 11. szekcióban
(post-deploy lépés).

### 6.3 HUF currency

Az alkalmazás Magyar forintban (`huf`) hozza létre a Stripe Checkout
Session-t. A HUF zero-decimal currency, ezért a `unit_amount` mező a
forint érték (nem fillér).

---

## 7. OpenRouter API kulcs

1. [openrouter.ai/keys](https://openrouter.ai/keys) → **Create Key**
2. Adj nevet a kulcsnak (pl. `fittrack-pro-prod`)
3. Másold ki és tedd a `OPENROUTER_API_KEY` env varba
4. Az elemzés az OpenRouter `openrouter/free` modellrouterét használja; ez az
   elérhető ingyenes modellek közül választ, ezért a konkrét modell idővel
   változhat. Az ingyenes végpontok korlátozott kapacitásúak.

---

## 8. Seed scriptek futtatása

A `scripts/` könyvtárban két seed script található. Mindkettő
`SUPABASE_SERVICE_ROLE_KEY`-t használ (RLS-bypass).

```bash
# Lokálisan, a .env.local fájl beállítása után:
npm install
npx tsx scripts/seed-exercises.ts   # ~150-200 exercises a wger API-ból
npx tsx scripts/seed-products.ts    # ~24 supplement termék
```

A scriptek idempotensek (UPSERT-elnek), ezért biztonságosan futtathatók
újra. A `seed-exercises.ts` az OpenRouter-t is használja a hiányzó magyar
fordításokhoz, ezért az `OPENROUTER_API_KEY` env varnak is be kell
állítva lennie.

---

## 9. Demo user létrehozása

A `seed-demo-user.ts` script létrehoz egy működő demó felhasználót két egymást
követő, lezárt és kézzel ellenőrizhető teszthéttel. **Minden futás törli a
`demo@fittrack.hu` felhasználó korábbi naplóadatait, edzéstervét és elemzéseit**;
valódi felhasználóra ne futtasd.

```bash
npx tsx scripts/seed-demo-user.ts
```

**Demo bejelentkezési adatok:**

- Email: `demo@fittrack.hu`
- Jelszó: `Demo1234!`

A script:

- Létrehozza vagy újrahasznosítja a meglévő demo user-t (admin createUser)
- Kitölti a profile-ját (cél: fogyás, ülő életmód, 35 éves férfi, 90 kg, 178 cm)
- Létrehoz egy aktív, heti 4 napos tervet, napi 5 gyakorlattal
- Előző lezárt hét: 2/4 részletes edzés, 4/7 étkezési nap, 2 súlymérés
- Legutóbbi lezárt hét: 3/4 részletes edzés növekvő terheléssel, 6/7 étkezési nap, 5 súlymérés
- Kiírja az elvárt átlagokat és volumeneket; a README tartalmazza a konkrét értékeket
- Minta (nem AI által generált) heti elemzést rögzít a legutóbbi lezárt hétről

Az alkalmazás ellenőrzése előtt futtasd a következő parancsokat: `npm run lint`,
`npx tsc --noEmit`, `npm test`, `npm run build`. A kézi heti adatellenőrzés lépéseit
a gyökér `README.md` fájl tartalmazza.

---

## 10. Vercel deployment

### 10.1 Repository import

1. [Vercel Dashboard](https://vercel.com/new) → Import GitHub
   repository.
2. Framework Preset: **Next.js** (automatikusan detektálódik).
3. Root Directory: `./` (a projekt gyökér).

### 10.2 Environment Variables

Settings → Environment Variables — másold be a `.env.example` összes
kulcsát a megfelelő production értékekkel. Minden változó három
környezetben (Production, Preview, Development) álljon készen.

| Név | Hatókör |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview |
| `OPENROUTER_API_KEY` | Production + Preview |
| `STRIPE_SECRET_KEY` | Production + Preview |
| `STRIPE_WEBHOOK_SECRET` | Production + Preview (post-deploy frissül!) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | All |

### 10.3 Build és deploy

A Vercel automatikusan futtatja a `next build` parancsot. Az első deploy
végén a publikus URL elérhető lesz. Ezt az URL-t kell beírni a Supabase
Auth Site URL / Redirect URLs mezőjébe (lásd 5.2).

### 10.4 vercel.json

A repo gyökerében található `vercel.json` a long-running route-ok
(`/api/analysis`, `/api/webhooks/stripe`) max futási idejét állítja
30 másodpercre.

---

## 11. Stripe webhook konfiguráció (post-deploy)

A Vercel deploy UTÁN, miután már van publikus URL:

1. Stripe Dashboard → Developers → **Webhooks** → Add endpoint
2. **Endpoint URL**:
   `https://<your-vercel-domain>/api/webhooks/stripe`
3. **Events to send**: `checkout.session.completed`
4. Mentés után másold ki a **Signing secret** értéket
   (`whsec_...`).
5. Vercel → Project Settings → Environment Variables →
   `STRIPE_WEBHOOK_SECRET` érték frissítése.
6. Redeploy (Vercel → Deployments → … → Redeploy), hogy az új env var
   életbe lépjen.

---

## 12. Post-deploy ellenőrző lista

- [ ] A `/login` és `/register` oldalak elérhetők, regisztráció működik
- [ ] Új user bejelentkezés után átirányít `/onboarding` route-ra (a
      `handle_new_user` trigger üres `profiles` sort hozott létre)
- [ ] Onboarding kitöltése után a Dashboard betölt
- [ ] Workout plan létrehozható, gyakorlat hozzáadható
- [ ] Calorie napló bejegyzés hozzáadható (Open Food Facts kereső is működik)
- [ ] Weight log bejegyzés menthető a `/progress` oldalon
- [ ] AI elemzés generálása (`POST /api/analysis`) sikeres
- [ ] Webshop: termék kosárhoz adható, checkout session létrejön, Stripe
      test bankkártyával fizethető (`4242 4242 4242 4242`)
- [ ] Sikeres fizetés után a Stripe webhook létrehozza az `orders` és
      `order_items` rekordokat (Supabase Studio → Table Editor)
- [ ] RLS ellenőrzés: másik user-rel ne legyenek láthatók az adatok
      (lásd 3.3)
- [ ] Storage: avatar feltöltése sikeres, csak a saját mappába tölthet a
      user

---

## 13. Backup beállítása

Supabase a fizetős terveken automatikus napi backup-ot biztosít, és
manuális backup is futtatható.

### 13.1 Automatikus napi backup

Dashboard → Project Settings → **Database** → **Backups**:

- **Free tier**: napi automatikus backup, 7 nap megőrzés
- **Pro tier (és felette)**: napi automatikus + Point-In-Time Recovery
  (PITR) 7-30 napig

A backup-ok automatikusan készülnek, nincs külön teendő a felhasználó
részéről.

### 13.2 Manuális backup (recommended monthly)

Supabase Pro tier:

- Dashboard → Project Settings → Database → Backups → **Restore /
  Download** lista

CLI alternatíva (a teljes adatbázis dump letöltése helyileg):

```bash
npx supabase db dump --linked -f backup-$(date +%Y%m%d).sql
```

A létrejövő `.sql` fájlt érdemes biztonságos helyre menteni
(pl. magán S3 bucket, Google Drive titkosítva).

### 13.3 Visszaállítás teszt

Évente legalább egyszer ajánlott egy másik (staging) projekten
végrehajtani a backup visszaállítását, hogy biztosítsuk a folyamat
működőképességét:

```bash
npx supabase db reset --linked         # üres adatbázis
psql $STAGING_DATABASE_URL < backup.sql # backup visszaállítása
```

### 13.4 Storage backup

A `avatars` bucket tartalma az adatbázis dump-ban NEM szerepel. Storage
backup szükséges a Supabase Studio Storage UI-n keresztül vagy a
`@supabase/storage-js` SDK-n át. A FitTrack Pro adatkészletében az
avatar-ok nem kritikusak (csak felhasználói profilkép), ezért
opcionálisan kezelendő.

---

## 14. Monitoring és hibakeresés

### 14.1 Vercel logs

Vercel Dashboard → Project → **Logs** menüpontban valós időben látszanak
a runtime logok. Az API route hibák itt jelennek meg.

### 14.2 Supabase logs

Dashboard → **Logs** → Postgres / Auth / Storage / Edge — a megfelelő
forrásnál szűrhető hibatípusra.

### 14.3 Stripe webhook logs

Dashboard → Developers → Webhooks → kiválasztott endpoint →
**Recent deliveries**. Sikertelen kézbesítések újraküldhetők kézzel.

### 14.4 Gyakori hibák

| Tünet | Lehetséges ok |
| --- | --- |
| 401 Bejelentkezés szükséges minden API-n | Auth cookie nem sync-el — ellenőrizd, hogy a middleware fut a kérésen |
| 500 Adatbázis hiba | RLS policy hiányzik vagy az env var hibás |
| `/api/analysis` 503 | OpenRouter elérhetetlen vagy az API kulcs hibás |
| Stripe webhook 400 | A `STRIPE_WEBHOOK_SECRET` env var nem egyezik a Dashboard-on lévő secret-tel |
| Avatar feltöltés "Profil frissítése sikertelen" | A `profiles` UPDATE policy hiányzik vagy a storage bucket policy hibás |

---

**Utolsó módosítás:** Iteration 14 (Integráció, Tesztelés, Deployment).
