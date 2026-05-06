# FitTrack Pro — Backend Projekt Backlog

## Scope Summary

Egy magyar nyelvű fullstack fitness webalkalmazás backend oldala. A backend a Supabase platformra épül (PostgreSQL, Auth, Storage, Edge Functions), Next.js API Route-okkal kiegészítve. A backlog 14 iterációban építi fel a teljes backend-et: adatbázis séma, RLS szabályok, autentikáció, gyakorlat-adatbázis import, edzéstervező CRUD, kalóriakövetés, dashboard aggregáció, AI elemzés, webshop és Stripe integráció.

---

## Backlog Progress

| Metric | Value |
|---|---|
| Total tasks | 86 |
| Completed tasks | 60 |
| Remaining tasks | 26 |
| Completion | 69.8% |

---

## Iterations

---

### Iteration 1 — Projekt Alapok és Supabase Inicializálás

**Status:** DONE

**Goal:** A Next.js projekt és a Supabase környezet felállítása, hogy minden későbbi iteráció stabil alapra építkezzen.

**Tasks:**

- [x] 1.1 Next.js projekt bootstrapelése TypeScript + Tailwind CSS + shadcn/ui konfigurációval
- [x] 1.2 Supabase projekt létrehozása (Dashboard-on vagy CLI-vel), connection string és API kulcsok mentése `.env.local`-ba:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
  OPENROUTER_API_KEY=sk-or-v1-...
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```
- [x] 1.3 Supabase kliens inicializálása: `src/lib/supabase/client.ts` (böngésző oldali) és `src/lib/supabase/server.ts` (szerver oldali, `@supabase/ssr` használatával)
- [x] 1.4 Mappastruktúra kialakítása:
  ```
  src/
    app/
      (auth)/login/page.tsx
      (auth)/register/page.tsx
      (protected)/dashboard/page.tsx
      api/
    lib/
      supabase/
    types/
    components/
  ```
- [x] 1.5 Alapvető TypeScript típusok definiálása (`src/types/database.ts`) — a Supabase CLI-vel generálható: `npx supabase gen types typescript`

**Acceptance Criteria:**

- `npm run dev` hiba nélkül elindul
- A Supabase kliens sikeresen csatlakozik (egy teszt query fut a szerveren)
- A `.env.local` fájl tartalmazza az összes szükséges környezeti változót
- A mappastruktúra a fenti sémát követi

**Dependencies:** Nincs

---

### Iteration 2 — Adatbázis Séma: Core Táblák

**Status:** DONE

**Goal:** A teljes adatbázis séma létrehozása Supabase-ben, RLS nélkül — a struktúra legyen kész, mielőtt bármi más épülne rá.

**Tasks:**

- [x] 2.1 `profiles` tábla létrehozása (a Supabase Auth `auth.users`-t kiegészítő tábla):
  ```sql
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('férfi', 'nő')),
    weight DECIMAL,
    height DECIMAL,
    goal TEXT CHECK (goal IN ('fogyás', 'izomnövelés', 'erőnövelés', 'egészség')),
    activity_level TEXT CHECK (activity_level IN ('ülő', 'mérsékelten_aktív', 'aktív', 'nagyon_aktív')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] 2.2 `exercises` tábla létrehozása
- [x] 2.3 Edzésterv táblák létrehozása: `workout_plans`, `workout_days` (beleértve `day_of_week INTEGER` mezőt — 0-6, nullable — a valós hétköznaphoz rendeléshez), `workout_day_exercises`
- [x] 2.4 Kalóriakövetés táblák létrehozása: `daily_logs`, `food_entries`
- [x] 2.5 `weight_logs` tábla létrehozása
- [x] 2.6 `weekly_analyses` tábla létrehozása
- [x] 2.7 Webshop táblák létrehozása: `products`, `orders`, `order_items`
- [x] 2.8 `workout_exercise_logs` tábla létrehozása (edzés közbeni részletes rögzítés):
  ```sql
  CREATE TABLE workout_exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    sets_completed INTEGER,
    reps_completed INTEGER[],
    weight_used DECIMAL[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] 2.9 Supabase Database Trigger: `profiles` sor automatikus létrehozása új user regisztrációkor:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```
- [x] 2.9 Indexek létrehozása a gyakran szűrt mezőkre:
  ```sql
  CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
  CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);
  CREATE INDEX idx_food_entries_log_id ON food_entries(daily_log_id);
  CREATE INDEX idx_exercises_category ON exercises(category);
  CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
  CREATE INDEX idx_orders_user_id ON orders(user_id);
  CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, date);
  CREATE INDEX idx_workout_days_day_of_week ON workout_days(plan_id, day_of_week);
  CREATE INDEX idx_workout_exercise_logs_daily_log ON workout_exercise_logs(daily_log_id);
  ```

**Acceptance Criteria:**

- Minden tábla létezik a Supabase Dashboard-on, a megfelelő oszlopokkal és típusokkal
- A foreign key kapcsolatok helyesek (CASCADE delete ahol szükséges)
- Új user regisztrációkor automatikusan létrejön egy `profiles` sor
- Az indexek létrejöttek a megfelelő oszlopokon
- A `npx supabase gen types typescript` parancs hiba nélkül generálja a TypeScript típusokat

**Dependencies:** Iteration 1

---

### Iteration 3 — Row Level Security (RLS)

**Status:** DONE

**Goal:** Minden tábla RLS-sel védett, hogy a felhasználók csak a saját adataikat láthassák és módosíthassák.

**Tasks:**

- [x] 3.1 RLS bekapcsolása minden táblán és policy-k létrehozása a user-specifikus táblákra:
  ```sql
  -- Példa: profiles
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
  ```
- [x] 3.2 Ugyanez a minta a következő táblákra: `workout_plans`, `workout_days` (join a `workout_plans`-on keresztül), `workout_day_exercises` (join a `workout_days` → `workout_plans`-on keresztül), `daily_logs`, `food_entries` (join a `daily_logs`-on keresztül), `weight_logs`, `weekly_analyses`, `orders`, `order_items` (join az `orders`-on keresztül), `workout_exercise_logs` (join a `daily_logs`-on keresztül)
- [x] 3.3 Publikus olvasási policy az `exercises` és `products` táblákra:
  ```sql
  ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Exercises are publicly readable"
    ON exercises FOR SELECT USING (true);
  ```
- [x] 3.4 RLS tesztelése: bejelentkezve csak a saját adatok jelennek meg; kijelentkezve a publikus táblák elérhetők, a privátok nem

**Acceptance Criteria:**

- Minden tábla RLS-sel védett
- Bejelentkezett user csak a saját `workout_plans`, `daily_logs`, `orders` stb. adatait látja
- Nem bejelentkezett user nem fér hozzá semmilyen user-specifikus adathoz
- Az `exercises` és `products` táblák publikusan olvashatók
- Egy user nem tudja módosítani más user adatait

**Dependencies:** Iteration 2

---

### Iteration 4 — Autentikáció

**Status:** DONE

**Goal:** Teljes auth flow: regisztráció, bejelentkezés, kijelentkezés, session kezelés, protected routes.

**Tasks:**

- [x] 4.1 Supabase Auth konfigurálása: email+jelszó provider engedélyezése a Supabase Dashboard-on
- [x] 4.2 Auth helper funkciók implementálása (`src/lib/supabase/auth.ts`): `signUp`, `signIn`, `signOut`, `getSession`, `getUser`
- [x] 4.3 Next.js Middleware implementálása (`src/middleware.ts`) a protected route-ok védelméhez — ha nincs session, redirect `/login`-ra
- [x] 4.4 Regisztrációs oldal: form → `signUp()` hívás → sikeres regisztráció után redirect a profil onboarding-ra
- [x] 4.5 Bejelentkezési oldal: form → `signIn()` hívás → sikeres login után redirect a dashboard-ra
- [x] 4.6 Kijelentkezés gomb a layoutban → `signOut()` → redirect `/login`-ra

**Acceptance Criteria:**

- Új felhasználó tud regisztrálni email + jelszóval
- Regisztráció után automatikusan létrejön a `profiles` sor (Iteration 2 triggere)
- Bejelentkezés után a session megmarad page refresh után is
- A `/dashboard` és minden protected route redirect-el `/login`-ra, ha nincs session
- Kijelentkezés törli a session-t

**Dependencies:** Iteration 3

---

### Iteration 5 — Felhasználói Profil CRUD

**Status:** DONE

**Goal:** A felhasználó ki tudja tölteni és módosítani tudja a profilját, ami a kalóriacél számításához szükséges.

**Tasks:**

- [x] 5.1 Profil lekérdezés: a bejelentkezett user `profiles` sorának betöltése Server Component-ből
- [x] 5.2 Profil szerkesztő form: név, kor, nem, súly, magasság, cél, aktivitási szint
- [x] 5.3 Profil mentés: Server Action vagy API Route a `profiles` tábla UPDATE-eléséhez
- [x] 5.4 Profilkép feltöltés: Supabase Storage bucket létrehozása (`avatars`), kép feltöltés és URL mentése a `profiles.avatar_url`-be
- [x] 5.5 Onboarding flow: regisztráció után a user a profil kitöltő oldalra kerül, és addig nem tud továbblépni a dashboardra, amíg a kötelező mezők (nem, súly, magasság, cél) nincsenek kitöltve
- [x] 5.6 Kalóriacél számítás utility (`src/lib/calories.ts`): Mifflin-St Jeor képlet implementálása a profil adatok alapján:
  ```
  BMR (férfi) = 10 × súly(kg) + 6.25 × magasság(cm) − 5 × kor + 5
  BMR (nő)    = 10 × súly(kg) + 6.25 × magasság(cm) − 5 × kor − 161
  TDEE = BMR × aktivitási szorzó
  Kalóriacél = TDEE + cél szerinti módosítás (fogyás: -500, izomnövelés: +300, stb.)
  ```

**Acceptance Criteria:**

- A profil oldal betölti és megjeleníti az aktuális profil adatokat
- Módosítás és mentés után a profil frissül az adatbázisban
- Profilkép feltölthető és megjelenik
- A kalóriacél kiszámolódik a profil adatok alapján
- Az onboarding flow megakadályozza, hogy a user üres profillal navigáljon a dashboardra

**Dependencies:** Iteration 4

---

### Iteration 6 — Gyakorlat-adatbázis Import (Seed)

**Status:** DONE

**Goal:** A wger API-ból 150-200 gyakorlat importálása a Supabase `exercises` táblába, magyar fordítással és képekkel.

**Tasks:**

- [x] 6.1 Seed script létrehozása (`scripts/seed-exercises.ts`): wger API végpontok hívása:
  - `GET https://wger.de/api/v2/exerciseinfo/?format=json&limit=100&offset=0&language=2` (angol)
  - `GET https://wger.de/api/v2/muscle/?format=json`
  - `GET https://wger.de/api/v2/equipment/?format=json`
  - `GET https://wger.de/api/v2/exercisecategory/?format=json`
- [x] 6.2 Gyakorlatok szűrése: csak `status=2` (jóváhagyott), és a fő izomcsoportok lefedése (mellkas, hát, váll, bicepsz, tricepsz, láb/quad, láb/hamstring, vádli, core)
- [x] 6.3 Magyar fordítás: ellenőrizni, hogy a wger-ben van-e magyar fordítás (`language=14`). Ahol nincs, OpenRouter API hívással lefordítani a nevet és leírást
- [x] 6.4 Nehézségi szint (difficulty) meghatározása: a seed script során a Claude Code agent klasszifikálja a gyakorlatokat (kezdő/haladó/profi) a gyakorlat jellemzői (mozgás komplexitása, szükséges eszközök, izomcsoportok száma) alapján
- [x] 6.5 Képek letöltése és feltöltése Supabase Storage-ba (`exercises` bucket)
- [x] 6.6 Az összes adat beszúrása az `exercises` táblába a Supabase klienssel
- [x] 6.7 A seed script futtathatóvá tétele: `npx tsx scripts/seed-exercises.ts`

**Acceptance Criteria:**

- A seed script hiba nélkül lefut
- Az `exercises` tábla 150-200 gyakorlatot tartalmaz
- Minden gyakorlatnak van magyar neve és leírása
- Minden gyakorlathoz tartozik legalább egy kép a Supabase Storage-ban
- A gyakorlatok lefedik az összes fő izomcsoportot
- A script újrafuttatható (UPSERT, nem duplikál)

**Dependencies:** Iteration 3

---

### Iteration 7 — Edzésterv CRUD (Backend)

**Status:** DONE

**Goal:** Az edzéstervek teljes backend logikája: terv létrehozás, napok kezelése, gyakorlatok hozzárendelése, sorrend kezelés.

**Tasks:**

- [x] 7.1 Edzésterv létrehozás: `INSERT INTO workout_plans` — a user új tervet hoz létre névvel
- [x] 7.2 Edzésterv listázás: az aktuális user összes tervének lekérdezése, az aktív terv megjelölésével
- [x] 7.3 Edzésterv betöltés: egy terv teljes lekérdezése a napokkal és gyakorlatokkal együtt (nested query vagy join):
  ```sql
  SELECT wp.*, 
    (SELECT json_agg(
      json_build_object(
        'id', wd.id,
        'day_name', wd.day_name,
        'day_order', wd.day_order,
        'exercises', (
          SELECT json_agg(
            json_build_object(
              'id', wde.id,
              'exercise', row_to_json(e),
              'sets', wde.sets,
              'reps', wde.reps,
              'rest_seconds', wde.rest_seconds,
              'exercise_order', wde.exercise_order,
              'notes', wde.notes
            ) ORDER BY wde.exercise_order
          )
          FROM workout_day_exercises wde
          JOIN exercises e ON e.id = wde.exercise_id
          WHERE wde.workout_day_id = wd.id
        )
      ) ORDER BY wd.day_order
    ) FROM workout_days wd WHERE wd.plan_id = wp.id) AS days
  FROM workout_plans wp
  WHERE wp.id = $1 AND wp.user_id = auth.uid();
  ```
- [x] 7.4 Nap hozzáadás/törlés/átnevezés: `INSERT/DELETE/UPDATE` a `workout_days` táblán, beleértve a `day_of_week` mező beállítását (melyik valós hétköznapra esik az edzésnap)
- [x] 7.5 Gyakorlat hozzáadás naphoz: `INSERT INTO workout_day_exercises`
- [x] 7.6 Gyakorlat eltávolítása napból: `DELETE FROM workout_day_exercises`
- [x] 7.7 Sorrend frissítés (drag & drop után): batch `UPDATE` az `exercise_order` mezőn — egy API hívásban több sor frissítése:
  ```typescript
  // Példa: a kliens elküldi az új sorrendet
  const updates = [
    { id: 'uuid-1', exercise_order: 0 },
    { id: 'uuid-2', exercise_order: 1 },
    { id: 'uuid-3', exercise_order: 2 },
  ];
  // Supabase-ben: upsert vagy RPC function
  ```
- [x] 7.8 Aktív terv beállítása: `UPDATE workout_plans SET is_active = true WHERE id = $1` + az összes többi tervet `is_active = false`-ra állítani (egyetlen tranzakcióban)
- [x] 7.9 Edzésterv törlése: CASCADE törli a napokat és a hozzárendelt gyakorlatokat is
- [x] 7.10 `workout_exercise_logs` CRUD: edzés közbeni részletes rögzítés — melyik gyakorlatot végezte el a user, hány szettet, szettenkénti ismétlés (integer tömb), szettenkénti súly (decimal tömb), megjegyzés. UPSERT logika (daily_log_id + exercise_id párosra). Ez teszi lehetővé, hogy az AI elemzés izomcsoport-szintű fejlődést értékeljen.

**Acceptance Criteria:**

- Új edzésterv létrehozható
- A terv betöltésekor a napok és gyakorlatok is megjelennek, helyes sorrendben
- Gyakorlat hozzáadható és eltávolítható egy napból
- A sorrend frissítés után az új sorrend megmarad
- Egy usernél egyszerre csak egy terv lehet aktív
- Terv törlése törli a napokat és gyakorlatokat is
- Az edzésnapokhoz hozzárendelhető a valós hétköznap (`day_of_week`)
- Az edzés közbeni részletes rögzítés (szettek, ismétlések, súlyok) működik a `workout_exercise_logs` táblán

**Dependencies:** Iteration 6

---

### Iteration 8 — Gyakorlat-kereső és Szűrő (Backend)

**Status:** DONE

**Goal:** A drag & drop tervező számára szükséges gyakorlat-keresés és szűrés optimalizálása.

**Tasks:**

- [x] 8.1 Full-text search implementálása az `exercises` táblán magyar névhez:
  ```sql
  ALTER TABLE exercises ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('hungarian', coalesce(name_hu, '') || ' ' || coalesce(description_hu, ''))
    ) STORED;

  CREATE INDEX idx_exercises_search ON exercises USING GIN (search_vector);
  ```
- [x] 8.2 Szűrő API: gyakorlatok lekérdezése kategória (`category`), izomcsoport (`muscle_group`), eszköz (`equipment`), nehézség (`difficulty`) és szabad szöveges keresés kombinációjával
- [x] 8.3 Pagination: `LIMIT/OFFSET` vagy cursor-based pagination a gyakorlat listához
- [x] 8.4 Gyakorlat részletek lekérdezése: egyetlen gyakorlat összes adatával és képeivel

**Acceptance Criteria:**

- Szabad szöveges keresés működik magyarul (pl. "fekvenyomás" megtalálja a releváns gyakorlatokat)
- Szűrők kombinálhatók (pl. "mellkas" kategória + "súlyzó" eszköz)
- A válaszidő 200ms alatt marad 200 gyakorlatnál
- Pagination működik

**Dependencies:** Iteration 6

---

### Iteration 9 — Kalóriakövetés (Backend)

**Status:** DONE

**Goal:** A napi étkezések rögzítésének és lekérdezésének backend logikája, Open Food Facts API integrációval.

**Tasks:**

- [x] 9.1 `daily_logs` CRUD: napi napló létrehozása/lekérdezése — egy napra egy napló usernél (UPSERT logika `user_id + date` párosra)
- [x] 9.2 `food_entries` CRUD: étel hozzáadás/módosítás/törlés egy naplóhoz
- [x] 9.3 Open Food Facts API proxy: Next.js API Route (`/api/food-search`) ami a kliens kérését továbbítja az Open Food Facts felé, és a választ normalizálja:
  ```typescript
  // GET /api/food-search?q=túró
  // → fetch('https://hu.openfoodfacts.org/cgi/search.pl?search_terms=túró&json=true&page_size=10')
  // → normalizált válasz: [{ name, calories, protein, carbs, fat, serving_size }]
  ```
- [x] 9.4 Napi összesítő lekérdezés: egy adott nap összes kalóriája és makrói aggregálva:
  ```sql
  SELECT
    SUM(calories) as total_calories,
    SUM(protein) as total_protein,
    SUM(carbs) as total_carbs,
    SUM(fat) as total_fat
  FROM food_entries
  WHERE daily_log_id = $1;
  ```
- [x] 9.5 Heti trend lekérdezés: az utolsó 7 (vagy N) nap napi kalória összesítése:
  ```sql
  SELECT dl.date, COALESCE(SUM(fe.calories), 0) as total_calories
  FROM daily_logs dl
  LEFT JOIN food_entries fe ON fe.daily_log_id = dl.id
  WHERE dl.user_id = auth.uid()
    AND dl.date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY dl.date
  ORDER BY dl.date;
  ```

**Acceptance Criteria:**

- Étel hozzáadható egy adott naphoz, és a napi összesítő helyesen számol
- Az Open Food Facts keresés visszaad normalizált eredményeket magyar terméknevekkel
- A heti trend lekérdezés helyesen aggregálja a napi adatokat
- Egy napra csak egy napló létezik userenként

**Dependencies:** Iteration 5

---

### Iteration 10 — Dashboard Adataggregáció

**Status:** TODO

**Goal:** A dashboard widgetekhez szükséges összes adat egyetlen hatékony lekérdezéssel vagy néhány párhuzamos lekérdezéssel elérhető.

**Tasks:**

- [ ] 10.1 Aznapi edzésterv lekérdezés: az aktív terv mai napjának gyakorlatai a `workout_days.day_of_week` mező alapján (`EXTRACT(DOW FROM CURRENT_DATE)`), és hogy a `daily_logs.workout_completed` igaz-e. Ha nincs az aktuális hétköznaphoz rendelt edzésnap → "Pihenőnap" / "Ma nincs edzés" állapot.
- [ ] 10.2 Mai kalóriamérleg: a profil alapján számolt kalóriacél vs. a mai `food_entries` összege
- [ ] 10.3 Heti aktivitás: az utolsó 7 nap `daily_logs.workout_completed` értékei
- [ ] 10.4 Testsúly trend: az utolsó 30 nap `weight_logs` adatai
- [ ] 10.5 Supabase RPC function létrehozása, ami egyetlen hívással visszaadja az összes dashboard adatot:
  ```sql
  CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID)
  RETURNS JSON AS $$
  DECLARE
    result JSON;
  BEGIN
    SELECT json_build_object(
      'today_calories', (...),
      'calorie_target', (...),
      'weekly_workouts', (...),
      'weight_trend', (...),
      'today_workout', (...)
    ) INTO result;
    RETURN result;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

**Acceptance Criteria:**

- A dashboard egyetlen RPC hívással (vagy max 3-4 párhuzamos query-vel) megkapja az összes szükséges adatot
- Az aznapi edzésterv helyesen jelenik meg az aktív terv és a hét napja alapján
- A kalóriamérleg helyesen számol (cél vs. bevitt)
- A válaszidő 500ms alatt marad

**Dependencies:** Iteration 7, Iteration 9

---

### Iteration 11 — Testsúly Napló

**Status:** DONE

**Goal:** A testsúly rögzítésének és trend megjelenítésének backend logikája.

**Tasks:**

- [x] 11.1 `weight_logs` CRUD: súly rögzítése adott napra (UPSERT — egy napra egy bejegyzés)
- [x] 11.2 Trend lekérdezés: az utolsó N nap súlyadatai vonaldiagramhoz
- [x] 11.3 Súlyváltozás kiszámítása: aktuális hét átlaga vs. előző hét átlaga

**Acceptance Criteria:**

- Napi súly rögzíthető és módosítható
- A trend lekérdezés helyes adatokat ad vissza
- Egy napra csak egy bejegyzés létezik (UPSERT)

**Dependencies:** Iteration 5

---

### Iteration 12 — Heti AI Elemzés

**Status:** TODO

**Goal:** Az OpenRouter API-n keresztül heti AI elemzés generálása a felhasználó adataiból.

**Tasks:**

- [ ] 12.1 Next.js API Route létrehozása (`/api/analysis`): ez az endpoint fogadja a kliens kérését, összegyűjti a heti adatokat, és továbbítja az OpenRouter-nek
- [ ] 12.2 Heti adatgyűjtő query: az elmúlt 7 nap összes releváns adatának összegyűjtése (elvégzett edzések, kalória átlag, súlyváltozás, edzés részletek — beleértve a `workout_exercise_logs` szettenkénti ismétlés/súly adatait izomcsoport-szintű elemzéshez)
- [ ] 12.3 AI prompt összeállítás:
  ```typescript
  const systemPrompt = `Személyi edző és táplálkozási tanácsadó vagy. 
  Magyarul válaszolj. Légy motiváló, de realista.
  Válaszolj KIZÁRÓLAG az alábbi JSON formátumban:
  {
    "summary": "2-3 mondatos összefoglaló az elmúlt hétről",
    "suggestions": ["javaslat 1", "javaslat 2", "javaslat 3"],
    "rating": 1-10
  }`;

  const userPrompt = `Felhasználó adatai:
  - Cél: ${profile.goal}
  - Tervezett edzések: ${plannedWorkouts}/hét
  - Elvégzett edzések: ${completedWorkouts}/hét
  - Kalóriacél: ${calorieTarget} kcal/nap
  - Átlagos bevitel: ${avgCalories} kcal/nap
  - Testsúlyváltozás: ${weightChange} kg`;
  ```
- [ ] 12.4 OpenRouter API hívás implementálása:
  ```typescript
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  ```
- [ ] 12.5 AI válasz parseolása és mentése a `weekly_analyses` táblába
- [ ] 12.6 Rate limiting: max 1 elemzés / hét / felhasználó — ellenőrzés a `weekly_analyses` tábla alapján (`week_start` az aktuális hétre már létezik-e)
- [ ] 12.7 Korábbi elemzések lekérdezése: az utolsó N hét elemzéseinek listázása

**Acceptance Criteria:**

- Az API Route sikeresen hívja az OpenRouter-t és JSON választ kap
- Az AI elemzés elmentődik az adatbázisba
- Egy héten belül nem lehet újra elemzést generálni (rate limit)
- A korábbi elemzések visszakereshetők
- Ha az OpenRouter nem elérhető, a kliens értelmes hibaüzenetet kap

**Dependencies:** Iteration 9, Iteration 11

---

### Iteration 13 — Webshop Backend

**Status:** TODO

**Goal:** A mock webshop termékkatalógusa, kosár logikája és Stripe Checkout integráció.

**Tasks:**

- [ ] 13.1 Termék seed script (`scripts/seed-products.ts`): 20-30 mock táplálékkiegészítő termék feltöltése az adatbázisba (protein porok, kreatin, vitaminok, aminosavak) — képekkel a Supabase Storage-ban
- [ ] 13.2 Terméklista lekérdezés: szűrés kategória és ár tartomány szerint, rendezés
- [ ] 13.3 Termék részletek lekérdezés: egyetlen termék összes adatával
- [ ] 13.4 Stripe Checkout Session létrehozás — Next.js API Route (`/api/checkout`):
  ```typescript
  import Stripe from 'stripe';
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // POST /api/checkout
  // Body: { items: [{ product_id, quantity }] }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'huf',
        product_data: { name: item.name },
        unit_amount: item.price, // HUF-ban, fillér nélkül
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/cancel`,
    metadata: { user_id: user.id },
  });
  ```
- [ ] 13.5 Stripe Webhook handler — Next.js API Route (`/api/webhooks/stripe`):
  ```typescript
  // POST /api/webhooks/stripe
  // Stripe 'checkout.session.completed' event esetén:
  // 1. Order létrehozása a DB-ben (status: 'paid')
  // 2. Order items létrehozása
  // 3. Készlet csökkentése (opcionális mock-nál)
  ```
- [ ] 13.6 Rendelés státusz lekérdezés: a felhasználó saját rendeléseinek listázása
- [ ] 13.7 Stripe environment változók ellenőrzése: az `.env.local`-ban (Iteration 1-ben definiált) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` meglétének ellenőrzése

**Acceptance Criteria:**

- A termékkatalógus szűrhető és rendezhető
- A Stripe Checkout Session sikeresen létrejön és átirányít a Stripe fizetési oldalra
- A `4242 4242 4242 4242` teszt kártyával sikeres fizetés után a webhook handler létrehozza az ordert az adatbázisban
- A felhasználó saját rendelései lekérdezhetők
- Érvénytelen vagy hiányzó termék esetén a checkout hibát ad

**Dependencies:** Iteration 5

---

### Iteration 14 — Integráció, Tesztelés, Deployment

**Status:** TODO

**Goal:** Az összes modul végső integrációja, deployment a Vercel + Supabase production környezetbe.

**Tasks:**

- [ ] 14.1 End-to-end flow tesztelés: regisztráció → profil → edzésterv → kalória → dashboard → AI elemzés → webshop checkout — az egész lánc működik
- [ ] 14.2 Error handling audit: minden API Route és Server Action megfelelő hibakezeléssel rendelkezik (try-catch, értelmes hibaüzenetek, HTTP státusz kódok)
- [ ] 14.3 Környezeti változók beállítása a Vercel Dashboard-on (Supabase URL/keys, Stripe keys, OpenRouter key)
- [ ] 14.4 Supabase projekt beállítása production módra: email confirmation bekapcsolása, rate limit beállítások
- [ ] 14.5 Vercel deployment: GitHub repo csatlakoztatás, automatikus deploy `main` branch push-ra
- [ ] 14.6 Demo user létrehozása realisztikus adatokkal: 4-6 hét edzés history, kalória naplók, testsúly adatok, korábbi AI elemzések — hogy a védésen legyen mit bemutatni
- [ ] 14.7 Supabase Database backup beállítása

**Acceptance Criteria:**

- Az alkalmazás elérhető a Vercel URL-en, minden funkció működik
- A demo user fiókjával bejelentkezve az összes modul bemutatható
- Nincs unhandled error a konzolban a teljes user flow során
- A Stripe webhook működik a production környezetben
- Az OpenRouter API hívások sikeresen futnak

**Dependencies:** Iteration 1-13 (összes)

---

## Összefoglaló — Iteráció Függőségi Gráf

```
Iteration 1 (Projekt alapok)
    │
    ▼
Iteration 2 (DB séma)
    │
    ▼
Iteration 3 (RLS)
    │
    ├──────────────────────┐
    ▼                      ▼
Iteration 4 (Auth)     Iteration 6 (Gyakorlat seed)
    │                      │
    ▼                      ▼
Iteration 5 (Profil)   Iteration 8 (Keresés/szűrő)
    │                      │
    ├────────┬─────────────┤
    ▼        ▼             ▼
Iter 9    Iter 11       Iteration 7 (Edzésterv CRUD)
(Kalória) (Testsúly)       │
    │        │             │
    ├────────┤             │
    ▼        ▼             │
Iteration 12 (AI elemzés) │
    │                      │
    │        ┌─────────────┘
    ▼        ▼
Iteration 10 (Dashboard aggregáció)
    │
    ▼
Iteration 13 (Webshop + Stripe)
    │
    ▼
Iteration 14 (Integráció + Deployment)
```
