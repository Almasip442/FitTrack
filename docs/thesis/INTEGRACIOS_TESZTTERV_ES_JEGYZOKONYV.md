# Integrációs tesztterv és jegyzőkönyv

**Projekt:** FitTrack Pro
**Utoljára frissítve:** 2026. november 16.
**Vizsgált munkaváltozat:** a háromhetes fejlődésnézetet és az AI-válaszok célzott finomításait tartalmazó, még nem commitolt munkafa.
**Státusz:** az automatizált ellenőrzések és a Supabase API-integráció sikeresek. Az M-01–M-06 kézi próbája sikerült; az M-09–M-14 próbái hátravannak.

## 1. Cél és hatókör

Ez a dokumentum a heti mutatók számításának, az AI-válasz nyelvi ellenőrzésének és a fejlődésoldal háromhetes összehasonlító nézetének ellenőrzéseit rögzíti. A tesztek lefedik a determinisztikus heti összesítést, a terven felüli edzések kezelését, az angol válaszok szűrését, valamint a három heti panel szerveroldali HTML-megjelenítését.

Az automatizált renderelési teszt mintaadatokkal ellenőrzi a kártyát. A hitelesített Supabase API-próba eredményeit az A-05 és A-06 sorok rögzítik; ezek nem helyettesítik a böngészős vizuális vagy külső felhasználói tesztet. A felhasználó képernyőképeket osztott meg a böngészős és mobilnézetről; a még hátralévő javítás utáni ellenőrzés bizonyítéka később rögzítendő.

## 2. Környezet és futtatás

| Elem | Érték |
|---|---|
| Operációs rendszer | Windows, PowerShell |
| Node.js | v24.11.1 |
| Next.js build | 16.4.2 (Turbopack) |
| Kód | helyi munkafa; a vizsgálatkor nem készült commit |
| Külső szolgáltatás | az automatizált unit tesztekhez nem szükséges |
| Integrációs futtatás | production szerver `127.0.0.1:3100` címen; Supabase demo-fiók, titkos értékek naplózása nélkül |

Szokásos futtatási parancsok:

```powershell
npm test
npm run lint
npm exec tsc -- --noEmit
npm run build
```

Ebben a Codex sandboxban a `npm.cmd test` első indítása és az `os.userInfo()` külön ellenőrzése a Node `uv_os_get_passwd returned ENOMEM` hibájával leállt. A tesztet ezután egy ideiglenes, a repón kívüli Node preload shim segítségével futtattuk le. A shim kizárólag a `node:os.userInfo()` tesztfelhasználó-nevét adta meg, amelyet a `tsx` az ideiglenes könyvtárának nevéhez használ; nem módosította a projekt forrását. A shim törlése a futtatás után megtörtént. A lint, a TypeScript-ellenőrzés és a build shim nélkül sikerült.

## 3. Automatizált és integrációs ellenőrzések eredménye

| Azonosító | Ellenőrzés | Lefedett viselkedés | Eredmény |
|---|---|---|---|
| A-01 | `npm test` | Nyelvi validáció, szabályalapú összefoglaló, heti mutatók és háromhetes kártya | **SIKERES: 16/16** |
| A-02 | `npm run lint` | ESLint a projekt forrásán | **SIKERES: nincs hiba** |
| A-03 | `npm exec tsc -- --noEmit` | TypeScript típusellenőrzés | **SIKERES** |
| A-04 | `npm run build` | Optimalizált Next.js production build és route-generálás | **SIKERES** |
| A-05 | Hitelesített `GET /progress` demo felhasználóval | Production SSR oldal státusza, három heti panel és címkék | **SIKERES: HTTP 200; 3 panel; mindhárom hétcímke és a részleges hét jelölése megjelenik** |
| A-06 | Hitelesített `GET /api/progress/weekly` és hibás dátumok | Három heti adatcsomag, seedelt mutatók, bemeneti dátumvalidáció | **SIKERES: HTTP 200; három dátumcsomag és seedértékek egyeznek; 6 hibás eset HTTP 400** |

Az A-01 tesztcsomag fő esetei:

- a csak angol vagy vegyes nyelvű AI-válasz elutasítása, beleértve az angol „a” névelő ismétlődését;
- a hiányzó étkezési napok elkülönítése a nulla kalóriától;
- a két egymást követő hét adatai alapján készülő szabályalapú javaslatok feltételei;
- terven felüli edzések darabszámának megőrzése a legfeljebb 100%-os teljesítési mutató mellett;
- a részleges hét eltelt napjainak számítása, naplózott edzésvolumen és kalóriaátlag;
- három heti panel HTML-kimenete, a dátumok, a fő mutatók, valamint a részleges és lezárt hét címkéi.

A háromhetes panel tesztje: `src/lib/analysis/weekly-summary-card.test.ts`. Ez szerveroldali statikus renderelést vizsgál rögzített mintaadatokból. Nem ellenőrzi a hétválasztó interakcióit, az API hitelesítését, a Supabase-lekérdezést, a reszponzív megjelenést vagy a tényleges böngészős működést.

A helyi HTTP-próba során a `GET /login` `200` választ adott, a hitelesítés nélküli heti API-kérés pedig `401` választ adott. A dev szerver a sandbox hálózati korlátozása miatt nem tudta letölteni a Google Fonts betűkészleteket, ezért tartalék betűtípust használt; a végleges tipográfiai megjelenés böngészőben még ellenőrizendő.

## 4. Kézi integrációs tesztterv és állapot

Az API-integráció eredményeit az M-04, M-07 és M-08 sor rögzíti. Az M-01–M-06 böngészős próbája sikerült; az M-03 hétválasztó-kontraszt hibáját javítottuk, és a felhasználó böngészőben is visszaigazolta, hogy az opciók már olvashatók. A tesztelő a demófelhasználóval jelentkezzen be; a seed script a demófelhasználó korábbi tesztadatait törölheti és újragenerálhatja, ezért csak a demófiókot használja.

| Azonosító | Lépés | Elvárt eredmény | Tényleges eredmény / bizonyíték | Állapot |
|---|---|---|---|---|
| M-01 | Bejelentkezés után nyisd meg a `/progress` oldalt asztali szélességen. | Három kártya látszik: kiválasztott hét, előző hét és két héttel korábbi hét. A kártyák az edzést, volument, étkezési napokat, kalória-/fehérjeátlagot és testsúlyt mutatják. | 2026-11-16: sikeres; mindhárom heti panel és a várt mutatók megjelentek. Bizonyíték: a beszélgetésben megosztott képernyőképek. | **Sikeres** |
| M-02 | Ellenőrizd az aktuális hetet, majd válassz egy teljes történeti hetet. | Az aktuális, még tartó hét „Folyamatban · részleges hét”; a lezárult időszakok „Lezárt hét” jelölést kapnak. A részleges hét csak az eltelt napokat számolja. | 2026-11-16: sikeres; az aktuális és történeti hetek jelölései megfelelőek. | **Sikeres** |
| M-03 | Válts hetet a legördülő listával, majd az előző/következő hét gombbal. | Mindhárom panel dátuma és adata a kiválasztáshoz igazodik; betöltés közben látható a függő állapot, hiba esetén magyar hibaüzenet jelenik meg. | 2026-11-16: első próbán a váltás működött, de az opciók fehér alapon fehér szöveggel jelentek meg. A témához igazodó opcióstílus javítása után a felhasználó újra ellenőrizte és visszaigazolta, hogy jól működik. Hibás betöltést nem tapasztalt. | **Sikeres** |
| M-04 | A demo seed után válaszd ki a 2026-10-12-én kezdődő hetet. | A panelek a 2026-10-12., 2026-10-05. és 2026-09-28. héthez tartoznak. Az első két hét mutatóit vesd össze a demo seed által kiírt értékekkel; a korábbi, nem seedelt hét hiányzó adatait a felület ne tüntesse fel valós naplózásként. | 2026-11-16: sikeres; a panelek és az adatok megfeleltek. A seedelt hetek mutatói egyeznek; a seed nélküli héten a fehérje és testsúly hiányzóként jelenik meg, a kalóriaátlagot pedig a felület nem állítja be naplózott adatként. Bizonyíték: a beszélgetésben megosztott képernyőképek. | **Sikeres** |
| M-05 | Nyiss meg hiányos étkezési és testsúlyadatú hetet. | A naplózatlan nap nem jelenik meg nulla kalóriás napként; hiányzó testsúly- vagy fehérjeadatnál az alkalmazás hiányt jelez, nem kitalált értéket. | 2026-11-16: sikeres; a hiányzó étkezési, fehérje- és testsúlyadatokat a felület hiányzóként jelzi. | **Sikeres** |
| M-06 | Szűkítsd a böngészőablakot mobilméretre. | A három panel egymás alatt, levágás és vízszintes oldal-túlcsordulás nélkül jelenik meg. | 2026-11-16: sikeres; nem tapasztaltál vízszintes túlcsordulást. Bizonyíték: a beszélgetésben megosztott mobilképernyőképek. | **Sikeres** |
| M-07 | PowerShellből kérd le hitelesítés nélkül a heti API-t. | A `GET /api/progress/weekly?week_start=2026-10-12` válasza `401`. | 2026-11-16: `401` HTTP státuszkód; helyi szerveren, böngészős hitelesítési cookie nélkül ellenőrizve. | **Sikeres** |
| M-08 | Hitelesítetten kérj le egy érvényes hétfői dátumot, majd próbálj hiányzó, hibás, nem hétfői, jövőbeli és az 52 hetes tartományon kívüli dátumot. | Érvényes kérésnél a JSON tartalmazza a `current`, `previous` és `previousPrevious` csomópontot. Hibás vagy nem választható dátumnál az API `400` választ ad. | 2026-11-16: az érvényes kérés `200`, a három hét kezdődátuma `2026-10-12`, `2026-10-05`, `2026-09-28`; hiányzó, hibás, nem hétfői, lehetetlen, jövőbeli és 52 héten kívüli dátumra `400`. | **Sikeres** |
| M-09 | Edzésnapló mentése, újratöltés utáni visszaolvasása és kihagyás volumenre gyakorolt hatása. | A mentett sorozatok visszatöltődnek; a kihagyott gyakorlat látszik kihagyottként, és nem ad hozzá volument. | — | Függőben |
| M-10 | Ételkeresés, egy találat adagolása és étkezésként mentése. | A keresési eredmény kiválasztható; a grammérték alapján előnézeti tápérték készül, a mentett étel megjelenik a napi étkezésben és az összesítésben. | — | Függőben |
| M-11 | Új, nem minta AI-elemzés kérése külön tesztfiókkal. | Sikeres AI-válasznál az összefoglaló és minden javaslat magyar; a pontszám 1–10 közötti, az eredmény frissítés után is megnyitható. | — | Függőben |
| M-12 | AI-fallback ellenőrzése ideiglenesen érvénytelen OpenRouter-kulccsal, külön tesztfiókkal. | Az API `fallback` állapotot és szabályalapú magyar értékelést ad; az oldal ezt érthetően jelzi. Az eredeti kulcsfájl változatlan marad. | — | Függőben |
| M-13 | Új, hiányos profilú felhasználó onboardingjának végigpróbálása. | A védett oldal onboardingra irányít; a kötelező profiladatok mentése után a dashboard nyílik meg; újratöltéskor nincs visszairányítási hurok vagy ismétlődő RSC-kérés. | — | Függőben |
| M-14 | ThemeProvider és kosár hydration ellenőrzése friss betöltés és navigáció után. | Nincs React script/hydration hiba vagy `hasHydrated` runtime hiba; a kosár tartalma frissítés után megmarad. Vásárlást nem indítunk. | — | Függőben |

### Előkészület

1. Indítsd el a projektet a saját gépeden a `npm.cmd run dev` paranccsal, és hagyd nyitva a terminált. A böngésző címe `http://localhost:3000`.
2. Nyisd meg a fejlesztői eszközöket (`F12`), és készíts elő két lapot: **Console** és **Network**. A Network lapon kapcsold be a *Preserve log* opciót.
3. Az M-01–M-08 heti nézet/API esetekhez használd a már seedelt demo felhasználót. **Ne futtasd újra a demo seedet**, mert lecseréli a demo felhasználó tesztadatait.
4. Az M-09–M-14 mentést vagy elemzést végző esetekhez lehetőleg külön, eldobható tesztfiókot használj. Ezek adatot menthetnek a fiókba. M-09-hez használhatod a demo aktív tervét is, de csak a jelenlegi hét még üres napján, ne a seedelt történeti heteken. A Stripe Checkoutra egyik lépésben se kattints.
5. A `.env.local` tartalmát ne másold ide és ne készíts róla képernyőképet. M-12-nél kizárólag a leírt, átmeneti környezeti változót használd; a kulcsfájlt ne szerkeszd.

### Részletes lépések

#### M-01 — Három heti panel asztali nézetben

1. Jelentkezz be, nyisd meg a `/progress` oldalt, és állítsd a böngészőablakot legalább 1280 px szélesre, 100%-os nagyítással.
2. Várd meg, amíg a betöltésjelzés eltűnik. A `Heti áttekintés` résznél számold meg a kártyákat.
3. Ellenőrizd a címeket: `Kiválasztott hét`, `Előző hét`, `Két héttel korábbi`.
4. Mindhárom kártyán ellenőrizd az időszakot, edzést/volument, étkezési napokat és kalóriaadatot, fehérjeátlagot, testsúlyt és mérési darabszámot. Ha valamelyik adat hiányzik, jegyezd fel a megjelenő hiányjelzést.
5. Készíts képernyőképet úgy, hogy a dátumok és mindhárom kártya olvasható legyen; az account menü és személyes adatok ne látszódjanak. Javasolt fájlnév: `docs/thesis/figures/teszt-heti-attekintes-3-het.png`.

#### M-02 — Részleges és lezárt hetek

1. A hétválasztóban válaszd az `Aktuális hét` elemet.
2. Ellenőrizd, hogy a kiválasztott heti kártya a `Folyamatban · részleges hét` címkét mutatja, dátuma nem nyúlik a mai napnál későbbre, és az étkezési lefedettség nevezője az eltelt napok számát tükrözi.
3. Ugyanitt nézd meg a két korábbi kártyát: mindkettő `Lezárt hét` címkét kapjon.
4. Válassz egy korábbi teljes hetet a listából; mindhárom megjelenített hétnek lezártnak kell lennie. Jegyezd fel a kezdő- és záródátumokat.

#### M-03 — Hétválasztás, betöltés és hibaállapot

1. A Network lapon szűrj `weekly` kifejezésre, majd válassz ki egy korábbi hetet a legördülő listával.
2. Ellenőrizd, hogy a kérés `GET /api/progress/weekly?week_start=...`, státusza `200`, a hétválasztó dátuma és mindhárom kártya dátuma pedig az új hétre vált.
3. Nyomd meg az `Előző hét` gombot, majd a `Következő hét` gombot. Mindkét alkalommal egy héttel változzon a kiválasztás; az aktuális hétnél a következő hét gombja legyen tiltva.
4. A betöltés megfigyeléséhez a DevTools Network throttling menüjében válaszd a `Slow 3G` módot, és válts hetet. A `Heti adatok betöltése…` állapot jelenjen meg, majd az adatok frissüljenek. Ezután állítsd vissza a `No throttling` módot.
5. Opcionális hibaág: a Network menüben állítsd a kapcsolatot `Offline` módra, válts egy másik hétre, és ellenőrizd, hogy magyar hibaüzenet jelenik meg, a felület nem marad üres vagy végtelenül betöltő állapotban. Kapcsold vissza az online módot, és próbálj újra.

#### M-04 — Seedelt hetek egyeztetése a felületen

1. A hétválasztóval válaszd a `2026-10-12`-én kezdődő hetet.
2. A dátumok sorrendben `2026-10-12–18`, `2026-10-05–11`, `2026-09-28–10-04` legyenek.
3. Az első kártyán ellenőrizd: **3/4 edzés, 6/7 étkezési nap, 2150 kcal/nap, 14 400 kg volumen, 81,7 kg átlagos testsúly**.
4. A második kártyán ellenőrizd: **2/4 edzés, 4/7 étkezési nap, 2050 kcal/nap, 9000 kg volumen, 82,2 kg átlagos testsúly**.
5. Készíts képernyőképet a három panelről, majd hasonlítsd össze az első két kártyát a korábbi `docs/thesis/figures/heti-attekintes.png` képpel. A harmadik hét seed nélküli; ne írj oda kitalált adatot.

#### M-05 — Hiányzó étkezési, testsúly- és fehérjeadat

1. Maradj a `2026-10-12` kiválasztásánál, így a harmadik kártya a seed nélküli `2026-09-28` hetet mutatja.
2. Ellenőrizd, hogy az étkezési napok száma `0/7`, a kalóriaértéknél pedig hiányzó adat szerepel (`Nincs naplózott adat`), nem pedig `0 kcal/nap` átlag.
3. A fehérjeátlagnál `Nincs adat`, a testsúlynál `Nincs elég adat` vagy az aktuális megfelelő hiányjelzés jelenjen meg; egyiknél se jelenjen meg kitalált `0 g` vagy `0 kg` mérési átlag.
4. A naplózatlan napokra vonatkozó figyelmeztetést is ellenőrizd. Jegyezd fel, ha a seedelt demo harmadik heti adatai időközben megváltoztak.

#### M-06 — Mobil elrendezés

1. A `/progress` oldalon nyisd meg a DevTools eszköztárát (`Ctrl+Shift+M`).
2. Válassz 390 × 844 px, majd 360 × 800 px méretet, 100%-os nagyítással.
3. Ellenőrizd, hogy a három heti kártya egymás alatt jelenik meg, minden adat és hétválasztó elérhető, nincs vízszintes oldal-túlcsordulás, levágott kártya vagy egymásra csúszó szöveg.
4. Görgess végig az oldal érintett részén; készíts egy képernyőképet a mobil elrendezésről, például `docs/thesis/figures/teszt-heti-attekintes-mobil.png` néven.

#### M-09 — Edzésnapló mentése, visszatöltése és volumen

1. Lépj be egy tesztfiókba, amelynek van aktív terve legalább két gyakorlattal; a kiválasztott teszthéten ne legyen más rögzített edzés. Ha nincs ilyen tesztfiókod, a demo aktív tervét használd a jelenlegi héten egy még üres edzésnapon.
2. Nyisd meg a tervet, válassz egy edzésnapot, majd kattints az `Edzésnapló megnyitása` gombra. Az első gyakorlatnál a mínusz gombbal töröld a fölösleges sorokat, hogy egy széria maradjon; azon adj meg **10 ismétlést és 20 kg-ot**, majd kattints egyszer az `Extra széria` gombra, és az új sorba is írj **10 ismétlést és 20 kg-ot**. A többi gyakorlatot jelöld `Kihagyom` állapotúra.
3. Kattints az `Edzésnapló mentése` gombra. Várd meg a sikeres mentési visszajelzést, zárd be a naplót, frissítsd az oldalt, és nyisd meg újra ugyanezt a napot.
4. Ellenőrizd, hogy a 2 × (10 × 20 kg) érték visszatöltődött, a többi gyakorlat kihagyottként látszik, és ott a `Visszaveszem` gomb.
5. A heti áttekintésben ellenőrizd, hogy a naplózott volumen **400 kg**. A kihagyott gyakorlatok nem növelhetik ezt az értéket.
6. Eredményként rögzítsd a mentés utáni és újratöltés utáni állapotot, valamint a heti volumen értékét. Ne használd erre a seedelt demoheteket.

#### M-10 — Ételkeresés és étkezés mentése

1. Eldobható tesztfiókkal nyisd meg a `/calories` oldalt, válassz egy étkezést, és kattints az `Étel` gombra az ételkereső megnyitásához.
2. Az `Étel keresése` mezőbe írd be: `csirkemell`. Várd meg a keresési állapot végét, majd válassz egy találatot. Ha nincs találat, próbáld az `zabpehely` kifejezést, és jegyezd fel, melyik működött.
3. Az adag mezőjében hagyj **100 grammot**. Ellenőrizd az előnézeti kalória-, fehérje-, szénhidrát- és zsírértéket; 200 grammra váltva az értékeknek arányosan változniuk kell.
4. Kattints a `Hozzáadás` gombra. Ellenőrizd a sikeres visszajelzést, hogy az étel a megfelelő étkezés alatt megjelent, és a napi összesítő frissült.
5. Frissítsd az oldalt, és ellenőrizd, hogy a bejegyzés megmaradt. Ha a keresés `503`/elérhetetlenségi hibát jelez, jegyezd fel a státuszt és az időt; ne minősítsd automatikusan kódbugnak.

#### M-11 — AI-válasz magyar nyelve

1. Használj olyan külön tesztfiókot, amelyben erre a hétre még nincs elemzés. A végpont hetente egy elemzést enged; seedelt `sample` elemzés nem számít valódi AI-próbának.
2. Nyisd meg a `/progress` oldalt. A `Heti elemzés generálása` résznél kattints a `Generálás` gombra, és várd meg az overlay megjelenését.
3. Csak akkor jelöld sikeresnek az AI-nyelvi próbát, ha az AI-panel valódi AI-válaszként jelenik meg, nem fallbackként. Olvasd végig az összefoglalót, az összes javaslatot és a figyelmeztetést: mindegyik teljes egészében magyar legyen, idegen nyelvű mondatrész és idegen írásrendszer nélkül.
4. Ellenőrizd, hogy a pontszám 1–10 közötti, a szabályalapú panel is megjelenik, majd zárd be és nyisd meg újra az elemzést az előzményekből vagy frissítsd az oldalt. Rögzítsd az eredetet (valódi AI vagy minta/fallback), a dátumot és a képernyőképet.

#### M-12 — AI tartalék működése szolgáltatói hiba esetén

Ezt **külön tesztfiókkal** végezd, mert a fallback eredmény is elmentődik, és a fiók erre a hétre többé nem kérhet új elemzést.

1. Állítsd le a futó fejlesztői szervert (`Ctrl+C`). A projekt `.env.local` fájlját ne módosítsd.
2. PowerShellben mentsd el az esetleges korábbi környezeti értéket, és csak a tesztfolyamat idejére állíts be hibás kulcsot:

   ```powershell
   $previousOpenRouterKey = $env:OPENROUTER_API_KEY
   $env:OPENROUTER_API_KEY = 'invalid-test-key'
   try {
     npm.cmd run dev -- --port 3001
   } finally {
     if ($null -eq $previousOpenRouterKey) {
       Remove-Item Env:OPENROUTER_API_KEY -ErrorAction SilentlyContinue
     } else {
       $env:OPENROUTER_API_KEY = $previousOpenRouterKey
     }
   }
   ```

3. A másik tesztfiókkal nyisd meg a `http://localhost:3001/progress` oldalt, és kérj elemzést. A kérelemnek meg kell őriznie a szabályalapú eredményt akkor is, ha a szolgáltató elutasítja a kulcsot.
4. Ellenőrizd az `AI most nem elérhető`/fallback jelzést, a magyar szabályalapú összefoglalót és javaslatokat. A tesztfiók heti elemzéselőzménye tartalmazzon `fallback` állapotú rekordot. A terminál logjából csak a státuszt és hibaosztályt jegyezd fel, kulcsot vagy tokent ne.
5. Állítsd le a szervert `Ctrl+C`-vel, és ellenőrizd, hogy a PowerShell `finally` része visszaállította az eredeti környezeti változót. Nyiss új normál terminált, és ne hagyd beállítva az `invalid-test-key` értéket.

#### M-13 — Onboarding és ismétlődő kérések

1. Regisztrálj egy új, csak tesztre használt fiókot, majd jelentkezz be. A profilja még ne tartalmazza a nemet, testsúlyt, magasságot és célt.
2. A DevTools Network lapon kapcsold be a `Preserve log` opciót, szűrj `onboarding` vagy `?_rsc=` értékre, majd próbáld meg megnyitni a `/dashboard` oldalt.
3. Ellenőrizd, hogy a rendszer az `/onboarding` oldalra irányít, és a profilűrlap megjelenik. A kötelező négy mezőt töltsd ki a tesztfiókhoz tartozó tesztértékekkel, majd kattints a `Mentés és tovább` gombra.
4. Elvárt eredmény: sikeres mentési visszajelzés és átirányítás a `/dashboard` oldalra. Frissítés után maradj a dashboardon; a `/onboarding` közvetlen megnyitásakor a teljes profil miatt vissza kell irányítania a dashboardra.
5. A Network naplót figyeld legalább 10 másodpercig. Az oldalbetöltés után ne ismétlődjön folyamatosan ugyanaz az onboarding/RSC-kérés. Jegyezd fel az átirányításokat, kérésdarabszámot és minden konzolhibát.

#### M-14 — ThemeProvider és kosár hydration

1. Tesztfiókkal nyisd meg a `/shop` oldalt. A DevTools Console lapon töröld a korábbi üzeneteket, majd frissítsd az oldalt.
2. Várd meg, amíg az oldal betölt. Ellenőrizd, hogy a terméklista megjelenik, és a Console-ban nincs `hasHydrated` vagy React hydration/script runtime hiba.
3. Nyiss meg valamelyik terméket, kattints egyszer a `Kosárba` gombra, majd a fejléc kosár ikonjára. Ellenőrizd, hogy a kosár tartalma és darabszáma helyesen jelenik meg.
4. Frissítsd az oldalt, várd meg a kliensoldali betöltést, és nyisd meg újra a kosarat. Az elem maradjon meg; ne jelenjen meg `hasHydrated` vagy React hydration/script runtime hiba a konzolban.
5. Kapcsold át a témát a fejlécben, navigálj a dashboardra, majd vissza a shopra. Ellenőrizd a téma megmaradását és a Console lapot; ne legyen „Encountered a script tag while rendering React component” hiba.
6. A teszt végén távolítsd el a terméket a kosárból. **Ne kattints checkout/fizetés gombra.** Rögzítsd a konzolhibákat (vagy azt, hogy nem voltak), a kosár frissítés utáni állapotát és a böngészőt.

### Visszajelzés formátuma

Kérlek, minden azonosítóhoz ezt küldd vissza; egy rövid megfigyelés is elég:

```text
M-01: SIKERES / HIBÁS / NEM TUDTAM VÉGREHAJTANI
Tényleges eredmény:
Hibaüzenet vagy Network státusz:
Képernyőkép neve (ha készült):
```

Ne küldj jelszót, `.env.local` tartalmat, API-kulcsot vagy tokent. A visszajelzésed alapján kitöltöm az eredménymezőket, javítás esetén újratesztelést rögzítek, majd a teljes módosítást commit előtt még egyszer átnézzük.

## 5. Korlátok és nyitott ellenőrzések

- A sikeres build és unit teszt nem bizonyítja a Supabase-adatokkal végzett teljes böngészős folyamatot.
- A külső AI-szolgáltatás tényleges válaszának nyelvi ellenőrzése és tartalmi megfelelősége külön, működő OpenRouter-konfigurációval végzendő el.
- Az M-01–M-06 háromhetes nézet, mobilnézet és hétválasztó kézi próbái sikerültek; az M-09–M-14 funkcionális próbák még hátravannak. Az API hitelesített lekérése, a seedelt mutatók és a dátumvalidációs határesetek ellenőrzése szintén sikerült.
- A dolgozat mérési fejezetébe csak a fenti kézi tesztek elvégzése után kerülhet tényleges eredmény vagy képernyőkép.
