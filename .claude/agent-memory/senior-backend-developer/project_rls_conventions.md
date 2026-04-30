---
name: FitTrack RLS Policy Conventions
description: RLS pattern decisions made in I3 — direct vs EXISTS-join ownership, service-role write boundaries for orders
type: project
---

RLS policies follow two ownership patterns in this codebase:

1. **Direct ownership** (`auth.uid() = user_id`) for tables with a `user_id` FK to `profiles`: `profiles` (uses `id`), `workout_plans`, `daily_logs`, `weight_logs`, `weekly_analyses`, `orders`.
2. **Indirect ownership via EXISTS subquery** for child tables that lack a `user_id` column: `workout_days` -> `workout_plans`, `workout_day_exercises` -> `workout_days` -> `workout_plans`, `food_entries` -> `daily_logs`, `workout_exercise_logs` -> `daily_logs`, `order_items` -> `orders`.

**Why:** the schema deliberately omits a redundant `user_id` on child tables; the parent FK is the single source of truth for ownership. EXISTS-against-parent keeps the policy aligned with the schema rather than denormalizing.

**How to apply:** when adding a new table, decide first whether it carries `user_id` or whether ownership flows through a parent. Mirror the existing pattern; do not introduce a third style. UPDATE policies use both `USING` and `WITH CHECK` (identical predicate) so users cannot pivot a row to another owner.

**Special cases recorded in `20260430000003_rls_policies.sql`:**
- `profiles`: no INSERT policy — rows are created by the `handle_new_user()` SECURITY DEFINER trigger on `auth.users`. No DELETE policy — handled by `ON DELETE CASCADE` from `auth.users`.
- `orders` and `order_items`: only SELECT + INSERT policies for end users. UPDATE/DELETE on `orders` is reserved for the Stripe webhook handler, which must use the service role key (bypasses RLS) to flip status `pending` -> `paid`/`cancelled`. When implementing the webhook in a later iteration, do NOT add a user-facing UPDATE policy on orders.
- `exercises` and `products`: `USING (true)` SELECT-only. Writes are seed-time / admin-only via service role.
