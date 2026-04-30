# FitTrack Pro — Frontend Projekt Backlog

## Design Döntések Összefoglalója

| Döntés | Választás |
|---|---|
| **Téma** | Dark / Light mode toggle-lel |
| **Vizuális stílus** | SpaceX-inspirált sötét, ipari-minimalista (kevés dekoráció, cinematikus hangulatú felületek) |
| **Fő színek** | `#111111` (háttér), `#780000` (sötétvörös akcent), `#404040` (szürke felületek) |
| **Szöveg szín** | Dark: `#e0e0e0` (világos szürke) / Light: `#1a1a1a` (közel fekete) |
| **Tipográfia** | Barlow Condensed (display/heading, uppercase, letter-spacing) + Barlow (body) — Google Fonts |
| **Ikonok** | Lucide React |
| **Navigáció** | Felső navbar (desktop) + alsó tab bar (mobil) |
| **Prioritás** | Desktop first, de responsive |
| **Dashboard** | Widgetes/kártyás grid |
| **Edzéstervező** | Egyoldalas: felül gyakorlatok, alá húzzuk az edzésnapba |
| **Edzéstervező (mobil)** | Egyszerűsített: gombos hozzáadás, nem drag & drop |
| **Kalóriakövetés** | Keresőmező + találati lista + kattintásra hozzáadás |
| **AI elemzés** | Teljes képernyős modal/overlay a dashboardról |
| **Webshop** | Termékkártyás grid (2-3 oszlop) |
| **Onboarding** | Egyetlen hosszú form, inline validációval |
| **Landing page** | Wow-hatás (parallax, animációk) — utolsó előtti iteráció |
| **Gombok** | Ghost stílus: félig átlátszó háttér + spectral szegély (SpaceX-inspirált) |
| **Kártyák** | Sötét szürke (`#1a1a1a`) üveghatással, enyhe szegély, nincs shadow (dark) / fehér + enyhe shadow (light) |

---

## Backlog Progress

| Metric | Value |
|---|---|
| Total tasks | 77 |
| Completed tasks | 0 |
| Remaining tasks | 77 |
| Completion | 0% |

---

## Iterations

---

### Iteration F1 — Design System & Layout Shell

**Status:** TODO

**Goal:** A teljes alkalmazás vizuális alapjainak lerakása: színrendszer, tipográfia, dark/light mode, navbar, layout wrapper. Amíg ez nincs meg, semmilyen más oldalt nem érdemes építeni, mert utólag refaktorálni fájdalmas.

**Tasks:**

- [ ] F1.1 Tailwind CSS konfigurálás — egyedi színpaletta definiálása a `tailwind.config.ts`-ben + shadcn/ui CSS változók a `globals.css`-ben:
  ```
  Fő háttérszín (dark): #111111 (HSL: 0 0% 6.7%)
  Másodlagos háttér (dark): #1a1a1a
  Felületi szín / kártyák (dark): #1a1a1a / rgba(64,64,64,0.3) (üveghatás)
  Felületi szín / kártyák (light): white + enyhe shadow
  Háttérszín (light): #f5f5f5, #ffffff
  Elsődleges akcentszín: #780000 (HSL: 0 100% 23.5%) — CTA-k, aktív állapotok, kiemelések
  Szürke felületek: #404040 (HSL: 0 0% 25.1%) — szegélyek, másodlagos gombok, badge-ek
  Szöveg (dark): #e0e0e0 (fő), #a0a0a0 (másodlagos)
  Szöveg (light): #1a1a1a (fő), #555555 (másodlagos)
  Ghost gomb háttér: rgba(120, 0, 0, 0.1) — sötétvörös, 10% opacity
  Ghost gomb szegély: rgba(120, 0, 0, 0.35) — sötétvörös, 35% opacity
  Siker: emerald-500 | Figyelmeztetés: amber-500 | Hiba: red-500

  shadcn/ui CSS változók (globals.css):
  --background: 0 0% 6.7% (dark) / 0 0% 100% (light)
  --foreground: 0 0% 88% (dark) / 0 0% 10% (light)
  --primary: 0 100% 23.5%
  --primary-foreground: 0 0% 88%
  --card: 0 0% 10% (dark) / 0 0% 100% (light)
  --muted: 0 0% 25.1% (dark) / 0 0% 96% (light)
  --border: 0 0% 20% (dark) / 0 0% 90% (light)
  --ring: 0 100% 23.5%
  ```
- [ ] F1.2 Dark/Light mode implementálása: `next-themes` csomag integrálása, `ThemeProvider` wrapper, toggle gomb a navbarban (nap/hold ikon). A rendszer felismeri az OS beállítást, de felülírható.
- [ ] F1.3 Tipográfia beállítása: **Barlow Condensed** (display/heading — Bold/ExtraBold, uppercase, letter-spacing: 0.96–1.17px) + **Barlow** (body — Regular/Medium, normál eset, jó olvashatóság). Mindkettő Google Fonts, `next/font/google` betöltés optimalizálással. A Barlow család a DIN ipari stílus legközelebbi Google Fonts megfelelője — geometrikus, mérnöki karakter, tökéletes a sötét ipari esztétikához.
- [ ] F1.4 shadcn/ui telepítése és konfigurálása: alap komponensek (Button, Card, Input, Dialog, Sheet, Tabs, Badge, Tooltip, Skeleton, Toast) telepítése és a téma színekhez igazítása. A `globals.css`-ben a CSS változók beállítása dark/light módra.
- [ ] F1.5 Layout shell: `(protected)/layout.tsx` létrehozása:
  - Desktop: felső navbar (logo + navigációs linkek + profil avatar + theme toggle + kijelentkezés)
  - Mobil: felső sáv (logo + hamburger/profil) + alsó tab bar (Dashboard, Edzés, Kalória, Shop, Fejlődés — 5 Lucide React ikon+label, pl. `LayoutDashboard`, `Dumbbell`, `Flame`, `ShoppingBag`, `TrendingUp`)
  - A content area a navbar alatt renderelődik, max-width konténerrel
- [ ] F1.6 Navbar komponens implementálása: aktív oldal jelölése (sötétvörös `#780000` underline/highlight), user avatar a jobb felső sarokban, smooth hover animációk, uppercase Barlow Condensed nav linkek letter-spacing-gel
- [ ] F1.7 Mobil alsó tab bar: fix pozíció, 5 tab (Lucide React ikonokkal), aktív tab ikon+szín kiemelés (`#780000`), safe area kezelés (iPhone notch)
- [ ] F1.8 Alap animációs rendszer: Framer Motion telepítése, page transition wrapper (fade/slide in), reusable animációs variánsok definiálása (fadeIn, slideUp, staggerChildren)
- [ ] F1.9 Globális loading és error komponensek: `loading.tsx` skeleton layout, `error.tsx` error boundary stílusozott hibaüzenettel, `not-found.tsx` 404 oldal

**Acceptance Criteria:**

- A dark/light toggle működik és az OS beállítást is figyelembe veszi
- A színpaletta konzisztensen jelenik meg mindkét módban
- A navbar desktopra és mobilra is renderelődik, aktív oldal jelöléssel
- A mobil tab bar fix pozícióban, nem takarja el a tartalmat
- Skeleton loading megjelenik oldalváltáskor
- Minden shadcn/ui komponens a megfelelő téma színeket használja

**Dependencies:** Backend Iteration 1 (projekt bootstrap)

---

### Iteration F2 — Auth Oldalak (Login & Regisztráció)

**Status:** TODO

**Goal:** A bejelentkezési és regisztrációs oldalak UI-ja, a Supabase Auth-hoz csatlakoztatva. Ezek az első oldalak, amiket az új felhasználó lát — az első benyomás számít.

**Tasks:**

- [ ] F2.1 Auth layout (`(auth)/layout.tsx`): osztott képernyős elrendezés desktopra — bal oldalon a form, jobb oldalon egy dekoratív panel (gradiens háttér, motivációs idézet vagy app mockup). Mobilon csak a form jelenik meg.
- [ ] F2.2 Login oldal: email + jelszó input (shadcn/ui Input), „Bejelentkezés" gomb (sötétvörös `#780000`), „Nincs fiókod? Regisztrálj" link, hibaüzenet megjelenítés (toast vagy inline)
- [ ] F2.3 Regisztrációs oldal: email + jelszó + jelszó megerősítés inputok, jelszó erősség indikátor (vizuális sáv), „Regisztráció" gomb, „Van fiókod? Jelentkezz be" link
- [ ] F2.4 Form validáció: Zod séma + React Hook Form (vagy natív form validáció), valós idejű hibaüzenetek magyarul, submit gomb disabled állapot amíg érvénytelen
- [ ] F2.5 Loading állapotok: submit gomb spinner/loading animációval, disabled input mezők küldés közben
- [ ] F2.6 Supabase Auth csatlakoztatás: `signUp`, `signIn` hívások a form submit-ra, sikeres login → redirect `/dashboard`, sikeres regisztráció → redirect `/onboarding`
- [ ] F2.7 Auth guard (middleware csatlakoztatás): a protected oldalak redirect-elnek `/login`-ra ha nincs session; `/login` és `/register` redirect-elnek `/dashboard`-ra ha van session

**Acceptance Criteria:**

- Login és regisztráció működik Supabase-szel
- A validáció valós időben mutatja a hibákat
- Sikeres login a dashboardra navigál
- Sikeres regisztráció az onboarding-ra navigál
- Rossz jelszó/email esetén értelmes magyar hibaüzenet jelenik meg
- A design konzisztens a dark/light módban
- A layout responsiven jelenik meg (mobil: form only, desktop: split screen)

**Dependencies:** Backend Iteration 4 (Auth)

---

### Iteration F3 — Onboarding & Profil Oldal

**Status:** TODO

**Goal:** A regisztráció utáni profil kitöltő form és a későbbi profil szerkesztő oldal.

**Tasks:**

- [ ] F3.1 Onboarding oldal (`/onboarding`): egyetlen scrollozható form az alábbi mezőkkel:
  - Név (text input)
  - Nem (select/radio group: férfi, nő)
  - Életkor (number input vagy dátum picker)
  - Testsúly kg-ban (number input, 0.1 lépésköz)
  - Magasság cm-ben (number input)
  - Cél (select/radio group: fogyás, izomnövelés, erőnövelés, egészség — vizuális kártyák ikonokkal)
  - Aktivitási szint (select/radio group: ülő, mérsékelten aktív, aktív, nagyon aktív — rövid leírásokkal)
- [ ] F3.2 Inline validáció: minden mező validálódik blur/change-re, hibaüzenetek közvetlenül a mező alatt, a „Mentés" gomb csak akkor aktív, ha minden kötelező mező ki van töltve
- [ ] F3.3 Kalóriacél előnézet: a form alján, real-time számolva a Mifflin-St Jeor képlettel a kitöltött adatok alapján — egy kártya mutatja: „Az ajánlott napi kalóriabeviteled: **2,450 kcal**" (dinamikusan frissül ahogy töltöd a formot)
- [ ] F3.4 Mentés és redirect: sikeres mentés után navigáció a `/dashboard`-ra, toast értesítéssel („Profil mentve!")
- [ ] F3.5 Onboarding guard: ha a `profiles` kötelező mezői (nem, súly, magasság, cél) üresek, minden protected route redirect-el `/onboarding`-ra
- [ ] F3.6 Profil szerkesztő oldal (`/profile`): ugyanaz a form mint az onboarding, de előre kitöltve az aktuális adatokkal, + profilkép feltöltés mező (Supabase Storage)
- [ ] F3.7 Avatar feltöltés UI: kép kiválasztás, előnézet (crop opcionális), feltöltés progress, az avatar megjelenik a navbarban is

**Acceptance Criteria:**

- Az onboarding form kitölthető és mentés után a dashboard-ra navigál
- A validáció nem engedi üres kötelező mezőkkel menteni
- A kalóriacél real-time frissül a form változásaival
- A profil oldal betölti az aktuális adatokat és módosítás után frissül
- Az avatar feltöltés működik és a kép megjelenik
- Az onboarding guard megakadályozza a dashboard elérését üres profillal

**Dependencies:** Backend Iteration 5 (Profil CRUD)

---

### Iteration F4 — Dashboard Layout & Widgetek

**Status:** TODO

**Goal:** Az alkalmazás szíve: a dashboard oldal a widgetes kártyás grid-del, ami összefoglalja a felhasználó aznapi és heti állapotát.

**Tasks:**

- [ ] F4.1 Dashboard oldal layout (`/dashboard`): felső üdvözlő sáv („Szia [Név]! Ma [napnév] van." + dátum), alatta a widget grid
- [ ] F4.2 Widget grid rendszer: CSS Grid vagy Tailwind grid, desktop: 2-3 oszlop, tablet: 2 oszlop, mobil: 1 oszlop. A kártyák különböző méretűek lehetnek (span-1 vagy span-2).
- [ ] F4.3 **Kalóriamérleg widget** (nagy kártya): körkörös progress ring (SVG) a napi kalória célhoz képest (bevitt/cél), alatta makró bontás (fehérje/szénhidrát/zsír) kis progress bar-okkal, ha meghaladja a célt piros szín
- [ ] F4.4 **Mai edzésterv widget** (nagy kártya): az aktív terv mai napjának gyakorlat listája (név + szettek × ismétlés) a `workout_days.day_of_week` mező alapján, „Kész vagyok" gomb ami a `daily_logs.workout_completed`-et true-ra állítja, ha nincs aktív terv → empty state: „Készíts egy edzéstervet!" link, ha ma pihenőnap (nincs az adott hétköznaphoz rendelt edzésnap) → „Pihenőnap — regenerálódj!" állapot
- [ ] F4.5 **Heti aktivitás widget** (kis kártya): 7 kör (Hé-Va), kitöltött=elvégzett edzés, üres=kihagyott, mai nap kiemelve, pl. „4/6 edzés teljesítve"
- [ ] F4.6 **Testsúly trend widget** (kis kártya): Recharts sparkline/vonaldiagram, utolsó 30 nap, az aktuális súly és változás kiemelve (pl. „-1.2 kg az elmúlt hónapban ↓")
- [ ] F4.7 **Heti AI elemzés widget** (közepes kártya): ha van elemzés az aktuális hétre: összefoglaló szöveg preview + rating (1-10 vizuális), „Részletek" gomb → overlay; ha nincs: „Generálj elemzést!" CTA gomb; ha nincs elég adat: „Eddz legalább 3 napot..." üzenet
- [ ] F4.8 **Gyors navigáció**: a dashboard alján vagy a widgetek között gyors linkek a modulokhoz (Edzéstervező, Kalória, Shop, Fejlődés)
- [ ] F4.9 Dashboard adatok betöltése: a backend `get_dashboard_data` RPC hívás vagy párhuzamos query-k, skeleton loading minden kártyára amíg töltődik
- [ ] F4.10 Empty state-ek minden widgethez: vizuálisan szép „nincs még adat" állapot illusztrációkkal vagy ikonokkal + CTA gombbal a megfelelő modulhoz

**Acceptance Criteria:**

- A dashboard betöltődik a widgetekkel, skeleton loading-gal
- A kalóriamérleg helyesen mutatja a cél vs. bevitt kalóriát
- A mai edzésterv az aktív terv alapján jelenik meg
- A heti aktivitás és testsúly widgetek a valós adatokat mutatják
- Az AI elemzés widget a megfelelő állapotot mutatja (van elemzés / generálható / nincs elég adat)
- Minden widget szép empty state-tel rendelkezik
- A grid responsiven jelenik meg (1-2-3 oszlop a képernyőméret alapján)
- Dark/light módban is jól néz ki

**Dependencies:** Backend Iteration 10 (Dashboard aggregáció), F1 (Design System)

---

### Iteration F5 — Gyakorlat Böngésző & Kereső UI

**Status:** TODO

**Goal:** A gyakorlat-adatbázis böngészésére és szűrésére szolgáló felület, ami az edzéstervező alapja is lesz.

**Tasks:**

- [ ] F5.1 Gyakorlat kereső sáv: debounced text input (300ms), keresés gépelés közben, „X" gomb a törléshez
- [ ] F5.2 Szűrő rendszer: izomcsoport (multi-select tag-ek vagy chip-ek: mellkas, hát, váll, kar, láb, core), eszköz szűrő (súlyzó, gép, testsúly, kötél stb.), nehézség szűrő (kezdő, haladó, profi). A szűrők összecsukhatók mobilon.
- [ ] F5.3 Gyakorlat kártya komponens: kompakt kártya a találati listához — gyakorlat neve (HU), izomcsoport badge(ek), nehézség badge, kis thumbnail kép. Hover-re enyhe kiemelés.
- [ ] F5.4 Gyakorlat részletek popup (Dialog/Sheet): kattintásra megnyílik a részletes nézet — nagy kép(ek), magyar leírás (végrehajtás), elsődleges és másodlagos izomcsoportok, szükséges eszközök, nehézségi szint. Mobilon Sheet (alulról felcsúszó panel), desktopon Dialog.
- [ ] F5.5 Pagination vagy infinite scroll: a találati lista lapozható vagy görgetésre tölt be újabb gyakorlatokat
- [ ] F5.6 Találati lista üres állapot: „Nincs találat a keresésre" üzenet szűrő resetelés gombbal

**Acceptance Criteria:**

- A keresés gépelés közben szűri a gyakorlatokat (debounced)
- A szűrők kombinálhatók (pl. mellkas + súlyzó)
- A gyakorlat részletek popup tartalmazza a magyar nevet, leírást, képet és izomcsoportot
- A pagination/infinite scroll működik
- Üres keresési eredmény esetén szép empty state jelenik meg
- Mobil és desktop nézetben is jól használható

**Dependencies:** Backend Iteration 6 (Gyakorlat seed), Backend Iteration 8 (Keresés/szűrő)

---

### Iteration F6 — Drag & Drop Edzéstervező

**Status:** TODO

**Goal:** A projekt legösszetettebb frontend komponense: az edzésterv összeállítása vizuális tervező felületen.

**Tasks:**

- [ ] F6.1 Edzésterv lista oldal (`/workouts`): a user összes tervének listája kártyákon (név, napok száma, aktív jelölés), „Új terv" gomb, aktív terv kiemelve (sötétvörös `#780000` szegély)
- [ ] F6.2 Edzésterv szerkesztő oldal (`/workouts/[id]`): az egyoldalas layout implementálása:
  - **Felső szekció (sticky):** gyakorlat kereső + szűrők (F5 komponensek újrafelhasználása), találati kártyák horizontális scrollozható sávban vagy kompakt gridben
  - **Alsó szekció:** edzésnapok tab-okban vagy accordion-ban (Hétfő, Kedd, stb.), minden nap egy drop zone
- [ ] F6.3 dnd-kit integráció (desktop): `DndContext`, `DragOverlay`, `useDraggable` a gyakorlat kártyákon, `useDroppable` az edzésnap zónákon. Drag közben vizuális feedback (ghost kártya + drop zone kiemelés).
- [ ] F6.4 Mobil alternatíva: a gyakorlat kártyán egy „+" gomb, ami kattintásra megnyit egy mini dialogot: „Melyik naphoz adod?" → nap kiválasztás → hozzáadás. Nem drag & drop, hanem tap-alapú.
- [ ] F6.5 Gyakorlat beállítások (inline szerkesztés): miután egy gyakorlat bekerült egy napba, inline szerkeszthető mezők jelennek meg mellette: szettek száma (number stepper), ismétlések száma (number stepper), pihenőidő másodpercben (number input), megjegyzés (opcionális text)
- [ ] F6.6 Sorrend átrendezés nap-on belül: dnd-kit `SortableContext`-tel a gyakorlatok sorrendje húzással változtatható (kis fogó/grip ikon a kártya szélén)
- [ ] F6.7 Nap kezelés: nap hozzáadás (gomb + név input + hétköznap kiválasztó — melyik valós hétköznapra esik az edzésnap), nap törlés (megerősítő dialog), nap átnevezés (inline edit), hétköznap módosítása
- [ ] F6.8 Gyakorlat eltávolítás: „X" gomb a gyakorlat kártyán, kattintásra eltávolítás (megerősítés nélkül, de undo toast: „Gyakorlat eltávolítva — Visszavonás")
- [ ] F6.9 Terv mentés: automatikus mentés változáskor (debounced) VAGY explicit „Mentés" gomb — mindkét megközelítés jó, de válasszunk egyet. Javaslat: auto-save + „Mentve" indikátor.
- [ ] F6.10 Aktív terv beállítása: „Legyen ez az aktív tervem" toggle/gomb a terv oldalon, ami a dashboardon megjelenő tervet állítja be
- [ ] F6.11 Terv törlés: megerősítő dialog („Biztosan törlöd? A napok és gyakorlatok is törlődnek."), sikeres törlés után redirect a terv listára
- [ ] F6.12 Empty state: üres edzésnap → „Húzz ide egy gyakorlatot!" placeholder (desktop) / „Adj hozzá gyakorlatot!" gomb (mobil); új terv → „Adj hozzá egy napot a tervezéshez!" üzenet

**Acceptance Criteria:**

- Desktopra a drag & drop működik: gyakorlat húzható a felső sávból az edzésnapba
- Mobilon a gombos hozzáadás működik: „+" → nap választás → hozzáadás
- A gyakorlatok sorrendje átrendezhető drag & drop-pal
- Szettek, ismétlések, pihenőidő inline szerkeszthető
- A terv mentése megbízhatóan működik (auto-save vagy explicit)
- Nap hozzáadás, törlés, átnevezés működik
- Aktív terv beállítása tükröződik a dashboardon
- Empty state-ek minden szinten megjelennek

**Dependencies:** Backend Iteration 7 (Edzésterv CRUD), F5 (Gyakorlat böngésző)

---

### Iteration F7 — Kalóriakövetés UI

**Status:** TODO

**Goal:** A napi étkezések rögzítése és a kalória/makró összesítők megjelenítése.

**Tasks:**

- [ ] F7.1 Kalóriakövetés oldal layout (`/calories`): felül a dátum választó (mai nap default, léptetés előre/hátra nyilakkal), alatta a napi összesítő, alatta az étkezés lista
- [ ] F7.2 Napi összesítő sáv: nagy számok — összes kalória (cél vs. bevitt), fehérje, szénhidrát, zsír grammban, vizuális progress bar-ok (shadcn/ui Progress), ha túl van a célon piros jelzés
- [ ] F7.3 Étkezés szekciók: Reggeli / Ebéd / Vacsora / Snack csoportosítás, minden szekció alatt az adott étkezéstípushoz rögzített ételek listája, szekciónkénti részösszeg
- [ ] F7.4 Étel hozzáadás flow: „+ Étel hozzáadása" gomb egy szekción belül → kereső mező megnyílik (inline vagy Sheet/Dialog) → gépelés → debounced Open Food Facts API keresés → találati lista (étel neve + kcal/100g) → kattintás → adag méret input (gramm, alapértelmezett: 100g) → „Hozzáadás" gomb
- [ ] F7.5 Találati lista formázása: minden találat egy sor — étel neve, kalória/100g halvány szöveggel, kattintásra kiválasztódik
- [ ] F7.6 Rögzített étel sor: étel neve, adag méret, kalória, makrók kis betűvel, „X" gomb törléshez. Kattintásra az adag méret szerkeszthető.
- [ ] F7.7 Heti trend grafikon: az oldal alján vagy külön tab-on, Recharts BarChart az utolsó 7 nap kalóriabevitelével, a kalóriacél vízszintes vonalként jelölve
- [ ] F7.8 Üres állapot: „Ma még nem rögzítettél ételt — kezdd a reggelivel!" + CTA gomb
- [ ] F7.9 Loading/error kezelés: skeleton loading az étel keresőnél, error toast ha az Open Food Facts nem elérhető („A keresés jelenleg nem elérhető, próbáld újra.")

**Acceptance Criteria:**

- Étel kereshető és hozzáadható az Open Food Facts API-n keresztül
- A napi összesítő helyesen számol kalóriát és makrókat
- Az étkezés szekciók (reggeli/ebéd/vacsora/snack) külön csoportosulnak
- Az adag méret módosítható utólag
- A heti trend grafikon a valós adatokat mutatja
- Üres állapot és loading state megjelenik
- Dátum választóval másik napra is lehet navigálni

**Dependencies:** Backend Iteration 9 (Kalóriakövetés)

---

### Iteration F8 — Fejlődéskövetés & AI Elemzés

**Status:** TODO

**Goal:** A testsúly napló UI és a heti AI elemzés teljes képernyős overlay megjelenítése.

**Tasks:**

- [ ] F8.1 Fejlődés oldal layout (`/progress`): két fő szekció — testsúly trend és AI elemzések
- [ ] F8.2 Testsúly rögzítés: egyszerű input mező + „Mentés" gomb a napi súly rögzítéséhez, UPSERT logika (egy napra egy bejegyzés, felülírható)
- [ ] F8.3 Testsúly trend grafikon: Recharts LineChart, utolsó 30-60 nap, interaktív tooltip (dátum + súly), a cél súly vízszintes vonalként (ha a profilban be van állítva)
- [ ] F8.4 Súlyváltozás összesítő: kártya az aktuális hét átlaga vs. előző hét átlaga, változás %-ban és kg-ban, szín kódolva (zöld ha a cél felé halad, piros ha nem)
- [ ] F8.5 AI elemzés CTA kártya: „Heti elemzés generálása" gomb, ha az aktuális hétre még nincs elemzés; disabled + tooltip ha nincs elég adat; „Már generáltál elemzést ezen a héten" üzenet ha rate limited
- [ ] F8.6 AI elemzés generálás: gombnyomásra loading animáció (skeleton/pulse vagy egy szép „AI gondolkodik..." animáció), az `/api/analysis` hívás, válasz után az overlay megnyílik
- [ ] F8.7 AI elemzés overlay (teljes képernyős modal): 
  - Felül: hét dátum tartomány + összesítő rating (1-10, vizuális — pl. kitöltött csillagok vagy körkörös gauge)
  - Közép: az AI összefoglaló szöveg, szépen formázva
  - Alul: 3 konkrét javaslat, kártyákon vagy felsorolásban, mindegyik mellé egy ikon (edzés/táplálkozás/pihenés)
  - „Bezár" gomb + ESC-re záródik
- [ ] F8.8 Korábbi elemzések lista: idővonalas lista az eddigi heti elemzésekből, kattintásra megnyílik az overlay az adott hét elemzésével
- [ ] F8.9 Empty state: „Még nincs heti elemzésed. Rögzítsd az edzéseidet és kalóriáidat, és a hét végén generálj AI elemzést!" — egy szép illusztráció

**Acceptance Criteria:**

- Napi súly rögzíthető és a trend grafikon frissül
- Az AI elemzés generálás működik és az overlay megnyílik a válasszal
- A rate limiting jelzés működik (heti 1 elemzés)
- A korábbi elemzések visszanézhetők
- Loading és error állapotok kezelve vannak
- Az overlay mobilon is jól jelenik meg (teljes képernyő)
- Empty state szép és informatív

**Dependencies:** Backend Iteration 11 (Testsúly), Backend Iteration 12 (AI elemzés)

---

### Iteration F9 — Webshop

**Status:** TODO

**Goal:** A mock táplálékkiegészítő webshop teljes frontend-je: terméklista, termékoldal, kosár, és Stripe checkout.

**Tasks:**

- [ ] F9.1 Webshop oldal layout (`/shop`): felül szűrő sáv (kategória: protein, kreatin, vitamin, aminosav; ár tartomány), alatta a termék grid
- [ ] F9.2 Termék kártya komponens: kép (aspect-ratio fixed, a képeket a projekttulajdonos adja hozzá a projekt mappához), terméknév, rövid leírás (1 sor, csonkítva), ár (HUF, formázva: „4 990 Ft"), „Kosárba" gomb. Hover-re: enyhe scale (1.02) + shadow növekedés.
- [ ] F9.3 Termék grid: 3 oszlop (desktop), 2 oszlop (tablet), 1 oszlop (mobil). Responsive gap és padding.
- [ ] F9.4 Termék részletek oldal (`/shop/[id]`): nagy termékfotó, teljes leírás, ár, „Kosárba" gomb, mennyiség választó (+ / - stepper), kategória badge, készlet jelzés
- [ ] F9.5 Kosár (Zustand store): globális állapot — `items: [{ product, quantity }]`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalPrice` computed
- [ ] F9.6 Kosár drawer (Sheet): a jobb oldalról becsúszó panel, trigger: kosár ikon a navbarban (badge-dzsel mutatja a tételek számát). Benne: termék lista (kép + név + ár + mennyiség stepper + törlés), összesen ár, „Megrendelés" gomb
- [ ] F9.7 Checkout flow: „Megrendelés" gomb → `/api/checkout` hívás → Stripe Checkout Session → redirect a Stripe fizetési oldalra
- [ ] F9.8 Sikeres rendelés oldal (`/shop/success`): „Sikeres rendelés!" üzenet, rendelés összefoglaló, „Vissza a shopba" gomb. Konfetti animáció (opcionális, de fun).
- [ ] F9.9 Megszakított rendelés oldal (`/shop/cancel`): „A rendelés megszakadt" üzenet, „Próbáld újra" gomb
- [ ] F9.10 Rendelési előzmények: a profil oldalon vagy külön szekció — korábbi rendelések listája (dátum, összeg, státusz)
- [ ] F9.11 Empty state: üres kosár → „A kosarad üres — böngéssz a termékeink között!" + link a shopra

**Acceptance Criteria:**

- A terméklista megjelenik a szűrőkkel és a grid layout-tal
- A termékkártyák responsiven jelennek meg
- A kosár Zustand store működik (hozzáadás, törlés, mennyiség módosítás)
- A kosár drawer mutatja a tételeket és az összeget
- A Stripe Checkout redirect működik test módban
- A sikeres és megszakított rendelés oldalak megjelennek
- A kosár badge a navbarban frissül

**Dependencies:** Backend Iteration 13 (Webshop + Stripe)

---

### Iteration F10 — Landing Page (Wow-hatás)

**Status:** TODO

**Goal:** A nem bejelentkezett felhasználók számára készült „eladó" oldal, parallax animációkkal és scroll-effektekkel.

**Tasks:**

- [ ] F10.1 Hero szekció: teljes képernyős sötét háttér (`#111111`), nagy motivációs headline Barlow Condensed uppercase-ben (pl. „TERVEZD MEG. EDZD LE. FEJLŐDJ."), alatta subtitle, két CTA gomb (Regisztráció — sötétvörös `#780000`, Bejelentkezés — ghost/outline), háttérben halványított edzőtermi kép vagy absztrakt gradiens animáció (a képeket a projekttulajdonos adja hozzá a projekt mappához)
- [ ] F10.2 Feature szekciók (3-4 db): scroll-ra bejövő szekciók (Framer Motion `whileInView`), minden szekció: bal oldalon szöveg (feature cím + leírás), jobb oldalon app screenshot/mockup. Váltakozó elrendezés (balra-jobbra).
  - Feature 1: Drag & Drop Edzéstervező
  - Feature 2: Kalóriakövetés
  - Feature 3: Heti AI Elemzés
  - Feature 4: Integrált Webshop
- [ ] F10.3 Statisztikák szekció: animált számláló (count-up effekt) — pl. „200+ gyakorlat", „Heti AI elemzés", „Minden egy helyen"
- [ ] F10.4 Parallax effekt: a háttér elemek (sötétvörös/szürke gradiens blobek, dekoratív formák) lassabban mozognak scroll-ra mint a tartalom
- [ ] F10.5 Social proof / Differenciálók szekció: a 3 fő differenciáló tényező (integráció, drag&drop, AI elemzés) kártyákon, ikonokkal
- [ ] F10.6 CTA footer szekció: „Kezdd el most — Ingyen!" nagy gomb, alatta kis szöveg, háttérben gradiens
- [ ] F10.7 Navbar a landing page-en: átlátszó háttér, scroll-ra válik sötétté (`#111111` + blur effekt), a „Regisztráció" és „Bejelentkezés" gombok mindig láthatók, uppercase Barlow Condensed letter-spacing-gel
- [ ] F10.8 Responsív landing: mobilon egyoszlopos, az animációk egyszerűsítettek (kevesebb parallax, kevesebb mozgás — teljesítmény)
- [ ] F10.9 Footer: wger CC-BY-SA 3.0 licenc hivatkozás, Open Food Facts hivatkozás, „© 2026 FitTrack Pro"

**Acceptance Criteria:**

- A landing page betöltődik szép animációkkal
- A scroll-ra bejövő feature szekciók működnek
- A CTA gombok a regisztrációs/login oldalra navigálnak
- A parallax effekt sima (60fps)
- Mobilon is jól néz ki, az animációk nem akadnak
- A navbar scroll-ra változik átlátszóról sötétre
- A footer tartalmazza a kötelező licenc hivatkozásokat

**Dependencies:** F1-F9 (a feature screenshot-ok/mockup-ok a kész app-ból származnak)

---

### Iteration F11 — Polish, Responsive Audit & Végső Simítások

**Status:** TODO

**Goal:** Az összes oldal végleges responsive tesztelése, empty state-ek auditja, loading állapotok, error kezelés, és UX finomhangolás.

**Tasks:**

- [ ] F11.1 Responsive audit: minden oldal tesztelése 3 breakpointon (mobil 375px, tablet 768px, desktop 1280px), layoutproblémák javítása
- [ ] F11.2 Empty state audit: minden modul üres állapotának ellenőrzése és szépítése (dashboard, edzéstervező, kalória, webshop, fejlődés)
- [ ] F11.3 Loading state audit: minden adatbetöltésnél skeleton vagy spinner megjelenik, nincs „villanás" (layout shift)
- [ ] F11.4 Error state audit: minden API hívás hibakezeléssel rendelkezik, toast üzenetekkel, nincs unhandled error a konzolban
- [ ] F11.5 Toast/notification rendszer véglegesítése: shadcn/ui Toast konzisztens használata minden sikeres/hibás művelethez (mentés, törlés, hozzáadás stb.)
- [ ] F11.6 Accessibility alapok: tab navigáció működik, ARIA labelek a fontos elemeken, kontrasztarány ellenőrzés (WCAG AA), focus ring a sötétvörös (`#780000`) akcenttel
- [ ] F11.7 Performance audit: Lighthouse futtatás, nagy képek optimalizálása (next/image), code splitting ellenőrzése, felesleges re-renderek eliminálása
- [ ] F11.8 Cross-browser teszt: Chrome, Firefox, Safari, mobil Chrome, mobil Safari — layout és funkció ellenőrzés
- [ ] F11.9 Demo user élmény: a demo user fiókjával végig kell menni az egész flow-n és biztosítani, hogy az összes widget, grafikon, AI elemzés, webshop rendelés szépem megjelenik
- [ ] F11.10 Végső dark/light mode teszt: minden oldal mindkét módban jól néz ki, nincs „elfelejtett" komponens ami csak az egyikben jó

**Acceptance Criteria:**

- Minden oldal 3 breakpointon és mindkét témában jól jelenik meg
- Nincs egyetlen oldal sem ahol üres állapotban „csúnya" vagy informatív nélküli a felület
- Nincs layout shift betöltéskor
- Nincs console error a teljes user flow során
- A Lighthouse performance score 80+ (mobilon is)
- A demo user fiókjával az összes funkció bemutatható

**Dependencies:** F1-F10 (összes)

---

## Összefoglaló — Frontend Iteráció Függőségi Gráf

```
F1 (Design System & Layout Shell)
 │
 ├────────────────────────────────────┐
 ▼                                    ▼
F2 (Auth oldalak)                   [vár: Backend Iter 6, 8]
 │                                    │
 ▼                                    ▼
F3 (Onboarding & Profil)           F5 (Gyakorlat böngésző)
 │                                    │
 ▼                                    ▼
F4 (Dashboard)                     F6 (Drag & Drop tervező)
 │                                    │
 ├──────────┬─────────────────────────┤
 ▼          ▼                         │
F7 (Kalória) F8 (Fejlődés & AI)     │
 │           │                        │
 ├───────────┤                        │
 ▼           ▼                        │
F9 (Webshop)                         │
 │                                    │
 ├────────────────────────────────────┘
 ▼
F10 (Landing Page)
 │
 ▼
F11 (Polish & Responsive Audit)
```

---

## Backend ↔ Frontend Függőségek

| Frontend Iteráció | Szükséges Backend Iteráció |
|---|---|
| F1 (Design System) | Backend I1 (Projekt alapok) |
| F2 (Auth) | Backend I4 (Auth) |
| F3 (Onboarding & Profil) | Backend I5 (Profil CRUD) |
| F4 (Dashboard) | Backend I10 (Dashboard aggregáció) |
| F5 (Gyakorlat böngésző) | Backend I6 (Seed) + I8 (Keresés/szűrő) |
| F6 (Edzéstervező) | Backend I7 (Edzésterv CRUD) |
| F7 (Kalóriakövetés) | Backend I9 (Kalória) |
| F8 (Fejlődés & AI) | Backend I11 (Testsúly) + I12 (AI elemzés) |
| F9 (Webshop) | Backend I13 (Webshop + Stripe) |
| F10 (Landing Page) | Nincs közvetlen (statikus) |
| F11 (Polish) | Backend I14 (Integráció) |

---

## 🧠 Kreatív Megjegyzések — Ami Kiemeli a Projektet

1. **Micro-interakciók:** a drag & drop „beleesés" animáció, a kosár gomb „pattanása" hozzáadáskor, a kalória progress ring feltöltődése — ezek teszik emlékezetessé.
2. **Konzisztens empty state-ek:** minden üres állapothoz egy-egy egyszerű illusztráció vagy ikon + CTA — ez mutatja, hogy átgondolt a UX.
3. **AI elemzés overlay:** ez a „wow" feature a védésen — ha szép a megjelenítése és valós adatokkal mutatjuk, az eladja az egész projektet.
4. **Landing page animációk:** a Framer Motion `whileInView` + staggered children + parallax kombó elegendő a wow-hatáshoz, nem kell túlbonyolítani.
5. **SpaceX-inspirált ipari esztétika:** a sötét háttér, ghost gombok, uppercase Barlow Condensed letter-spacing-gel, és a sötétvörös akcentek együtt egyedi, profi megjelenést adnak — messze a tipikus „AI slop" felett.

## 🔍 Kritikus Megjegyzések — Amire Figyelni Kell

1. **F1 a legfontosabb iteráció.** Ha a Design System nem stabil, minden későbbi iteráció szenved. Szánj rá időt.
2. **A párhuzamosítás lehetséges:** F5 (gyakorlat böngésző) és F2-F3 (auth/profil) párhuzamosan fejleszthető, ha a backend kész.
3. **A F6 (drag & drop) a legnagyobb kockázat.** Ha csúszik, a többi modul nem függ tőle — a dashboard, kalória és webshop önállóan is működik.
4. **77 task sok.** Priorizáld: ha időhiány van, az F10 (landing animációk) és F11 egyszerűsíthető. A core flow (F1→F2→F3→F4→F6→F7) a legfontosabb.
5. **Kontraszt ellenőrzés:** a `#780000` sötétvörös fehér szövegen WCAG AA-t teljesít nagy szöveggel, de kis szövegnél nem biztos — a világosabb `#e0e0e0` szöveg + sötét háttér kombóra kell figyelni.
