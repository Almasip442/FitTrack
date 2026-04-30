# FitTrack Pro Projekt Meghatározás | 2026
**Edzés & Táplálkozás Webapplikáció Projekt Meghatározás - Mélykutatás**

| Tulajdonság | Érték |
| :--- | :--- |
| **Dokumentum típus** | Végleges konzultációs dokumentum |
| **Félév** | 2025/26-2. félév |
| **Dátum** | 2026. április 27. |
| **Státusz** | Jóváhagyott tervezési fázis |
| **Szerző** | Projekt Tervező |

Ez a dokumentum az 5 kötelező projektalapozó pontot dolgozza ki részletesen, mélykutatással alátámasztva a tervezési döntéseket.

---

## 1. Probléma és Célfelhasználó

Az edzéssel és táplálkozással foglalkozó digitális eszközök piaca széttöredezett: a legtöbb felhasználó egyszerre 3-5 különböző appot használ, amelyek nem kommunikálnak egymással – egy kalóriaszámláló, egy edzéskövető, egy webshop és egy hírolvasó alkalmazást. Ez felesleges súrlódást, motivációvesztést és adatvesztést okoz.

> **Probléma - Egy mondatban:** A rendszeresen edzeni vágyó embereknek nincs egyetlen, integrált platformjuk, ahol edzéstervet tervezhetnek, kalóriájukat nyomon követhetik, táplálékkiegészítőket vásárolhatnak, és személyre szabott fejlődési visszajelzést kaphatnak - mindezt egységes, motiváló felületen.

**Célfelhasználó:** 18-40 éves, tudatosan sportoló vagy sportolni kezdő emberek, akik a testépítés, fitness vagy az egészséges életmód iránt érdeklődnek, és digitális megoldásban gondolkodnak.

### 1.1 Felhasználói Fájdalompontok (Pain Points)

| Fájdalompont | Jelenlegi helyzet | Hogyan oldja meg a FitTrack Pro? |
| :--- | :--- | :--- |
| **Széttöredezett eszközök** | 3-5 különböző app egyszerre | Minden funkció egy helyen, integráltan |
| **Nincs személyre szabott feedback** | Csak adat, nincs értelmezés | Heti AI-alapú fejlődéselemzés (OpenRouter LLM) |
| **Edzésterv összeállítása nehéz** | Manuális kutatás, YouTube videók | Drag & drop tervező + wger gyakorlat-adatbázis |
| **Motiváció fenntartása** | Nincs vizuális visszajelzés | Dashboard, heti statisztikák |
| **Kiegészítő vásárlás külön helyen** | Külső webshop, nincs kontextus | Integrált webshop a platformon |

### 1.2 Célfelhasználói Szegmensek

* **Kezdők (18-28 év):** Nem tudják, hol kezdjék - útmutatást, ajánlott terveket és kalóriakalkulátort keresnek.
* **Haladók (22-40 év):** Rendszeresen edzők, akik stagnálnak - teljesítményelemzést és optimalizálást igényelnek.
* **Táplálkozástudatosak (20-35 év):** Makrókat és kalóriát követnek, táplálékkiegészítőket használnak.
* **Testépítők (20-45 év):** Komolyan veszik az edzést - részletes statisztikák, periodizáció, személyre szabás.

---

## 2. Értékajánlat

Az értékajánlat nem marketingszöveg, hanem konkrét, mérhető különbségek halmaza a meglévő megoldásokhoz képest.

### 2.1 Versenytársakkal Való Összehasonlítás

| Funkció | FitTrack Pro | MyFitnessPal | Strava | Fitbod | JEFIT |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Drag&Drop edzéstervező** | Igen | Nem | Nem | Nem | Nem |
| **Kalóriakövetés** | Igen | Igen | Nem | Nem | Nem |
| **Heti AI fejlődéselemzés** | Igen (OpenRouter LLM) | Nem | Nem | Korlátolt | Nem |
| **Integrált webshop** | Igen (mock + Stripe test) | Nem | Nem | Nem | Nem |
| **Dashboard összefoglaló** | Igen | Részben | Részben | Nem | Nem |
| **Gyakorlat-adatbázis (wger)** | Igen (150-200, magyar) | Nem | Nem | Igen | Igen |

### 2.2 A Három Konkrét Differenciáló Tényező

1. **D1-Teljes integráció egyetlen platformon:** A FitTrack Pro az egyetlen platform, ahol az edzéstervező, kalóriakövető és webshop egymással összefüggő, egységes felhasználói élményt alkotnak. Az edzésterv alapján automatikusan javasol kalóriabevitelt; a teljesítményadatok alapján ajánl táplálékkiegészítőt a shopból.
2. **D2-Drag & Drop edzéstervező adatbázis-alapú gyakorlatleírásokkal:** Nem előre gyártott, merev terveket kínál, hanem vizuális, drag-and-drop alapú tervező felületet, ahol a felhasználó saját maga állítja össze az edzést a wger nyílt forráskódú adatbázisból importált, magyar nyelvre fordított gyakorlatokból. Minden gyakorlathoz részletes végrehajtási leírás és képek tartoznak.
3. **D3-Heti AI-alapú fejlődéselemzés konkrét cselekvési javaslatokkal:** Nem csak adatokat mutat, hanem értelmezi azokat. Az OpenRouter API-n keresztül elérhető LLM az előző hetek statisztikái alapján konkrétan megmondja: 'A mellizmod fejlődése 12%-kal elmaradt a tervtől - adj hozzá heti 1 plusz szett present nyomást.' Ez az a funkció, amit a konkurencia nem tud nyújtani.

> **Értékajánlat - Egy mondatban:** A FitTrack Pro az egyetlen edzés-és-táplálkozás platform, amely drag-and-drop edzéstervezést, integrált kalóriakövetést, táplálékkiegészítő-vásárlást és heti AI fejlődéselemzést nyújt egyetlen, összefüggő, magyar nyelvű felületen - ahelyett, hogy a felhasználó 3-5 különböző appot kellene kezelnie.

---

## 3. MVP Hatókör - 6 Kulcsképesség

A Minimum Viable Product (MVP) azt tartalmazza, ami a felhasználói érték szempontjából nélkülözhetetlen, és ami az első félévben megvalósítható. Az MVP nem a megvalósítható minimum - hanem az értéket átadható minimum.

* **MVP Képesség #1 - Autentikáció és Személyes Profil:** Regisztráció e-mail + jelszóval (Supabase Auth), bejelentkezés, profil szerkesztése, nem/testsúly/magasság/cél/aktivitási szint beállítása, kalóriacél automatikus számítása (Mifflin-St Jeor képlet, nemek szerint differenciálva).
* **MVP Képesség #2 - Dashboard:** Aznapi edzésterv kártya, kalóriamérleg widget (cél vs. bevitt), makró kördiagram, heti aktivitás grafikon, testsúly trend (30 nap), gyors navigáció a modulokhoz.
* **MVP Képesség #3 - Drag & Drop Edzéstervező:** Drag & drop edzésterv builder (dnd-kit), gyakorlat-kereső/szűrő (izomcsoport, eszköz, nehézség), gyakorlatleírás popup (kép, izomcsoport, végrehajtás), szettek/ismétlések/pihenőidő beállítása, terv mentése/betöltése, aktív terv kiválasztása.
* **MVP Képesség #4 - Kalóriakövetés:** Étkezés rögzítése (Open Food Facts API élelmiszer-kereső, adagméret, étkezés típusa), napi összesítő (kalória/fehérje/szénhidrát/zsír), heti trend grafikon (Recharts).
* **MVP Képesség #5 - Fejlődéskövető és Heti AI Elemzés:** Testsúly napló, heti statisztika dashboard (elvégzett edzések, kalóriacél teljesítése, testsúlyváltozás), heti AI-alapú szöveges elemzés és javaslatok (OpenRouter API), trend grafikonok (4-8 hetes időszak).
* **MVP Képesség #6 - Webshop (Mock):** Termékkatalógus szűrőkkel (20-30 mock táplálékkiegészítő), termékoldal részletekkel, kosár funkció (Zustand), Stripe Checkout test módban.

### Mi marad ki az MVP-ből, de később kerül be?
* **Hírek oldal (7. modul):** Tartalom aggregáció / RSS - könnyen implementálható, de nem kulcsfunkció.
* **Landing page teljes animáció:** Az MVP-ben egyszerűsített, statikus változat kerül be.
* **Közösségi / social funkciók:** Barátok, ranglisták, kihívások - V2-es ütemterv.

---

## 4. Ami Kimarad - Tudatos Scope Döntések

A scope creep (hatókör-kúszás) a hallgatói projektek #1 kudarc-oka. Ha előre definiáljuk, mi marad ki, elkerülhető, hogy félév közben olyan funkciók kerüljenek be, amelyek destabilizálják a projektet.

| Kihagyott elem | Indoklás | Mikor kerülhet be? |
| :--- | :--- | :--- |
| **Gépi tanulás alapú ajánlórendszer** | A szabály-alapú ajánlás MVP-re elegendő; ML modell tanítása időigényes és adatintenzív | V2-2. félév vagy külön szakmai projekt |
| **Mobil alkalmazás (iOS/Android)** | A webalkalmazás PWA-ként mobilon is használható; natív app fejlesztése önálló projekt | V3-mobil fázis után |
| **Social funkciók (barátok, ranglisták)** | Közösség építése tartalom nélküli platformon értelmetlen - előbb a core loop kell | V2-felhasználói bázis kiépülése után |
| **Valós idejű edzés-coaching (AI chat)** | LLM API integráció drága és latency-érzékeny; a heti elemzés ezt részben helyettesíti | V2 - prémium tier funkcióként |
| **Wearable/fitness tracker integráció** | Fitbit/Apple Watch API integráció komplex OAuth + adatszinkron; MVP-hez manuális input elegendő | V2-partneri integráció keretében |
| **Valós fizetési tranzakciók (éles Stripe)** | MVP-ben Stripe test mode; GDPR/PCI compliance éles környezetben külön feladat | Éles induláskor - post-MVP |
| **Többnyelvű támogatás (i18n)** | Az MVP kizárólag magyar nyelvű; i18n keretrendszer bevezethető később, de fordítás erőforrásigényes | Üzleti terjeszkedés esetén |
| **Videós gyakorlatbemutatók** | Hosting, bandwidth és tartalomgyártás MVP-re aránytalanul drága; képes leírás elegendő | V2-YouTube embed megoldással |
| **Hírek oldal** | Tartalom aggregáció nem kulcsfunkció; az MVP a core edzés/táplálkozás/shop ciklusra fókuszál | V2-tartalom bővítés |

---

## 5. Technikai Platform & Tech Stack

### 5.1 A Kiválasztott Tech Stack

| Réteg | Technológia | Döntés indoka |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) TypeScript | Server Components, API Routes, SSR/SSG, Vercel deploy; a Supabase lekérdezések szerveren futnak |
| **UI Library** | Tailwind CSS + shadcn/ui | Gyors testreszabhatóság, nem generikus megjelenés |
| **Tipográfia** | Barlow Condensed (display) + Barlow (body) — Google Fonts | DIN-örökségű ipari geometrikus fontcsalád, uppercase + letter-spacing esztétikához |
| **Ikonok** | Lucide React | shadcn/ui natív ikon könyvtár, konzisztens vonalvastagság |
| **DnD** | dnd-kit | Aktívan karbantartott, React 18 kompatibilis, könnyű integráció |
| **State Mgmt** | Zustand | Egyszerűbb boilerplate, megfelelő komplexitáshoz |
| **Grafikonok** | Recharts | React-natív, deklaratív API, könnyen responsive |
| **Backend / Adatbázis** | Supabase (PostgreSQL, beépített Auth) | Beépített API, Auth, Realtime, Storage és Row Level Security; @supabase/ssr natív Next.js támogatás |
| **AI Elemzés** | OpenRouter API | Több LLM modell elérhető egyetlen API-n keresztül; aktuális modell: `nvidia/nemotron-3-super-120b-a12b:free`; szerver oldali proxy-n keresztül hívva |
| **Fizetés** | Stripe (test mode) | Legjobb DX, széles dokumentáció, ingyenes tesztelés |
| **Deployment** | Vercel (FE) + Supabase (BE+DB) | Ingyenes tier, egyszerű CI/CD, hallgatói projekthez ideális |
| **Élelmiszer API** | Open Food Facts | Ingyenes, nyílt adatbázis, 3M+ termék, magyar termékek támogatása |
| **Gyakorlat-adatbázis** | wger REST API (statikus import) | Nyílt forráskód (AGPL-3.0), adat CC-BY-SA 3.0 licenc, ~691 gyakorlat REST API-n, izomcsoport/eszköz/kategória adatokkal |

### 5.1.1 Vizuális Design Irány

A FitTrack Pro vizuális megjelenése egy **SpaceX-inspirált sötét, ipari-minimalista esztétikára** épül, kiegészítve pirosas és szürkés árnyalatokkal.

| Szín | Hex | Szerep |
| :--- | :--- | :--- |
| **Közel fekete** | `#111111` | Fő háttérszín (dark mode) |
| **Sötétvörös** | `#780000` | Elsődleges akcentszín (CTA-k, kiemelések, aktív állapotok) |
| **Szürke** | `#404040` | Másodlagos felületek, kártyák, szegélyek |
| **Világos szürke** | `#e0e0e0` | Elsődleges szövegszín (dark mode) |

**Tipográfia:** Barlow Condensed (Bold/ExtraBold, uppercase, letter-spacing: 0.96–1.17px) a headingekhez; Barlow (Regular/Medium) a body szöveghez. A DIN ipari stílus Google Fonts megfelelője — geometrikus, mérnöki karakter.

**Ikonok:** Lucide React — shadcn/ui natív könyvtár, konzisztens 1.5px vonalvastagság.

**Vizuális elvek:** Minimális dekoráció, sötét háttéren lebegő kártyák üveghatással, ghost gombok félig átlátszó háttérrel, uppercase + pozitív letter-spacing az ipari/aerospace hangulatért. Dark/Light mode toggle-lel.

### 5.2 Gyakorlat-adatbázis Stratégia

A gyakorlat-adatbázis a wger nyílt forráskódú fitness platform REST API-jából származik. Az adatok **statikus importként** kerülnek a Supabase adatbázisba — nem runtime API hívásként. Ez biztosítja, hogy az alkalmazás nem függ külső szolgáltatástól (a védésen nem hal meg az app, ha a wger szervere nem elérhető).

**Import folyamat:**
1. Egy egyszeri seed script lehúzza a gyakorlatokat a wger API-ból (angol nyelven, `status=2` — csak jóváhagyottak)
2. A ~691 gyakorlatból 150-200 kerül kiválasztásra, lefedve az összes fő izomcsoportot
3. Ahol a wger-ben elérhető magyar fordítás (`language=14`), az kerül felhasználásra
4. Ahol nincs magyar fordítás, az OpenRouter API-n keresztül elérhető LLM fordítja le a nevet és leírást — ez az "AI-támogatott adatmigráció és lokalizáció" része
5. A gyakorlat-képek a Supabase Storage-ba kerülnek feltöltésre
6. A teljes adatkészlet a Supabase `exercises` táblába kerül beszúrásra

**Licenc:** A wger gyakorlat- és összetevő adatai Creative Commons Attribution Share-Alike 3.0 (CC-BY-SA 3.0) licencűek. A forrás hivatkozása kötelező a szakdolgozat irodalomjegyzékében és az alkalmazás footerében.

### 5.3 Adatbázis Séma - Főbb Entitások

* **profiles:** id (FK → auth.users), name, age, gender, weight, height, goal, activity_level, avatar_url, created_at, updated_at
* **exercises:** id, wger_id, name_hu, name_en, description_hu, description_en, muscle_group, muscles_secondary, equipment, difficulty, image_url, category
* **workout_plans:** id, user_id, name, description, is_active, created_at, updated_at
* **workout_days:** id, plan_id, day_name, day_order, day_of_week (integer 0-6, nullable — a valós hétköznaphoz rendelés)
* **workout_day_exercises:** id, workout_day_id, exercise_id, sets, reps, rest_seconds, exercise_order, notes
* **daily_logs:** id, user_id, date, workout_completed, notes
* **food_entries:** id, daily_log_id, food_name, calories, protein, carbs, fat, amount, meal_type
* **weight_logs:** id, user_id, date, weight
* **weekly_analyses:** id, user_id, week_start, week_end, workouts_completed, avg_calories, weight_change, ai_analysis, ai_suggestions, created_at
* **products:** id, name, description, price, category, image_url, stock, is_active
* **orders:** id, user_id, status, total, stripe_session_id, created_at
* **order_items:** id, order_id, product_id, quantity, unit_price
* **workout_exercise_logs:** id, daily_log_id, exercise_id, sets_completed, reps_completed (integer tömb), weight_used (decimal tömb), notes, created_at

### 5.4 Row Level Security (RLS) Stratégia

Minden tábla RLS-sel védett a Supabase-ben:
* **profiles, workout_plans, daily_logs, weight_logs, weekly_analyses, orders:** Csak a saját adatait olvashatja/írhatja a felhasználó (`auth.uid() = user_id`)
* **exercises, products:** Publikus olvasás, csak admin írhat
* **workout_days, workout_day_exercises, food_entries, order_items, workout_exercise_logs:** A szülő táblán keresztüli jogosultság-ellenőrzés (pl. `workout_day_exercises` → `workout_days` → `workout_plans` → `user_id`, `workout_exercise_logs` → `daily_logs` → `user_id`)

### 5.5 Architektúra Áttekintés

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│            Next.js 14+ (App Router)                 │
│     TypeScript + Tailwind + shadcn/ui               │
│     Zustand (state) + dnd-kit + Recharts            │
├─────────────────────────────────────────────────────┤
│                    BACKEND                          │
│              Supabase Platform                      │
│  ┌───────────┬──────────┬───────────┐               │
│  │PostgreSQL │  Auth    │  Storage  │               │
│  │(adatok)   │(session) │(képek)    │               │
│  └───────────┴──────────┴───────────┘               │
│         Next.js API Routes (proxy)                  │
│  ┌──────────────────────────────────┐               │
│  │ /api/analysis (OpenRouter proxy) │               │
│  │ /api/checkout (Stripe proxy)     │               │
│  │ /api/webhooks/stripe             │               │
│  │ /api/food-search (OFF proxy)     │               │
│  └──────────────────────────────────┘               │
├─────────────────────────────────────────────────────┤
│                KÜLSŐ SZOLGÁLTATÁSOK                  │
│  ┌──────────────┬─────────────┬──────────────────┐  │
│  │ OpenRouter   │ Open Food   │ Stripe           │  │
│  │ (AI elemzés) │ Facts (kaja)│ (test fizetés)   │  │
│  └──────────────┴─────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Projekt Sikeresség Kritériumai (MVP)

1. A felhasználó be tud regisztrálni és be tud jelentkezni (Supabase Auth).
2. Drag-and-drop edzéstervet tud összeállítani a wger-ből importált, magyar nyelvű gyakorlat-adatbázisból.
3. Napi kalória- és makróbevitelét rögzíteni és nyomon követni tudja az Open Food Facts API segítségével.
4. A dashboardon látja az aznapi tervet, a heti kalóriaegyenlegét és a testsúly trendjét.
5. Táplálékkiegészítőket tud kosárba tenni és Stripe test módban rendelést leadni.
6. Heti AI fejlődéselemzést és konkrét fejlesztési javaslatokat kap az OpenRouter API-n keresztül.
