-- =====================================================================
-- FitTrack Pro — Row Level Security (RLS) Policies
-- Migration: 20260430000003_rls_policies.sql
-- Iteration: Backend I3 — Row Level Security (RLS)
--
-- Purpose:
--   Enable RLS on every application table and define per-table policies
--   so that:
--     * Authenticated users can only access their OWN data.
--     * Unauthenticated requests cannot reach user-specific data.
--     * Catalog tables (`exercises`, `products`) remain publicly readable.
--
-- Policy patterns used in this migration:
--   1. Direct ownership .................. user_id = auth.uid()
--   2. Indirect ownership via parent ..... EXISTS (SELECT 1 FROM <parent>
--                                                  WHERE <parent>.id = <fk>
--                                                  AND <parent>.user_id = auth.uid())
--   3. Public read ....................... USING (true) on SELECT only
--
-- Notes:
--   * INSERT into `profiles` is performed by the SECURITY DEFINER trigger
--     `handle_new_user()` (see 20260101000000_initial_schema.sql, 2.9a),
--     so no INSERT policy is required on `profiles`. DELETE on a profile
--     happens via ON DELETE CASCADE from auth.users and likewise needs
--     no policy.
--   * `products` is treated as a read-only catalog from the user's
--     perspective; admin/seed writes happen via the service role key,
--     which bypasses RLS by design.
-- =====================================================================

-- =====================================================================
-- 3.4 — Manual RLS Verification Steps (post-deploy checklist)
-- ---------------------------------------------------------------------
-- After applying this migration, verify the policies manually:
--
--   1. Create two test users (User A and User B) via Supabase Auth.
--   2. Sign in as User A and INSERT a row into `workout_plans`,
--      `daily_logs`, `weight_logs`, and `orders`.
--   3. Sign in as User B and run SELECT * on those tables.
--      Expected: zero rows returned (B cannot see A's data).
--   4. As User B, attempt UPDATE / DELETE on a row owned by A using
--      its UUID. Expected: zero rows affected, no error.
--   5. As User B, INSERT a row into `food_entries` referencing a
--      `daily_log_id` that belongs to A.
--      Expected: INSERT fails (WITH CHECK violation).
--   6. Sign out completely (anon role) and SELECT from `exercises`
--      and `products`. Expected: rows are returned.
--   7. As anon, SELECT from any user-specific table.
--      Expected: zero rows returned.
--   8. Confirm in Supabase Studio that every table in this migration
--      shows the green "RLS enabled" indicator.
-- =====================================================================


-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ---------------------------------------------------------------------
-- exercises (public catalog — read-only)
-- ---------------------------------------------------------------------
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are publicly readable"
  ON exercises FOR SELECT
  USING (true);


-- ---------------------------------------------------------------------
-- workout_plans  (direct ownership)
-- ---------------------------------------------------------------------
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout plans"
  ON workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON workout_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON workout_plans FOR DELETE
  USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- workout_days  (ownership via workout_plans.user_id)
-- ---------------------------------------------------------------------
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout days"
  ON workout_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout days"
  ON workout_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout days"
  ON workout_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout days"
  ON workout_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- workout_day_exercises  (ownership via workout_days -> workout_plans)
-- ---------------------------------------------------------------------
ALTER TABLE workout_day_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout day exercises"
  ON workout_day_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_days
      JOIN workout_plans ON workout_plans.id = workout_days.plan_id
      WHERE workout_days.id = workout_day_exercises.workout_day_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout day exercises"
  ON workout_day_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_days
      JOIN workout_plans ON workout_plans.id = workout_days.plan_id
      WHERE workout_days.id = workout_day_exercises.workout_day_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout day exercises"
  ON workout_day_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_days
      JOIN workout_plans ON workout_plans.id = workout_days.plan_id
      WHERE workout_days.id = workout_day_exercises.workout_day_id
        AND workout_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_days
      JOIN workout_plans ON workout_plans.id = workout_days.plan_id
      WHERE workout_days.id = workout_day_exercises.workout_day_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout day exercises"
  ON workout_day_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_days
      JOIN workout_plans ON workout_plans.id = workout_days.plan_id
      WHERE workout_days.id = workout_day_exercises.workout_day_id
        AND workout_plans.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- daily_logs  (direct ownership)
-- ---------------------------------------------------------------------
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs"
  ON daily_logs FOR DELETE
  USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- food_entries  (ownership via daily_logs.user_id)
-- ---------------------------------------------------------------------
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food entries"
  ON food_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = food_entries.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own food entries"
  ON food_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = food_entries.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own food entries"
  ON food_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = food_entries.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = food_entries.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own food entries"
  ON food_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = food_entries.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- weight_logs  (direct ownership)
-- ---------------------------------------------------------------------
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight logs"
  ON weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs"
  ON weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs"
  ON weight_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON weight_logs FOR DELETE
  USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- weekly_analyses  (direct ownership)
-- ---------------------------------------------------------------------
ALTER TABLE weekly_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly analyses"
  ON weekly_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly analyses"
  ON weekly_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly analyses"
  ON weekly_analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly analyses"
  ON weekly_analyses FOR DELETE
  USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- products (public catalog — read-only)
-- ---------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  USING (true);


-- ---------------------------------------------------------------------
-- orders  (direct ownership)
--   UPDATE/DELETE intentionally restricted: order status changes
--   originate from the Stripe webhook handler, which uses the service
--   role key and bypasses RLS. End users may create and read their
--   own orders only.
-- ---------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- order_items  (ownership via orders.user_id; read-only for end users)
--   Like `orders`, INSERTs into `order_items` are produced server-side
--   during checkout creation (service role). Users only need to view
--   their own line items.
-- ---------------------------------------------------------------------
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- workout_exercise_logs  (ownership via daily_logs.user_id)
-- ---------------------------------------------------------------------
ALTER TABLE workout_exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout exercise logs"
  ON workout_exercise_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = workout_exercise_logs.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout exercise logs"
  ON workout_exercise_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = workout_exercise_logs.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout exercise logs"
  ON workout_exercise_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = workout_exercise_logs.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = workout_exercise_logs.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout exercise logs"
  ON workout_exercise_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = workout_exercise_logs.daily_log_id
        AND daily_logs.user_id = auth.uid()
    )
  );
