# FitTrack – SZD II. Fejlesztési és Hibajavítási Végrehajtási Terv (AI Agent Specifikáció)

## 0. Aktuális haladás (2026-10-22)

| Fázis | Állapot | Ellenőrzés / hátralévő munka |
|---|---|---|
| 1. Technikai blokkolók, telepíthetőség és build | **KÉSZ** | `npm ci`, `npm run lint` és `npm run build` sikeresen lefutott. Az `npm ci` Node 24.11.1 alatt `mute-stream` engine figyelmeztetést adott; ez nem akadályozta a telepítést. |
| 2. Részletes edzésnapló felület | **KÉSZ – felhasználói kézi próba visszaigazolva** | A felhasználó megerősítette a súly/ismétlésszám mentését, új szett hozzáadását, újratöltés utáni visszatöltést és kihagyott gyakorlat jelölését; a korábbi két runtime hiba már nem jelentkezik. A dolgozat ábrái a `docs/thesis/figures/` mappában vannak. |
| 3. Egységes heti összesítő és hiányos adatok | **KÉSZ – felhasználói demo visszaigazolva** | A hétválasztó és az összehasonlító nézet látható. A felhasználó sikeresen lefuttatta a migrációkat és a demo seedet; az alkalmazásban a 2026. október 5–11. és október 12–18. hetek ellenőrizhető értékekkel jelennek meg. A kézi eredményről képernyőkép készült. |
| 4. Szabályalapú és MI-visszajelzés összehasonlítása | **MŰKÖDŐ – élő AI-próba korábban visszaigazolva; seed minta szabályalapú** | A felhasználó sikeres AI-jelentést jelzett. A demo seed szándékosan szabályalapú mintát tesz be, ezért a felületen ezt mintaként kell megkülönböztetni az élő AI-választól. A prezentáció előtt érdemes ugyanarra a hétre új AI-elemzést futtatni és annak eredményét is rögzíteni. |
| 5. Ellenőrizhető teszthetek és reprodukálható indítás | **KÉSZ – seed sikeres, automatizált tesztek sikeresek** | A felhasználó sikeresen lefuttatta a demó seedet; az elvárt heti értékek kiíródnak. A projekt unit tesztjei lefutottak. A tiszta, másik gépen történő telepítési próba ettől még külön ellenőrzés. |
| 6. Szakdolgozat és bemutató előkészítése | **MUNKAVÁLTOZAT ELKÉSZÜLT – átnézés és formai sablon hátra** | Elkészült az első tartalmi szöveg, tesztforgatókönyv, bemutatóvázlat és a képernyőképek jegyzéke a `docs/thesis/` mappában. A kari sablon és saját ellenőrzés szükséges a véglegesítéshez. |

> A „megvalósítva” a kód elkészültét jelenti; a 2. fázis csak a felsorolt kézi, adatbázissal végzett próba után jelölhető teljesen késznek.

**Már visszaigazolt külső lépések:** a felhasználó elvégezte a Supabase migrációkat és a demo seed sikeresen lefutott. A heti összesítő képernyőképe rendelkezésre áll, az edzésnapló mentése és kihagyás-jelölése kézi próbán működött, az AI-jelentés korábban működött.

**Hátralévő, beadás előtti lépések:** a szakdolgozat szövegét a kari sablonba kell rendezni és szakmailag átnézni; az aktuális demo hétre friss AI-elemzést érdemes futtatni, az AI- és szabályalapú kimenetet külön képernyőképpel dokumentálni; az október 23-i bemutató tesztforgatókönyvét végig kell próbálni; a heti tényleges munkaidőt a hallgatónak kell rögzítenie; a kívánt GitHub commit/push még külön elvégzendő hallgatói lépés. A projektbe titok vagy `.env.local` fájl nem kerülhet.

### Féléves mérföldkövek és dokumentációs teljesség

A témavezető félévi tájékoztatója alapján a projekt következő belső határidői:

| Határidő | Elvárt állapot | FitTrack teendő |
|---|---|---|
| 2026. október 22. | A fő felhasználói folyamatok működnek; első dokumentált telepítés; a problémafelvetés, követelmények és tervezés érdemi szövege elkészül. | A mostani kézirat tartalmi vázlat; a dokumentált telepítés és a kézi teszteredmények rögzítése még szükséges. |
| 2026. november 13. | Teljes szakdolgozat és projektcsomag véleményezésre elküldve, működő alkalmazással, szakmai dokumentációval, telepítési leírással és tényleges teszteredményekkel. | A fejezetek teljes kidolgozása; tiszta környezetű telepítés bizonyítása; követelmény–funkció–teszt megfeleltetés; felhasználói kipróbálás és nyitott hibák/korlátok rögzítése; témavezetői e-mail a változásokkal és kért visszajelzéssel. |
| 2026. december 4. | Témavezetői visszajelzés alapján javított szoftver és dolgozat; dokumentált felhasználói kipróbálás, újratesztelés és ellenőrzött telepítés. | Minden visszajelzéshez javítási és újratesztelési bizonyítékot csatolni. |
| 2026. december 11. | Végleges belső leadás: már véleményezett és javított dolgozat, azonosítható szoftververzió, dokumentáció és tesztbizonyítékok. | Verzió/commit rögzítése, teljes dokumentáció és PDF véglegesítése. |
| 2026. december 19. | Kari hivatalos beadási határidő a 2027. januári záróvizsgára készülőknek; a kari tájékoztatót külön ellenőrizni kell. | Hivatalos feltöltés. A témavezetőnek küldött e-mail és a GitHub önmagában nem helyettesíti. |

**A november 13-i teljes dokumentáció ellenőrzőlistája:**

- [ ] Probléma, célcsoport, érték, vállalási határ, függőségek és korlátok; indokolatlan üzleti terv nélkül.
- [ ] Ellenőrizhető funkcionális és minőségi követelmények, prioritások és elfogadási feltételek.
- [ ] Fő használati esetek előfeltételekkel, lépésekkel, alternatív/hibás ágakkal és eredménnyel.
- [ ] Fő képernyők és valós, olvasható képernyőképek számozott címmel, a szövegben hivatkozással és magyarázattal.
- [ ] Architektúra, külső kapcsolatok, telepítési felépítés és a fontos döntések alternatívákkal/indoklással.
- [ ] Adatmodell, kapcsolatok, kulcsok, ellenőrzések, migrációk és inicializálás.
- [ ] Modulfelelősségek és fontos API-k bemenete, kimenete, hibája és jogosultsága.
- [ ] Biztonság, RLS, hitelesítés, bemenet-ellenőrzés, titkok és adatkezelés.
- [ ] Telepítési és használati útmutató tényleges végigpróbálása; ismert hibák, korlátok és elhalasztott funkciók.
- [ ] Tesztjegyzőkönyv verzióval, dátummal, környezettel, adatokkal, lépésekkel, elvárt/tényleges eredménnyel és bizonyítékhellyel.
- [ ] UAT célfelhasználóval, vagy a korlátozott kipróbálás őszinte leírása; fejlesztői sajátpróba nem nevezhető külső UAT-nak.
- [ ] Követelmény–használati eset–megvalósítás–teszt megfeleltetési tábla.
- [ ] MI használata a fejlesztés során: eszközök, feladatok, elfogadott/módosított/elvetett javaslatok, hibák, ellenőrzés és saját mérnöki döntések; rövid repository-naplóval.
- [ ] A beépített AI-funkció külön eredményességének, hibáinak és korlátainak értékelése.

## 1. Projekt Kontextus és Fő Célkitűzés
A **FitTrack** egy Next.js (App Router) és Supabase alapú edzés-, táplálkozás- és testsúlykövető webalkalmazás. 
A jelenlegi fejlesztési szakasz (SZD II.) egyetlen központi célja a **zárt, összefüggő heti alapfolyamat** hibamentes biztosítása és igazolása:
1. **Cél és terv:** Személyes cél beállítása a profilban és heti edzésterv összeállítása.
2. **Tényleges naplózás:** Elvégzett edzések (részletes szériákkal, ismétlésekkel és súlyokkal), napi étkezések és testsúly rögzítése.
3. **Megbízható heti összesítés:** A tervezett és a ténylegesen elvégzett munka összevetése, a hiányos adatok torzításmentes kezelésével.
4. **Adatokkal indokolható MI-visszajelzés:** Egy determinisztikus (szabályalapú) heti összesítő és az MI által generált szöveges értékelés egymás melletti bemutatása és összehasonlítása.

### Szigorúan Félretett (Out-of-Scope) Funkciók
Az alábbi területeken **tilos** új funkciót fejleszteni (csak a build-hibák elhárításához szabad hozzájuk nyúlni):
- Webshop bővítése (`src/app/(protected)/shop/`, `src/components/shop/`)
- Automatikus edzésterv-módosítás
- Összetettebb ajánlórendszerek

---

## 2. Globális Architektúra és Üzleti Logikai Szabályok (Guardrails)
Minden kódmódosítás során kötelező betartani az alábbi szabályokat:
1. **Hiányzó adat != Nulla teljesítmény:** Ha a felhasználó egy adott napon nem naplózott étkezést vagy edzést, azt a rendszernek „hiányzó bejegyzésként” (`unlogged` / `missing`) kell kezelnie, nem pedig `0 kcal` bevitelként. A heti átlagokat kizárólag a **ténylegesen naplózott napok számával** szabad osztani, külön jelezve a lefedettséget (pl. `Rögzített étkezési napok: 5/7`).
2. **Tervezett vs. Elvégzett munka szétválasztása:** Az edzésnapló nem állhat meg egy egyszerű „Edzés kész” logikai jelölésnél; a heti értékelésnek a ténylegesen rögzített gyakorlatokra, szériákra, ismétlésszámokra és megmozgatott súlyokra (terhelésre / volumenre) kell épülnie.
3. **Adatkonzisztencia (Single Source of Truth):** A felületen megjelenő heti áttekintő grafikonok/kártyák és az MI-elemzésnek átadott adatok pontosan ugyanazokból a lekérdezésekből és számításokból származzanak.
4. **MI tartalmi korlátok:** Az MI-visszajelzés kizárólag a rendszerben rögzített adatok értelmezésére szorítkozhat. Tilos orvosi diagnózist, egészségügyi tanácsot vagy szélsőséges étrendi/kalóriamegvonási javaslatot adnia. Minden megállapításnál meg kell neveznie a alapul szolgáló adatot, és jeleznie kell a bizonytalanságot, ha kevés a naplózott nap.
5. **Adatvédelem (RLS és Auth):** Minden lekérdezésnek és szerveroldali műveletnek (`Server Actions`, `Route Handlers`) tiszteletben kell tartania a Supabase autentikációt és a Row Level Security (`supabase/migrations/20260430000003_rls_policies.sql`) szabályokat.

---

## 3. Végrehajtási Fázisok (Prioritási Sorrendben)

### 1. FÁZIS: Technikai Blokkolók, Telepíthetőség és Build Javítása (P0)
**Probléma:** A tiszta telepítés a csomaglista és a zárolt verziók eltérése miatt megáll, a build a Stripe verzióeltérésén elakad, a linter pedig 3 hibát jelez.

**Érintett fájlok:**
- `package.json` és `package-lock.json`[cite: 1, 2]
- `eslint.config.mjs` és a linter által jelzett forrásfájlok[cite: 1, 2]
- `src/app/api/checkout/route.ts`[cite: 1, 2]
- `src/app/api/webhooks/stripe/route.ts`[cite: 1, 2]

**Feladatok:**
1. Szinkronizáld a `package.json` és `package-lock.json` fájlokat úgy, hogy a `npm ci` és `npm install` parancsok tiszta környezetben hiba nélkül lefussanak[cite: 1, 2].
2. Javítsd a Stripe SDK példányosítását és az `apiVersion` típusütközését a `src/app/api/checkout/route.ts` és `src/app/api/webhooks/stripe/route.ts` fájlokban, hogy a TypeScript fordítás ne akadjon el (és hiányzó Stripe env változó esetén se omoljon össze a buildidőben történő kiértékelés)[cite: 1, 2].
3. Futtasd a `npm run lint` parancsot, és javítsd ki a fennálló ESLint hibákat.

**Elfogadási kritérium (Verification):**
- `npm ci` -> 0 hiba
- `npm run lint` -> 0 error
- `npm run build` -> Sikeres produkciós build

---

### 2. FÁZIS: Részletes Edzésnapló Háttérművelet Összekötése a Felülettel (P0)
**Probléma:** A részletes edzésnapló (gyakorlatok, szériák, ismétlések, súlyok mentése) háttérművelete már szerepel az adatbázisban és a szerveroldali kódban, de nincs bekötve a felhasználói felületre.

**Érintett fájlok:**
- `supabase/migrations/20260430000007_workout_rpc.sql`[cite: 1, 2]
- `src/lib/workouts/actions.ts` és `src/lib/workouts/queries.ts`[cite: 1, 2]
- `src/lib/dashboard/actions.ts` és `src/lib/dashboard/queries.ts`[cite: 1, 2]
- `src/components/dashboard/workout-widget.tsx`[cite: 1, 2]
- `src/app/(protected)/workouts/[id]/page.tsx`[cite: 1, 2]
- `src/components/workouts/workout-plan-editor.tsx` és `src/components/workouts/workout-day-exercise-card.tsx`[cite: 1, 2]

**Feladatok:**
1. Ellenőrizd a `src/lib/workouts/actions.ts` fájlban lévő edzésnapló-mentő Server Actiont és a `20260430000007_workout_rpc.sql` RPC függvény paraméterezését[cite: 1, 2].
2. Hozz létre egy könnyen kezelhető, mobilbarát **Edzésnaplózó Dialógust / Sheet-et** (`src/components/ui/dialog.tsx` vagy `src/components/ui/sheet.tsx` felhasználásával), amely megnyitható a `src/components/dashboard/workout-widget.tsx` komponensből és az edzésterv oldaláról (`src/app/(protected)/workouts/[id]/page.tsx`)[cite: 1, 2].
3. A naplózó felületen a kiválasztott edzésnap tervezett gyakorlatai jelenjenek meg előtöltve (tervezett széria és ismétlésszám alapján), ahol a felhasználó szériánként (set) megadhatja/módosíthatja:
   - a ténylegesen elvégzett ismétlésszámot (`reps`),
   - az alkalmazott súlyt kg-ban (`weight`),
   - valamint lehetősége van gyakorlatot kihagyni vagy extra szériát hozzáadni.
4. Mentéskor a felület hívja meg a részletes háttérműveletet, kezelje a betöltési és hibaállapotokat (sikertelen mentés esetén jelenjen meg egyértelmű visszajelzés `sonner` toast-tal az újrapróbálkozáshoz), és tegye visszanézhetővé a már rögzített edzésnaplókat[cite: 1, 2].

**Elfogadási kritérium:**
- A felhasználó a felületen képes egy edzésnaphoz konkrét súlyokat és ismétléseket rögzíteni, majd az elmentett adatokat visszanézni és javítani.

---

### 3. FÁZIS: Egységes Heti Összesítő és Hiányos Adatok Kezelése (P1)
**Probléma:** Biztosítani kell, hogy a célok, a terv és a ténylegesen naplózott adatok összhangban legyenek, a hiányzó napok ne húzzák le nullára az átlagot, és a számítás kézzel is ellenőrizhető legyen.

**Érintett fájlok:**
- `src/lib/analysis/queries.ts`[cite: 1, 2]
- `src/lib/dashboard/queries.ts`[cite: 1, 2]
- `src/lib/calories/queries.ts`[cite: 1, 2]
- `src/lib/weight/queries.ts`[cite: 1, 2]
- `src/components/dashboard/weekly-activity-widget.tsx`, `calories-widget.tsx`, `weight-trend-widget.tsx`[cite: 1, 2]
- `src/components/calories/weekly-trend-chart.tsx`[cite: 1, 2]
- `src/components/progress/weight-summary-card.tsx` és `weight-chart.tsx`[cite: 1, 2]

**Feladatok:**
1. Egységesítsd a heti aggregációs logikát (`src/lib/analysis/queries.ts` és `src/lib/dashboard/queries.ts`), hogy ugyanaz a számítás szolgálja ki a felületi widgeteket és a heti elemző végpontot[cite: 1, 2].
2. A heti összesítő mutassa ki az alábbi, kézzel is ellenőrizhető mutatókat az aktuális és az előző hétre:
   - **Cél:** Felhasználói cél (pl. fogyás / tömegnövelés / szinten tartás) és napi kalória/makró célérték (`src/lib/profile/queries.ts` alapján)[cite: 1, 2].
   - **Edzés:** Tervezett edzésnapok száma vs. ténylegesen naplózott edzések száma, összesített heti terhelés/volumen ($\sum \text{széria} \times \text{ismétlés} \times \text{súly}$), valamint a változás az előző héthez képest.
   - **Táplálkozás:** Naplózott napok száma (`X / 7 nap`), a **naplózott napok** napi kalória- és fehérjeátlaga, valamint az eltérés a napi céltól.
   - **Testsúly:** Heti mérések száma, heti átlagsúly és a változás az előző heti átlaghoz képest (ha nincs elég mérés, jelezze: „Nincs elég adat a trendhez”).

**Elfogadási kritérium:**
- Ha egy héten 5 napon 2000 kcal van rögzítve és 2 napon nincs bejegyzés, a kijelzett napi átlag pontosan 2000 kcal (`5/7 nap alapján`), nem pedig 1428 kcal.

---

### 4. FÁZIS: Szabályalapú Összefoglaló vs. Adatokkal Indokolható MI-visszajelzés (P1)
**Probléma:** A dolgozatban és az alkalmazásban igazolni kell, milyen többletet ad az MI egy egyszerű szabályalapú összefoglalóhoz képest, biztosítva a tartalmi korlátokat és a hibatűrést.

**Érintett fájlok:**
- `src/app/api/analysis/route.ts`[cite: 1, 2]
- `src/lib/analysis/queries.ts`[cite: 1, 2]
- `src/components/progress/analysis-overlay.tsx`, `analysis-cta.tsx`, `analysis-history.tsx`[cite: 1, 2]
- `src/components/dashboard/ai-analysis-widget.tsx`[cite: 1, 2]

**Feladatok:**
1. Készíts egy **determinisztikus (szabályalapú) heti értékelő függvényt** (`generateRuleBasedSummary`), amely pusztán egyszerű `if/else` szabályokból szöveges és strukturált összefoglalót készít a 3. fázis mutatóiból (pl. célhoz viszonyított kalóriaeltérés, edzésteljesítési arány, adatlefedettség figyelmeztetés).
2. Módosítsd a `src/app/api/analysis/route.ts` végpontot úgy, hogy[cite: 1, 2]:
   - Először állítsa elő az ellenőrzött heti adatszerkezetet és a szabályalapú összefoglalót.
   - Az MI rendszerutasítása (System Prompt) szigorúan írja elő:
     - Csak az átadott JSON adatokból dolgozhat (hallucináció és téves számadatok tilalma).
     - Minden megállapításnál hivatkoznia kell a konkrét számokra (pl. „A 4 tervezett edzésből 3 naplózott alkalom és a 6/7 napos étkezési napló alapján...”).
     - Jeleznie kell a bizonytalanságot, ha hiányos a napló (pl. kevesebb mint 4 étkezési nap vagy 2 súlymérés).
     - Tilos orvosi tanácsot vagy szélsőséges diétát javasolnia.
     - Adjon konkrét, biztonságos következő heti javaslatot.
   - **Hibatűrés (Fallback):** Ha az MI szolgáltatás nem érhető el vagy hibát dob, a végpont ne omoljon össze, hanem adja vissza a szabályalapú összefoglalót egy barátságos jelzéssel, hogy a felhasználó munkája és a heti értékelés akkor is használható maradjon.
3. A `src/components/progress/analysis-overlay.tsx` és `analysis-history.tsx` felületen jelenítsd meg átláthatóan mind a **Szabályalapú (alap) összefoglalót**, mind az **MI részletes magyarázatát**, hogy a kettő közvetlenül összehasonlítható legyen[cite: 1, 2].

---

### 5. FÁZIS: Ellenőrizhető Mintafiók és Teszthetek Generálása (P1)
**Probléma:** A bemutatóhoz és a dolgozatbeli kiértékeléshez szükség van néhány előre összeállított, kézzel is utánaszámolható teszthétre (teljes és hiányos naplóval is).

**Érintett fájlok:**
- `scripts/seed-demo-user.ts`[cite: 1, 2]
- `README.md` és `docs/DEPLOYMENT.md`[cite: 1, 2]

**Feladatok:**
1. Bővítsd a `scripts/seed-demo-user.ts` szkriptet úgy, hogy a demó felhasználónak legalább **2 egymást követő, kézzel könnyen ellenőrizhető hetet** hozzon létre[cite: 1, 2]:
   - **Előző hét (Hiányos napló teszteléséhez):** 4 tervezett edzésből 2 részletesen naplózva, 4 nap étkezés rögzítve (3 üres nap), 2 testsúlymérés.
   - **Aktuális lezárt hét (Teljesebb folyamat teszteléséhez):** 4 tervezett edzésből 3 részletesen naplózva (konkrét súlyokkal és ismétlésekkel, növekvő terheléssel), 6 nap étkezés rögzítve (1 üres nap), 5 testsúlymérés.
2. Írd bele a szkript kimenetébe (konzolra) a kézzel kiszámolt elvárt heti értékeket (pontos kalóriaátlag, edzésvolumen, súlyváltozás), hogy a bemutatón egyetlen pillantással igazolható legyen a rendszer számításainak helyessége.
3. Frissítsd a `README.md` fájlt a pontos, más gépen is reprodukálható indítási lépésekkel (`.env.local` változók a `.env.example` alapján, migrációk, seed szkript futtatása, dev/build indítás)[cite: 1, 2].
