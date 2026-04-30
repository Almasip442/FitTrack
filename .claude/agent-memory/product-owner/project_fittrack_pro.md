---
name: FitTrack Pro projekt
description: Magyar nyelvű fullstack fitness webalkalmazás (egyetemi szakdolgozat) — Next.js + Supabase + Stripe + OpenRouter AI
type: project
---

A FitTrack Pro egy magyar nyelvű fullstack fitness webalkalmazás, amely a Szakdoga (szakdolgozat) projekt része.

**Tech stack:**
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions) + Next.js API Routes
- Frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion + Recharts + dnd-kit + Zustand
- AI: OpenRouter API (heti elemzés)
- Fizetés: Stripe Checkout
- Külső adat: wger API (gyakorlatok), Open Food Facts API (ételek)

**Backlog struktúra:**
- Backend backlog: `/docs/BACKEND_BACKLOG.md` — 14 iteráció, 75 task összesen
- Frontend backlog: `/docs/FRONTEND_BACKLOG.md` — 11 iteráció (F1-F11), 77 task összesen
- Összesen: 152 task

**Backend iterációk:**
1. Projekt alapok + Supabase inicializálás
2. DB séma (core táblák)
3. RLS
4. Auth
5. Felhasználói profil CRUD
6. Gyakorlat-adatbázis seed (wger API)
7. Edzésterv CRUD
8. Gyakorlat keresés/szűrő
9. Kalóriakövetés (Open Food Facts)
10. Dashboard aggregáció
11. Testsúly napló
12. Heti AI elemzés (OpenRouter)
13. Webshop + Stripe
14. Integráció + Deployment

**Frontend iterációk:**
- F1: Design System & Layout Shell (SpaceX-inspirált sötét ipari, #111111/#780000/#404040, Barlow Condensed)
- F2: Auth oldalak
- F3: Onboarding & Profil
- F4: Dashboard widgetek
- F5: Gyakorlat böngésző
- F6: Drag & Drop edzéstervező (legnagyobb kockázat)
- F7: Kalóriakövetés UI
- F8: Fejlődés + AI overlay
- F9: Webshop
- F10: Landing page (wow-hatás, parallax)
- F11: Polish & Responsive audit

**Backend ↔ Frontend függőségek:**
| Frontend | Backend dependency |
|---|---|
| F1 | Backend I1 |
| F2 | Backend I4 |
| F3 | Backend I5 |
| F4 | Backend I10 |
| F5 | Backend I6 + I8 |
| F6 | Backend I7 |
| F7 | Backend I9 |
| F8 | Backend I11 + I12 |
| F9 | Backend I13 |
| F10 | Nincs (statikus) |
| F11 | Backend I14 |

**Why:** A backlog kétvonalas (backend + frontend párhuzamos), a függőségek kritikusak a párhuzamos fejlesztés koordinálásához.

**How to apply:** Iteráció kiválasztásnál mindig nézd meg a Backend ↔ Frontend függőségi táblát a frontend-backlog.md alján; F1 nem indítható Backend I1 nélkül; a többi frontend iteráció csak akkor indítható, ha a kapcsolódó backend iteráció DONE.
