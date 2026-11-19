# Integrációs tesztterv és jegyzőkönyv

**Projekt:** FitTrack Pro
**Utoljára frissítve:** 2026. november 17.
**Vizsgált munkaváltozat:** `2223e60` utáni helyi munkafa; Next.js 16.4.6, a függőségi sérülékenységek javítása és a DnD hidratációs javítása is szerepel benne.
**Státusz:** a tiszta `npm ci`, lint, TypeScript, 18/18 unit teszt és production build sikeres; az `npm audit` 0 sérülékenységet jelentett. A Supabase API-integráció és az M-01–M-08 sikeresek. M-09 részben igazolt; a duplikált gyakorlat elleni kódvédelem elkészült, a kihagyás volumenből való kizárását mérni kell. A megosztott képernyőkép `aria-describedby` szerver/kliens eltérést mutatott a drag-and-drop felületen; a DnD-leíró azonosítója stabil lett, de böngészős regressziópróba szükséges. M-10 és M-15–M-16 felhasználói visszajelzés szerint sikeres. M-12 fallback felülete képernyőképen megjelent, de a mentett előzmény igazolása még hiányzik. M-13-ból csak az ismétlődő kérés hiánya igazolt. M-11 valódi AI-válasza még nincs igazolva. M-14 a termékkatalógus üressége miatt nem volt teljesen tesztelhető; a termék-seed futtatása után újra kell próbálni.

## 1. Cél és hatókör

Ez a dokumentum a heti mutatók számításának, az AI-válasz nyelvi ellenőrzésének és a fejlődésoldal háromhetes összehasonlító nézetének ellenőrzéseit rögzíti. A tesztek lefedik a determinisztikus heti összesítést, a terven felüli edzések kezelését, az angol válaszok szűrését, valamint a három heti panel szerveroldali HTML-megjelenítését.

Az automatizált renderelési teszt mintaadatokkal ellenőrzi a kártyát. A hitelesített Supabase API-próba eredményeit az A-05 és A-06 sorok rögzítik; ezek nem helyettesítik a böngészős vizuális vagy külső felhasználói tesztet. A felhasználó képernyőképeket osztott meg a böngészős és mobilnézetről; a még hátralévő javítás utáni ellenőrzés bizonyítéka később rögzítendő.

## 2. Környezet és futtatás

| Elem | Érték |
|---|---|
| Operációs rendszer | Windows, PowerShell |
| Node.js | v24.11.1 |
| Next.js build | 16.4.6 (Turbopack) |
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
| A-01 | `npm test` | Nyelvi validáció, szabályalapú összefoglaló, heti mutatók, háromhetes kártya és edzésnapi duplikátum-felismerés | **SIKERES: 18/18** |
| A-02 | `npm run lint` | ESLint a projekt forrásán | **SIKERES: nincs hiba** |
| A-03 | `npm exec tsc -- --noEmit` | TypeScript típusellenőrzés | **SIKERES** |
| A-04 | `npm run build` | Optimalizált Next.js production build és route-generálás | **SIKERES Next.js 16.4.6-on; a korábbi Next.js biztonsági figyelmeztetés nem jelent meg** |
| A-05 | Hitelesített `GET /progress` demo felhasználóval | Production SSR oldal státusza, három heti panel és címkék | **SIKERES: HTTP 200; 3 panel; mindhárom hétcímke és a részleges hét jelölése megjelenik** |
| A-06 | Hitelesített `GET /api/progress/weekly` és hibás dátumok | Három heti adatcsomag, seedelt mutatók, bemeneti dátumvalidáció | **SIKERES: HTTP 200; három dátumcsomag és seedértékek egyeznek; 6 hibás eset HTTP 400** |
| A-07 | `npm audit` | A függőségi fa ismert sérülékenységeinek ellenőrzése | **SIKERES: 0 sérülékenység** |

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
| M-09 | Edzésnapló mentése, újratöltés utáni visszaolvasása és kihagyás volumenre gyakorolt hatása. | A mentett sorozatok visszatöltődnek; a kihagyott gyakorlat látszik kihagyottként, és nem ad hozzá volument. A tervszerkesztő drag-and-drop elemei hidratációs figyelmeztetés nélkül jelennek meg. | 2026-11-17: a felhasználó tetszőleges tesztértékeket adott meg; a sorozatok a kihagyásokkal együtt mentődtek. A volumen-kizárás továbbra sincs konkrét eredménnyel igazolva. A korábbi képen ismétlődő React-kulcs figyelmeztetés látszott; a kód elutasítja az újabb duplikált hozzáadást, a felhasználó jelezte, hogy utána működött. Az új képernyőképen a DnD-kit számlálóalapú `aria-describedby` azonosítói eltértek szerver- és kliensrenderelés között. A `DndContext` most stabil `id` értéket kap; a böngészős hidratációs próba még szükséges. | **Részben igazolt; volumen és hidratációs regresszióteszt nyitott** |
| M-10 | Ételkeresés, egy találat adagolása és étkezésként mentése. | A keresési eredmény kiválasztható; a grammérték alapján előnézeti tápérték készül, a mentett étel megjelenik a napi étkezésben és az összesítésben, majd frissítés után is megmarad. | 2026-11-17: a felhasználó visszajelzése szerint a folyamat rendeltetésszerűen működik, és az adatok megmaradtak. Részletes számérték vagy képernyőkép nem érkezett. | **Sikeres – felhasználói visszajelzés** |
| M-11 | Új, nem minta AI-elemzés kérése külön tesztfiókkal. | Sikeres AI-válasznál az összefoglaló és minden javaslat magyar; a pontszám 1–10 közötti, az eredmény frissítés után is megnyitható. | 2026-11-17: a beszélgetésben látható képen az AI szolgáltatás nem adott értékelést, és a szabályalapú eredmény jelent meg. Ez a fallback megjelenését támasztja alá, nem valódi AI-választ. A javítás utáni élő AI-válasz nyelvi ellenőrzése és előzményből visszaolvasása még szükséges. | **Függőben – valódi AI-válasz nem igazolt** |
| M-12 | AI-fallback ellenőrzése ideiglenesen érvénytelen OpenRouter-kulccsal vagy reprodukálható szolgáltatói hibával, külön tesztfiókkal. | Az API `fallback` állapotot és szabályalapú magyar értékelést ad; az oldal ezt érthetően jelzi, és az eredmény az előzményekből visszaolvasható. Az eredeti kulcsfájl változatlan marad. | 2026-11-17: a megosztott képernyőképen megjelenik a szabályalapú 3/10 értékelés és az „AI szolgáltatás nem adott értékelést” jelzés. Ez a felületi fallback-állapotot igazolja. A tartós előzményből visszaolvasás és a tesztkörnyezet visszaállításának ténye nincs külön rögzítve. A kép a beszélgetésben található; még nincs a repository `figures` könyvtárába mentve. | **Részben igazolt – felületi fallback sikeres** |
| M-13 | Új, hiányos profilú felhasználó onboardingjának végigpróbálása. | A védett oldal onboardingra irányít; a kötelező profiladatok mentése után a dashboard nyílik meg; újratöltéskor nincs visszairányítási hurok vagy ismétlődő RSC-kérés. | 2026-11-17: új fiók regisztrációjakor a felhasználó nem találkozott ismétlődő kérésekkel. A kötelező mezők kitöltése, dashboardra átirányítás és közvetlen onboarding-útvonal újratöltés utáni ellenőrzése nincs külön megerősítve. | **Részben igazolt – kérésismétlődés nem jelentkezett** |
| M-14 | Shop katalógus és kosár alapműveletei; hibamentes kliensoldali betöltés és hydration. | Termékek megjelennek, szűrhetők/megnyithatók, kosárba tehetők és eltávolíthatók; a kosár oldalváltás és frissítés után is helyesen töltődik vissza. Vásárlást nem indítunk. | 2026-11-17: a felhasználó a terméktábla üressége miatt nem tudta ellenőrizni a katalógust és a kosár műveleteit. A korábban jelzett React `script` és `hasHydrated` hibák eltűnéséről korábbi visszajelzés érkezett. A repository tartalmaz `npm run seed:products` szkriptet; teszt Supabase projekten futtatva feltölti a minta katalógust, utána az M-14 kosárfolyam újraellenőrizhető. | **Nem teljes – minta termékek seedelése után tesztelendő** |
| M-15 | Testsúlymérés létrehozása és visszaolvasása külön tesztfiókban. | A mérés mentés után újratöltést követően is megmarad; a kiválasztott heti panelen a mérési darabszám és az átlag megfelel a tesztadattal számított értéknek. | 2026-11-17: a felhasználó visszajelzése szerint a testsúlytrendek működnek. Pontos tesztdátum/érték, mérési darabszám és képernyőkép nem érkezett. | **Sikeres – felhasználói visszajelzés; részletes adat nincs** |
| M-16 | Edzésterv létrehozása vagy szerkesztése, majd visszaolvasása külön tesztfiókban. | A mentett terv neve, edzésnapja és hozzáadott gyakorlata navigáció és frissítés után is megjelenik. | 2026-11-17: a felhasználó megerősítette, hogy a mentett adatok megmaradtak. Részletes tervadat vagy képernyőkép nem érkezett. | **Sikeres – felhasználói visszajelzés** |

### Előkészület

1. Indítsd el a projektet a saját gépeden a `npm.cmd run dev` paranccsal, és hagyd nyitva a terminált. A böngésző címe `http://localhost:3000`.
2. Nyisd meg a fejlesztői eszközöket (`F12`), és készíts elő két lapot: **Console** és **Network**. A Network lapon kapcsold be a *Preserve log* opciót.
3. Az M-01–M-08 heti nézet/API esetekhez használd a már seedelt demo felhasználót. **Ne futtasd újra a demo seedet**, mert lecseréli a demo felhasználó tesztadatait.
4. Az M-09–M-16 mentést vagy elemzést végző esetek megismétléséhez lehetőleg külön, eldobható tesztfiókot használj. Ezek adatot menthetnek a fiókba. M-09-hez használhatod a demo aktív tervét is, de csak a jelenlegi hét még üres napján, ne a seedelt történeti heteken. M-15-höz és M-16-hoz használj elkülönített fiókot, hogy a mérés vagy terv ne módosítsa a demo összehasonlító adatait. A Stripe Checkoutra egyik lépésben se kattints.
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

1. Lépj be egy tesztfiókba, amelynek van aktív terve legalább két különböző gyakorlattal; a kiválasztott teszthéten ne legyen más rögzített edzés. Ha ugyanaz a gyakorlat többször szerepel egy napon, távolítsd el a fölösleges tervsort, mert a napló adatmodellje gyakorlatonként egy bejegyzést tárol. Ha nincs megfelelő tesztfiókod, a demo aktív tervét használd a jelenlegi héten egy még üres edzésnapon.
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

#### M-14 — Shop katalógus, kosár és hibamentes hydration

1. Ellenőrizd, hogy a `.env.local` a teszt Supabase projektet célozza. A projekt gyökeréből futtasd a `npm run seed:products` parancsot. Ez a `products` táblába körülbelül 22–24 minta-kiegészítőt ír; ne éles vagy olyan adatbázison futtasd, amelynek termékadatait meg kell őrizni.
2. Tesztfiókkal nyisd meg a `/shop` oldalt. A DevTools Console lapon töröld a korábbi üzeneteket, majd frissítsd az oldalt.
3. Várd meg, amíg az oldal betölt. Ellenőrizd, hogy a terméklista megjelenik, és a Console-ban nincs `hasHydrated` vagy React hydration/script runtime hiba.
4. Nyiss meg valamelyik terméket, kattints egyszer a `Kosárba` gombra, majd a fejléc kosár ikonjára. Ellenőrizd, hogy a kosár tartalma és darabszáma helyesen jelenik meg.
5. Frissítsd az oldalt, várd meg a kliensoldali betöltést, és nyisd meg újra a kosarat. Az elem maradjon meg; ne jelenjen meg `hasHydrated` vagy React hydration/script runtime hiba a konzolban.
6. Kapcsold át a témát a fejlécben, navigálj a dashboardra, majd vissza a shopra. Ellenőrizd a téma megmaradását és a Console lapot; ne legyen „Encountered a script tag while rendering React component” hiba.
7. A teszt végén távolítsd el a terméket a kosárból. **Ne kattints checkout/fizetés gombra.** Rögzítsd a konzolhibákat (vagy azt, hogy nem voltak), a kosár frissítés utáni állapotát és a böngészőt.

#### M-15 — Testsúlymérés mentése és heti visszaolvasása

1. Jelentkezz be külön tesztfiókkal, amelyben nincs testsúlymérés a mostani héten, majd nyisd meg a `Fejlődés` oldalt.
2. A testsúly rögzítő űrlapon válaszd ki a mai dátumot, és adj meg egy egyértelmű, tesztadatnak szánt értéket (például 73,4 kg). Jegyezd fel, milyen értéket írtál be.
3. Mentsd el a mérést, és várd meg a sikeres felületi visszajelzést. Ellenőrizd, hogy a kiválasztott hét paneljén a mérési darabszám 1, az átlag pedig a beírt érték.
4. Frissítsd az oldalt. A mérésnek továbbra is meg kell jelennie; az érték és a darabszám ne változzon.
5. Rögzítsd a dátumot, a beírt értéket, a heti panel kijelzését, a frissítés utáni állapotot és az esetleges hibát. Ne használj valódi egészségügyi vagy más személyes adatot.

#### M-16 — Edzésterv létrehozása/szerkesztése és visszaolvasása

1. Jelentkezz be külön, eldobható tesztfiókkal, és az alkalmazás `Edzés` menüjéből nyisd meg a tervszerkesztőt.
2. Hozz létre teszttervet egy egyértelmű névvel, adj hozzá legalább egy edzésnapot és egy katalógusból választott gyakorlatot, majd mentsd el. Ha a fiókban már van aktív terv, az eredeti tervet ne módosítsd; az esetet új tesztfiókkal végezd.
3. Navigálj el a tervoldalról, majd nyisd meg újra. Ellenőrizd a terv nevét, az edzésnapot és a gyakorlatot.
4. Frissítsd az oldalt, és ellenőrizd újra az adatokat. Ha a szerkesztés módosításokat is tesztel, változtass meg egy gyakorlatot vagy tervnevet, mentsd el, majd nyisd meg ismét.
5. Jegyezd fel, hogy melyik mentési művelet sikerült, visszatöltődött-e minden adat, és jelent-e meg hiba. A teszt után a tesztfiók vagy a tesztterv külön takarítható.

### Visszajelzés formátuma

Kérlek, minden tesztelt azonosítóhoz ezt küldd vissza; egy rövid megfigyelés is elég:

```text
M-01: SIKERES / RÉSZBEN SIKERES / HIBÁS / NEM TUDTAM VÉGREHAJTANI
Tényleges eredmény:
Hibaüzenet vagy Network státusz:
Képernyőkép neve (ha készült):
```

Ne küldj jelszót, `.env.local` tartalmat, API-kulcsot vagy tokent. A visszajelzésed alapján kitöltöm az eredménymezőket, javítás esetén újratesztelést rögzítek, majd a teljes módosítást commit előtt még egyszer átnézzük.

## 5. Korlátok és nyitott ellenőrzések

- A sikeres build és unit teszt nem bizonyítja a Supabase-adatokkal végzett teljes böngészős folyamatot.
- A külső AI-szolgáltatás tényleges válaszának nyelvi ellenőrzése és tartalmi megfelelősége külön, működő OpenRouter-konfigurációval végzendő el.
- Az M-01–M-08 ellenőrzések sikerültek. M-10, M-15 és M-16 sikeres felhasználói visszajelzést kapott. M-09 részleges, mert a kihagyás volumenből kizárását nem rögzítették; az edzésterv duplikált gyakorlata ellen új UI/szervervédelem és regressziós unit teszt készült, de böngészőben még vissza kell ellenőrizni. M-12 fallback felülete képernyőképen megjelent, de az előzményből visszaolvasása nyitott. M-13-nál az ismétlődő kérés nem jelentkezett, a teljes onboarding sikerútja még nem igazolt. M-11 valódi AI-válasza nincs megerősítve. M-14-et az üres termékkatalógus blokkolja; a `npm run seed:products` futtatása után újra kell próbálni. Az API hitelesített lekérése, a seedelt mutatók és a dátumvalidációs határesetek ellenőrzése sikerült.
- A dolgozat mérési fejezetébe csak a fenti kézi tesztek elvégzése után kerülhet tényleges eredmény vagy képernyőkép.

## Részletes végrehajtási útmutató

A tesztsorrend, a konkrét képtartalom, az AI-összehasonlítás, a kétfiókos védelem, az UAT és a tiszta telepítés lépései: [Tesztelés és képernyőképek](TESZTELES_ES_KEPERNYOKEPEK_UTMUTATO.md). Az útmutató létrehozása nem változtatja meg a nyitott tesztek eredményét.

## 2026-11-19 ? ?j k?perny?k?pes bizony?t?kok

A besz?lget?sben kapott k?pek alapj?n M-09 konkr?t volumenpr?b?j?n a k?t 10?20 kg-os sorozat mellett 400 kg heti volumen l?that?, a m?sik gyakorlat kihagyott. M-10-ben a 100 g/169 kcal ?s 200 g/338 kcal el?n?zet, valamint a mentett 200 grammos reggeli is l?tszik; a makr?k is ar?nyosak. Az ?jrat?lt?s v?grehajt?s?t a k?pek ?nmagukban nem igazolj?k. A hidrat?ci?s regresszi? ?s M-13 teljes onboardingja tov?bbra is nyitott. A heti 1/0 edz?sar?ny ?s az akt?v terv ?sszef?gg?se k?l?n vizsg?land?. A pontos k?plelt?r ?s bizony?t?kkorl?tok: [be?rkez?si jegyz?k](KEPERNYOKEPEK_BEERKEZES_2026-11-19.md). A k?pf?jlok helyi ?tv?tele m?g h?travan.


## 2026-11-19 ? Friss?t?s ut?ni bizony?t?kok ?s h?tk?znap-sz?m?t?s

A felhaszn?l? meger?s?tette, hogy minden bek?ld?tt k?p oldalfriss?t?s ut?n k?sz?lt. Ez a l?that? tesztterv, a k?t 10?20 kg-os sorozat ?s a kihagy?s visszat?lt?s?t, valamint a 200 grammos ?tkez?s tart?ss?g?t is al?t?masztja. A heti volumen 400 kg, az adagol?s 100 g/169 kcal ? 200 g/338 kcal. M-09 volumen- ?s ment?si r?szpr?b?ja igazolt; a k?l?n DnD/duplik?ci? regresszi?s m?veletsor e k?pekb?l nem igazolhat?. M-10 ?s M-16 ?jrat?lt?s ut?ni ?llapota felhaszn?l?i meger?s?t?ssel al?t?masztott. A k?pek helyi bin?ris f?jljainak ?tv?tele m?g sz?ks?ges.

Az 1/0 edz?sar?ny oka a forr?sk?dban azonos?tott napk?d-elt?r?s: a projektben h?tf?=0, vas?rnap=6, m?g Date.getDay() vas?rnap=0 ?rt?ket ad. A heti sz?ml?l? eddig k?zvetlen?l hasonl?totta a k?t ?rt?ket. Jav?t?s: (getDay()+6)%7; a bej?r?s kezd? ?s v?gd?tuma napt?ri napra normaliz?lt, ?gy a d?lben indul? lek?rdez?s sem hagyja ki a z?r?napot. N?gy ?j regresszi?s eset k?sz?lt; 22/22 teszt sikeres, TypeScript ?s az ?rintett f?jlok lintellen?rz?se sikeres. A sandbox felhaszn?l?lek?rdez?si hib?ja miatt a teszt norm?l jogosults?ggal futott. Az akt?v h?tf?i tervvel a november 16?19-i panel elv?rt ar?nya 1/1; a jav?t?s ut?ni b?ng?sz?s k?p m?g sz?ks?ges. A kor?bban mentett AI-snapshotok nem sz?mol?dnak ?jra automatikusan.

Az onboarding URL-je /onboarding, c?me ?Miel?tt induln?l.?, gombja ?Ment?s ?s tov?bb?. Teljes profil? fi?kot a rendszer a Dashboardra ir?ny?t; a pr?ba ?j, hi?nyos profil? tesztfi?kkal v?gezhet?.


## 2026-11-19 ? Jav?tott heti n?zet, mobil ?s ?l? AI

A felhaszn?l? iPhone 16 be?ll?t?ssal, 393?852 CSS-pixeles n?zetben k?sz?tette a mobilk?pet. Ez b?ng?sz?s eszk?zbe?ll?t?sra vonatkoz? k?zl?s, nem bizony?t fizikai iPhone/Safari tesztet. A mobilk?p ?s az ut?na bek?ld?tt asztali k?p 1/1 edz?st, 400 kg volument, 1/4 ?tkez?si napot, 338 kcal ?tlagot, 48 g feh?rj?t ?s egy 73,4 kg-os m?r?st mutat. A h?tk?znap-k?d jav?t?s?nak b?ng?sz?s visszaellen?rz?se sikeres. A dolgozatban a kor?bbi 1/0 ?llapot helyett ezt az asztali k?pet kell haszn?lni (`teszt-volumen-400.png`); a kor?bbi k?p csak hibajav?t?si el?zm?nyk?nt ?rtelmezhet?. A bin?ris k?pf?jlok m?g nem hozz?f?rhet?k helyben, ez?rt t?nyleges f?jlcser?t nem ?ll?tunk.

M-15 konkr?t m?r?si bizony?t?ka: 2026-11-19, 73,4 kg, 1 m?r?s; a grafikon ?s heti panel is mutatja. A kor?bbi felhaszn?l?i k?zl?s szerint a k?pek friss?t?s ut?n k?sz?lnek. M-06 mobilk?pe olvashat?, az els? k?rtya nem csordul t?l; a teljes oldal v?gigg?rget?s?t ez az egy k?p nem helyettes?ti. A k?l?n dem?k?pen a h?rom t?rt?neti h?t ?s a 3/4, 14 400 kg, 6/7 nap, 2150 kcal, 81,7 kg, illetve 2/4, 9000 kg, 4/7 nap, 2050 kcal, 82,2 kg ?rt?kek l?tszanak.

M-11 ?j bizony?t?k: a november 16?19-i elemz?s k?l?n szab?lyalap? (5/10) ?s AI (6/10) panelt mutat; az AI sz?vege a k?pen magyar. A bemenet azonban m?sik eset: 2/2 edz?s, 2000 kg, 315 kcal, 20 g feh?rje, tests?lyadat n?lk?l. Ezt nem hasonl?tjuk a 400 kg/73,4 kg teszth?thez. Modellazonos?t?, mentett snapshot ?s az el?zm?nyb?l megnyit?s meger?s?t?se sz?ks?ges a teljes ?sszehasonl?t? m?r?shez. A k?pen az AI azt mondja, nincs tests?lyadat; a szab?lysz?veg csak annyit ?ll?t, hogy nincs legal?bb k?t m?r?s. A pontos snapshot alapj?n kell eld?nteni, hogy ez az er?sebb ?ll?t?s helyes-e. Az AI-panel ett?l f?ggetlen?l val?di AI-megjelen?st igazol, ez?rt a r?gebbi ?csak fallback l?that?? ?sszegz?s t?rt?neti ?llapot.

## Term?kkatal?gus seed jav?t?sa

A products.name nem UNIQUE, ez?rt az ON CONFLICT(name) 42P10 hib?t okozott. A seed most a megl?v? nevekhez tartoz? ID-kat meg?rzi, ?j mintaterm?khez determinisztikus UUID-t k?pez, ?s az els?dleges kulcson upsertel. T?bb azonos nev? megl?v? rekordn?l ?r?s el?tt meg?ll. A hib?s fut?s process.exit(1) h?v?sa helyett process.exitCode=1 szerepel, hogy a Node befejezhesse a f?gg? m?veleteket. Az UV_HANDLE_CLOSING hiba megsz?n?s?t k?l?n hib?s ?tvonalon nem tesztelt?k.

Ellen?rz?s: h?rom c?lzott teszt sikeres (stabil ID-k, megl?v? ID meg?rz?se, duplik?lt n?v elutas?t?sa); TypeScript sikeres. A jav?tott `npm run seed:products` az aktu?lis projektkonfigur?ci?val sikeresen lefutott: 24 term?k (6 protein, 4 kreatin, 5 vitamin, 5 aminosav, 4 egy?b). M-14 term?khi?nyos akad?lya elh?rult, a kos?r b?ng?sz?s pr?b?ja m?g h?travan.
