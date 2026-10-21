# Október 23-i bemutató és mérési jegyzőkönyv

**Projekt:** FitTrack Pro  
**Bemutató tervezett dátuma:** 2026. október 23.  
**Tesztkörnyezet:** helyi Next.js fejlesztői szerver + Supabase demó felhasználó  
**Fontos:** csak a `demo@fittrack.hu` fiók seedelhető újra. A seed script törli ennek a fióknak a naplóit, terveit és heti elemzéseit.

## Előkészítés

- [ ] `npm ci` sikeresen lefut tiszta klónban vagy az aktuális telepített környezeten.
- [ ] A Supabase-migrációk alkalmazva vannak, különösen a skip és heti összehasonlító migráció.
- [ ] `.env.local` helyben megvan; titkos érték nem kerül képernyőképre, repóba vagy dolgozatba.
- [ ] `npm run seed:demo-user` sikeresen lefutott. Elvárt heti értékek: [README.md](../../README.md).
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` sikeres.
- [ ] Böngészőablak, betűméret, nagyítás és bejelentkezési állapot ellenőrizve.
- [ ] Témavezetőnek szánt első dolgozatrész és a heti munkaidő-összesítés előkészítve.

## Bemutató forgatókönyv (kb. 6–8 perc)

### 1. A probléma és a cél (1 perc)

Röviden ismertesd: a projekt a személyes cél, az edzésnapló, az étkezési napló és a testsúlyadatok összekapcsolásával ad heti visszajelzést. Hangsúlyozd, hogy az AI nem önálló igazságforrás; az összehasonlítható alaperedmény a mérhető adatokból készült szabályalapú összesítés.

### 2. Részletes edzésnapló (2 perc)

1. Nyisd meg a demo terv egyik edzésnapját, majd az edzésnapló dialógust.
2. Mutasd meg a gyakorlatonként előtöltött sorozatokat, ismétléseket és súlymezőket.
3. Adj hozzá egy extra sorozatot; egy másik gyakorlatot jelölj kihagyottnak.
4. Mentsd a naplót, majd nyisd meg újra vagy töltsd újra az oldalt.
5. Ellenőrizd, hogy mentett súlyok/ismétlések visszatöltődtek, a kihagyott gyakorlat külön állapotban maradt, és nem növeli az elvégzett volument.

### 3. Heti választó és kézi számítás (2 perc)

1. Nyisd meg a `/progress` oldalt, válaszd a **2026. október 12–18.** hetet.
2. Mutasd meg egymás mellett a kiválasztott és az azt megelőző hetet.
3. Ismertesd az ellenőrző értékeket: 3/4 és 2/4 edzés; 6/7 és 4/7 étkezési nap; 2150 és 2050 kcal átlag; 14 400 és 9000 kg volumen; 81,7 és 82,2 kg testsúlyátlag.
4. Magyarázd el a hiányzó adatok kezelését: az üres nap nem nulla kalória, a heti átlag csak naplózott napokra oszlik.
5. Ha másik hétre váltasz, a kiválasztott hét kezdőnapja hétfő, és a szomszédos hetet is mutatja.

### 4. Szabályalapú és AI-elemzés (1–2 perc)

1. Nyisd meg a korábbi elemzések egyikét, és azonosítsd, hogy mintaadatból készült-e.
2. Az AI működésének bemutatásához a heti CTA-val a még nem elemzett aktuális hétre készíts elemzést. Ez API-hívás, ezért a hálózati elérhetőség és OpenRouter-kulcs szükséges.
3. Hasonlítsd össze a szabályalapú eredményt és az AI magyarázatát. Mutass rá a konkrét heti számokra, lefedettségi figyelmeztetésre és biztonsági jelzésre.
4. A fallbackot csak akkor mutasd be, ha külön előkészített tesztkörnyezetben, hiányzó/érvénytelen modellkulccsal ellenőrizted. A normál `.env.local`-t ne módosítsd mentés nélkül, és ne mutass titkos értékeket.

## Mérési / elfogadási táblázat

| Azonosító | Ellenőrzés | Elvárt eredmény | Eredmény / megjegyzés |
|---|---|---|---|
| T-01 | Súly és ismétlésszám mentése | Újranyitás után a mentett értékek látszanak | [a felhasználó korábbi kézi próbán mentést és újratöltés utáni visszatöltést igazolt; bemutató előtt ismételd meg] |
| T-02 | Extra sorozat mentése | A hozzáadott sorozat visszatöltődik | [a felhasználó korábbi kézi próbán új szett hozzáadását és mentését igazolta; bemutató előtt ismételd meg] |
| T-03 | Gyakorlat kihagyása | Kihagyott állapot látszik; a gyakorlat nem számít bele a naplózott volumenbe | [a kihagyás látható állapotát a felhasználó igazolta; a volumenből való kizárást a bemutatón még ellenőrizd] |
| T-04 | 2026-10-12-i hét | 3/4 edzés, 6/7 étkezési nap, 2150 kcal, 14 400 kg, 81,7 kg | [a megosztott képernyőképen megfigyelve; bemutató előtt ismét ellenőrizendő] |
| T-05 | 2026-10-05-i hét | 2/4 edzés, 4/7 étkezési nap, 2050 kcal, 9000 kg, 82,2 kg | [a megosztott képernyőképen megfigyelve; bemutató előtt ismét ellenőrizendő] |
| T-06 | Hiányos napló | Üres étkezési nap nem csökkenti nullával az átlagot; lefedettség látható | [kitöltendő] |
| T-07 | AI sikeres válasza | Strukturált mezők és magyar javaslatok; szabályalapú rész is megmarad | [a felhasználó korábban működő jelentést igazolt; új demo héten ismételd meg és ments képernyőképet] |
| T-08 | AI fallback | Szolgáltatáshiba esetén szabályalapú értékelés marad látható és az állapot jelölt | [külön tesztkörnyezetben kitöltendő] |

## Képernyőképes bizonyítékok

A következő három képet a projekt `docs/thesis/figures/` könyvtárába mentettük a felhasználó által megosztott felvételekből:

1. `heti-attekintes.png` — a hétválasztó, az összehasonlított teszthetek és az összesített mutatók.
2. `edzesnaplo-szerkesztes.png` — szerkeszthető sorozatok, ismétlések, súlyok, extra sorozat.
3. `edzesnaplo-kihagyas.png` — kihagyott gyakorlatok és az edzésnapló mentésére szolgáló felület.

A bemutató előtt még készítendő: **AI-összehasonlító panel képernyőképe**, amelyen olvasható a szabályalapú eredmény, az AI-állapot és a biztonsági figyelmeztetés. Minden képhez rögzítsd a teszthét dátumát; demo adatok esetén ezt a dolgozat képaláírásában is tüntesd fel.

## Témavezetőnek küldendő státusz

- GitHub repó / commit: [commit és link csak feltöltés után tölthető ki]
- Tiszta telepítés: `npm ci` — [dátum, Node-verzió, eredmény]
- Ellenőrzések: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` — [eredmény]
- Dolgozat első változatának állapota: `SZD2_DOLGOZAT_ELSO_VALTOZAT.md` — [áttekintve / javítás alatt]
- Heti időráfordítás: csak a ténylegesen mért időket írd be.

| Dátum | Feladat | Tényleges idő (óra) | Eredmény / bizonyíték |
|---|---|---:|---|
| 2026-10-__ | Heti összesítő, teszthét seedelése és manuális ellenőrzése | __ | __ |
| 2026-10-__ | Edzésnapló kézi tesztje és képernyőképek | __ | __ |
| 2026-10-__ | Dolgozat első öt oldalának megírása | __ | __ |
| 2026-10-__ | AI összehasonlítás és bemutatópróba | __ | __ |

> A táblázat üres időadatait Péter töltse ki a tényleges munkanapló alapján; becsült vagy kitalált óraszám nem kerülhet a témavezetőnek küldött beszámolóba.
