---
name: FitTrack Pro Deployment Configuration
description: Production deployment touchpoints (Vercel, Supabase, Stripe, OpenRouter) and per-route function timeouts
type: project
---

The deployment surface for FitTrack Pro spans four external services. Each one has a specific touchpoint that must be configured manually after a fresh project clone:

1. **Supabase** — auth provider settings (email + password, confirm-email toggle, Site URL, Redirect URLs), RLS verification, storage bucket policies on `avatars`. Migrations are SQL-driven (`supabase/migrations/`); auth + storage UI configuration is NOT.
2. **Stripe** — webhook endpoint registration is a POST-DEPLOY step because the URL is not known until Vercel emits a domain. Steps recorded in `docs/DEPLOYMENT.md` §11. The `STRIPE_WEBHOOK_SECRET` env var must be updated and the project redeployed after the webhook is created.
3. **OpenRouter** — single API key, free tier model `nvidia/nemotron-3-super-120b-a12b:free`.
4. **Vercel** — `vercel.json` at the repo root pins per-route `maxDuration`: `/api/analysis` and `/api/webhooks/stripe` at 30s (long-running external calls), `/api/checkout` at 15s, `/api/food-search` at 10s.

**Why:** the pre-existing default for Vercel functions is 10s, which is too short for the OpenRouter weekly analysis (timeout configured at 30s in code) and the Stripe webhook handler that has to call `listLineItems`. Without `vercel.json`, the function returns 504 before the route's own timeout fires.

**How to apply:** when adding a new external API integration, evaluate the worst-case latency. If it can exceed 10s, add a `functions.<route-path>.maxDuration` entry to `vercel.json`. Always document the env vars in `.env.example` AND `docs/DEPLOYMENT.md`. Never commit real secrets — `.env.local` is git-ignored.

**Demo user contract** (`scripts/seed-demo-user.ts`):
- Email `demo@fittrack.hu`, password `Demo1234!`
- Idempotent: reuses the auth user by email, wipes per-user rows on every run, never touches catalog tables (`exercises`, `products`)
- Requires `seed-exercises.ts` to have already run (depends on the catalog being populated)
- Generates 6 weeks of: daily_logs (with workout completion), food_entries (3 main meals + 0-2 snacks per day, fixed RNG seed), weight_logs (declining trend with noise), workout_exercise_logs (with progressive overload), one historical weekly_analyses row
