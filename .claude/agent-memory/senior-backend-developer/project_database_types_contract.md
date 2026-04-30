---
name: FitTrack database.ts type contract
description: Each table entry in src/types/database.ts must include Relationships: [] for postgrest-js writes to type correctly
type: project
---

`src/types/database.ts` defines the manual `Database` type used as the generic for `createServerClient<Database>` / `createBrowserClient<Database>`. With `@supabase/postgrest-js` 1.x (bundled by `@supabase/supabase-js` 2.105+) the `GenericTable` shape REQUIRES a `Relationships: GenericRelationship[]` field on every table entry alongside `Row` / `Insert` / `Update`.

**Why:** Without `Relationships`, the schema fails to satisfy `GenericSchema`, and every `.update(...)` / `.insert(...)` call on a typed client narrows its argument to `never`, producing `TS2345: Argument of type '...' is not assignable to parameter of type 'never'`. Reads (`.select()`) still work, which is why the issue only surfaces once write code is added (Iteration 5 was the first to UPDATE a table from typed code).

**How to apply:** When adding a new table to `src/types/database.ts`, append `Relationships: []` after the `Update` block (use `[]` until FK metadata is actually consumed somewhere — Supabase CLI generation will fill it in later). When regenerating via `npx supabase gen types typescript`, the CLI emits this field automatically.
