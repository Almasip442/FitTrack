# MI-használati napló

A napló a dolgozat és a projekt fejlesztése során használt MI-eszközök lényeges feladatait, döntéseit és ellenőrzéseit rögzíti. Nem teljes beszélgetésarchívum. Minden bejegyzést a hallgató ellenőrizzen, egészítsen ki, és csak a saját munkájának megfelelően hagyjon benne.

| Dátum | Eszköz | Feladat | MI-javaslat felhasználása | Emberi ellenőrzés / saját döntés |
|---|---|---|---|---|
| 2026-10-22 | OpenAI Codex | A szakdolgozat első tartalmi munkaváltozata, a bemutató- és tesztjegyzőkönyv, valamint a meglévő projekt- és tesztadatok összefoglalása. | A szöveg szerkeszthető kiinduló változatként készült; nem végleges tudományos állításként vagy tényleges felhasználói teszteredményként kezelendő. | A forráskód, a felhasználó által közölt teszteredmények és a hivatkozások alapján ellenőrizve; a kari követelményekhez és a saját megvalósításhoz a hallgatónak kell véglegesítenie. |
| 2026-10-22 | OpenAI Codex | A témavezető félévi követelményeinek beépítése a fejlesztési ütemtervbe és a dokumentációs ellenőrzőlistába. | Az e-mailben kapott határidők és elvárások strukturált teendőkké rendezve. | A forrás a hallgató által bemásolt témavezetői tájékoztató; a PDF mintadolgozat tartalma nem volt elérhető ehhez az ellenőrzéshez. |
| 2026-10-22 | OpenAI Codex (GPT-6) | A kari formai követelmények és a dolgozat munkaváltozatának összevetése; az architektúraábra és hivatkozásainak javítása; függőségbiztonsági audit. | A 3.1. ábra fejezet szerinti számozást, középre rendezést és szövegközi hivatkozást kapott; a saját szoftverforrásra [8] hivatkozás került. A lockfile nem törő frissítései alkalmazva; a `shadcn` buildeszköz fejlesztői függőségként szerepel. | `npm ci`, lint, négy teszt, build és `npm audit --omit=dev` sikeres. A teljes auditban 9 magas súlyosságú fejlesztői függőségi jelzés maradt; a javítás major verzióváltást igényelne, ezért nem lett `--force` futtatva. A hallgatónak ellenőriznie kell a szöveg saját megvalósítással való egyezését és a végleges Word-tördelést. |

## A további bejegyzésekhez rögzítendő

- MI-eszköz és modell/szolgáltatás, amennyiben ismert.
- A feladat és az érintett fájlok vagy fejezetek.
- A javaslatból mi került át, mit módosított vagy vetett el a hallgató, és miért.
- Milyen automatikus vagy kézi ellenőrzés történt; az eredmény és a fennmaradó bizonytalanság.
- Mi volt a hallgató saját tervezési, implementációs és értékelési döntése.

Ne kerüljön a naplóba API-kulcs, jelszó, hozzáférési token vagy más titok. Az alkalmazásba épített heti AI-elemzés értékelését külön kell kezelni a fejlesztés közbeni MI-használattól.
