# FitTrack Pro — Bugfix Backlog

## Scope Summary

A FitTrack Pro projekt (Next.js + Supabase fullstack fitness alkalmazás) teljes kódbázisának átvizsgálása után összegyűjtött hibák iterációkra bontva. A backlog 5 iterációban fedi le a kritikus auth/navigációs hibákat, az OpenRouter AI elemzés javításait, a Stripe checkout problémákat, a frontend állapotkezelési és UX hibákat, valamint a backend adat-konzisztencia kérdéseket.

**Megjegyzés:** A Stripe API verzió mismatch (`checkout: 2025-04-30.basil` vs `webhook: 2026-04-22.dahlia`) DONE — előzetesen javítva, mindkét route most a `2026-04-22.dahlia` verziót használja.

---

## Backlog Progress

| Iteration | Tasks | Status | Completion |
|---|---|---|---|
| B1 — Kritikus auth és navigáció javítások | 2 | DONE | 100% |
| B2 — OpenRouter AI elemzés javítás | 3 | DONE | 100% |
| B3 — Stripe checkout javítások | 3 | DONE | 100% |
| B4 — Frontend állapotkezelés és UX javítások | 4 | DONE | 100% |
| B5 — Backend adat konzisztencia | 3 | DONE | 100% |
| **Total** | **15** | **DONE** | **100%** |

| Metric | Value |
|---|---|
| Total tasks | 15 |
| Completed tasks | 15 |
| Remaining tasks | 0 |
| Completion | 100% |

---

## Iterations

---

### Iteration B1 — Kritikus auth és navigáció javítások

**Status:** DONE

**Goal:** Az alapvető authentikációs flow hibáinak javítása — működő kijelentkezés a navbarból és a hiányzó "Elfelejtett jelszó" funkció implementálása.

**Backend dependency:** Nincs (pure frontend)

**Tasks:**

- [x] B1.1 Sign-out gomb fix: a `src/components/layout/sign-out-button.tsx` (navbar-ban használt) üres `onClick` placeholder — le kell cserélni az `src/components/auth/sign-out-button.tsx` valódi `signOutAction` Server Action implementációjára, vagy a Navbar importját átirányítani a működő komponensre
- [x] B1.2 `forgot-password` oldal implementálása: `/app/(auth)/forgot-password/page.tsx` létrehozása Supabase `resetPasswordForEmail` integrációval; a login oldal "Elfelejtett jelszó" linkjének beállítása erre az új útvonalra

**Acceptance Criteria:**

- A navbar kijelentkezés gombja ténylegesen kijelentkezteti a felhasználót és átirányít a `/login` oldalra
- A login oldalon az "Elfelejtett jelszó" link működik és egy valódi oldalra navigál
- A `/forgot-password` oldalon a felhasználó megadhatja az email címét, és Supabase `resetPasswordForEmail` hívás történik
- Sikeres kérés után a felhasználó értelmes visszajelzést kap (pl. "Email elküldve")
- Hibás email vagy hálózati hiba esetén értelmes hibaüzenet jelenik meg

**Dependencies:** Nincs

---

### Iteration B2 — OpenRouter AI elemzés javítás

**Status:** DONE

**Goal:** A heti AI elemzés stabilizálása: működő modell beállítása, hibák megfelelő loggolása és a hibás dátumtartomány-számítás javítása.

**Backend dependency:** Nincs

**Tasks:**

- [x] B2.1 OpenRouter modell-azonosító csere: `src/app/api/analysis/route.ts` L31 — `nvidia/nemotron-3-super-120b-a12b:free` lecserélése `deepseek/deepseek-r1-distill-llama-70b:free` modellre
- [x] B2.2 OpenRouter hibák loggolása: a `callOpenRouter` üres `catch {}` blokkjának és a néma `if (!res.ok) return null` ágnak a felváltása értelmes `console.error` loggolással (HTTP status, response body kiírása), hogy a hibák debuggolhatóak legyenek
- [x] B2.3 `weekEnd` jövőbeli dátum fix: `src/app/api/analysis/route.ts` L438–441 — a `weekEnd` ne léphessen túl a mai napon (`Math.min(weekEndIso, todayIso)` mintával); biztosítani, hogy az analízis rekord `week_end` mezője soha ne legyen jövőbeli dátum

**Acceptance Criteria:**

- Az AI elemzés generálása sikeresen lefut a `deepseek/deepseek-r1-distill-llama-70b:free` modellel
- OpenRouter hiba esetén a szerver log tartalmazza a HTTP status kódot és a válasz body-t
- Az adatbázisban tárolt `weekly_analyses.week_end` érték soha nem nagyobb, mint a mai dátum
- A heti elemzés generálható akkor is, ha a hét még nem ért véget (a `week_end` az aktuális napra csonkolódik)

**Dependencies:** Nincs

---

### Iteration B3 — Stripe checkout javítások

**Status:** DONE

**Goal:** A webshop fizetési flow konzisztenciájának és adatintegritásának biztosítása — készlet-validáció, orphan order megelőzés, helyes HUF összegek.

**Backend dependency:** Nincs

**Tasks:**

- [x] B3.1 Stock ellenőrzés a checkoutban: `src/app/api/checkout/route.ts` — a product lekérdezéshez hozzáadni a `stock` mezőt; ha bármely tételnél a kért `quantity > stock`, a route adjon vissza 400-as hibát értelmes üzenettel a Checkout Session létrehozása előtt
- [x] B3.2 Webhook orphan order fix: `src/app/api/webhooks/stripe/route.ts` — ha az `order_items` insert meghiúsul (pl. product-name nem található), az előzetesen beszúrt `orders` rekordot is törölni kell (transaction-szerű kompenzáló logika), hogy ne maradjanak árva rendelések
- [x] B3.3 HUF unit_amount kerekítés: `src/app/api/checkout/route.ts` L181 — a `unit_amount` értékét `Math.round(product.price)`-szal biztosítani, hogy zero-decimal pénznem (HUF) esetén soha ne kerüljön törtszám a Stripe API-hoz

**Acceptance Criteria:**

- Ha a felhasználó több terméket próbál vásárolni, mint amennyi készleten van, a checkout 400-as hibát ad és NEM jön létre Stripe Checkout Session
- Ha az `order_items` insert hibára fut a webhookban, az `orders` rekord is törlődik — nem maradnak árva orderek a DB-ben
- A Stripe Checkout Session `unit_amount` mezője mindig egész szám HUF esetén
- Sikeres fizetés után a komplett order + order_items rekordok megfelelően létrejönnek

**Dependencies:** Nincs

---

### Iteration B4 — Frontend állapotkezelés és UX javítások

**Status:** DONE

**Goal:** A kliens oldali állapotkezelési hibák, race condition-ök és UX problémák javítása a kosár, edzéstervező és kalória modulokban.

**Backend dependency:** Nincs

**Tasks:**

- [x] B4.1 Zustand cart persist hydration fix: `src/store/cart.ts` — `skipHydration: true` hozzáadása a persist konfighoz; a `CartDrawer`-ben `mounted` state pattern bevezetése (`useState(false)` + `useEffect` → `setMounted(true)`) az `itemCount` badge-hez, hogy megszűnjön a hydration warning és a badge villogása oldal váltáskor
- [x] B4.2 DragOverlay ghost gombok elrejtése: `src/components/workouts/workout-plan-editor.tsx` — a DragOverlay-ben renderelt `WorkoutDayExerciseCard`-on a stepper és törlés gombok ne legyenek láthatók/kattinthatók (`pointer-events-none` osztály hozzáadása vagy conditional render az `isDragging` prop alapján)
- [x] B4.3 `ensureDailyLog` race condition fix: `src/components/calories/calories-client.tsx` — a párhuzamos `ensureDailyLog` hívások koaleszálása (pl. `useRef`-ben tárolt pending Promise, ami az első hívás eredményét adja vissza minden további hívónak is), hogy ne jöjjön létre ütközés vagy duplikált rekord
- [x] B4.4 Library load-more cancellation: `src/components/workouts/workout-plan-editor.tsx` `handleLoadMoreLibrary` függvénye — `AbortController` vagy `useRef`-es stale-check bevezetése, hogy gyors keresésváltáskor a régebbi (még folyamatban lévő) request eredménye ne kerüljön be a library listába és ne duplikálódjanak az elemek

**Acceptance Criteria:**

- A kosár ikon badge-e nem villog oldal újratöltéskor és nincs hydration warning a konzolban
- Drag közben az áthelyezett gyakorlat-kártyán nincs aktív stepper vagy törlés gomb
- A kalóriaoldalra első belépéskor (vagy gyors interakciókkor) nem jön létre több párhuzamos `daily_log` insert kísérlet
- A gyakorlat library keresés gyors váltogatása esetén a lista mindig az aktuális keresési feltételt tükrözi, nincsenek duplikált elemek

**Dependencies:** Nincs

---

### Iteration B5 — Backend adat konzisztencia

**Status:** DONE

**Goal:** A backend lekérdezések és validációk konzisztenciájának biztosítása: egységes időzóna kezelés, ésszerű felső korlátok a profil mezőkön, és a dashboard részleges hibatűrése.

**Backend dependency:** Nincs

**Tasks:**

- [x] B5.1 UTC vs local time egységesítés: `src/lib/calories/queries.ts` `getWeeklyCalorieTrend` — `getUTCDate` lecserélése `getDate`-re (lokális időzóna), hogy konzisztens legyen a többi query-vel és ne térjen el az éjféli határon a megjelenített heti trend
- [x] B5.2 Profile validáció felső korlátok: `src/lib/profile/actions.ts` `readInt`/`readDecimal` helperek — felső korlátok hozzáadása: kor max 120, súly max 500 kg, magasság max 300 cm; ha a megadott érték túllépi a limitet, validációs hiba
- [x] B5.3 `getDashboardData` részleges hiba tolerancia: `src/lib/dashboard/queries.ts` — a `Promise.all` lecserélése `Promise.allSettled`-re, hogy egyetlen Supabase hívás átmeneti hibája ne üsse le a teljes dashboard betöltést; a hibás widgetek üres/default állapottal jelenjenek meg

**Acceptance Criteria:**

- A `getWeeklyCalorieTrend` ugyanazokat a napokat adja vissza, mint a többi query (lokális időzóna alapján), nincs eltérés éjfél környékén
- A profil mentésnél 121-es kor, 501 kg súly vagy 301 cm magasság elutasításra kerül értelmes hibaüzenettel
- Ha egyetlen dashboard query hibára fut (pl. weight_logs), a többi widget (kalória, edzés, AI) továbbra is megjelenik
- A dashboard sosem dob 500-as hibát egyetlen részleges adatlekérdezési hiba miatt

**Dependencies:** Nincs

---

## Összefoglaló — Iteráció Függőségi Gráf

```
B1 (Auth/Navigáció)    B2 (OpenRouter)    B3 (Stripe)    B4 (Frontend UX)    B5 (Backend konzisztencia)
     │                      │                  │                 │                       │
     └──────────────────────┴──────────────────┴─────────────────┴───────────────────────┘
                                  (Mind független, párhuzamosíthatók)
```

Minden bugfix iteráció független egymástól és az élő backend/frontend backlogtól is — bármilyen sorrendben végrehajtható. A javasolt prioritási sorrend (kritikusság alapján): **B1 → B3 → B2 → B5 → B4**.
