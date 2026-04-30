---
name: Backlog fájlok helye
description: A FitTrack Pro projekt két különálló backlog fájljának pontos helye és konvencióik
type: reference
---

A projekt KÉT backlog fájlt használ:

- **Backend backlog:** `C:\Users\almas\Desktop\egyetem\Szakdoga\docs\BACKEND_BACKLOG.md` (NAGYBETŰS fájlnév)
- **Frontend backlog:** `C:\Users\almas\Desktop\egyetem\Szakdoga\docs\FRONTEND_BACKLOG.md` (NAGYBETŰS fájlnév)

**FONTOS eltérés a system promptban szereplő útvonalaktól:** A system prompt `/docs/backlog.md` és `/docs/frontend-backlog.md` útvonalakat említ, de a tényleges fájlok `BACKEND_BACKLOG.md` és `FRONTEND_BACKLOG.md` (nagybetűs) néven léteznek a `docs/` mappában. Mindig az utóbbiakat használd.

**Konvenciók:**
- Backend iterációk: "Iteration 1" - "Iteration 14"
- Frontend iterációk: "Iteration F1" - "Iteration F11" (F prefix!)
- Task ID formátum backend: `1.1`, `1.2`, ...
- Task ID formátum frontend: `F1.1`, `F1.2`, ...
- Status: `TODO` / `IN PROGRESS` / `DONE`
- Mindkét fájl tartalmaz "Backlog Progress" táblát (Total/Completed/Remaining/Completion %)
- Frontend backlog tartalmaz egy "Backend ↔ Frontend Függőségek" táblát az iteráció lista végén
- Frontend backlog tartalmaz egy "Design Döntések Összefoglalója" táblát az elején
