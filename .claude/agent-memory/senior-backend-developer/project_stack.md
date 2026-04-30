---
name: FitTrack Pro — Stack and Architecture
description: Core tech stack, key env vars, Supabase client patterns, and API integration notes for FitTrack Pro
type: project
---

## Stack
- Next.js 16.x (App Router, TypeScript, Tailwind CSS v4)
- Supabase (PostgreSQL + Auth + RLS + Storage) via @supabase/ssr
- shadcn/ui (new-york style, zinc base color)
- React 19

## Key file locations
- Browser Supabase client: `src/lib/supabase/client.ts` — uses `createBrowserClient<Database>`
- Server Supabase client: `src/lib/supabase/server.ts` — async, uses `cookies()` from `next/headers`
- DB types: `src/types/database.ts` — manual definition (Supabase CLI gen not yet possible pre-schema)
- shadcn components: `src/components/ui/`
- API routes go in: `src/app/api/`

## Required environment variables
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

## Route groups
- `(auth)` — login, register (public)
- `(protected)` — dashboard and future protected pages

## Fonts
Barlow + Barlow Condensed (next/font/google), CSS variables: --font-barlow, --font-barlow-condensed

## Why: The project directory is named "Szakdoga" (capital S) which caused create-next-app to fail with npm naming restrictions. Workaround: bootstrapped in a temp dir, then copied files over.

## How to apply: If re-running create-next-app is ever needed, use a temp lowercase directory and copy files over.
