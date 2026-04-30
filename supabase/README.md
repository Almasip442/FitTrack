# Supabase Setup

Ez a mappa tartalmazza a FitTrack Pro adatbázishoz tartozó SQL migration fájlokat.

## Migration futtatása (Supabase Dashboard)

1. Nyisd meg a Supabase Dashboard-ot: https://supabase.com/dashboard
2. Válaszd ki a projektedet
3. Menj a "SQL Editor" szekcióba
4. Másold be a `migrations/20260101000000_initial_schema.sql` tartalmát
5. Kattints a "Run" gombra

## Vagy Supabase CLI-vel

```bash
npx supabase db push
```

> A CLI használatához előzetesen szükséges a projekt linkelése:
> `npx supabase link --project-ref <your-project-ref>`

## Megjegyzések

- A Row Level Security (RLS) policy-k **NEM** kerülnek beállításra ebben a migrationban. Az RLS a Backend Iteration 3 hatókörébe tartozik.
- A migration létrehoz egy `handle_new_user` trigger funkciót is, amely automatikusan létrehoz egy `profiles` sort minden új `auth.users` regisztrációkor.
- A táblák létrehozási sorrendje fix a foreign key függőségek miatt — ne módosítsd a fájlt manuálisan.
