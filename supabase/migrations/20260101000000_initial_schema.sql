-- =====================================================================
-- FitTrack Pro — Initial Database Schema
-- Migration: 20260101000000_initial_schema.sql
-- Iteration: Backend I2 — Adatbázis Séma: Core Táblák
--
-- Notes:
--   * Row Level Security (RLS) policies are intentionally NOT included
--     in this migration. They are scoped to Backend Iteration 3.
--   * Tables are created in dependency order to satisfy foreign keys.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1 — profiles
--      One-to-one extension of auth.users; populated automatically by
--      the on_auth_user_created trigger defined further below (2.9a).
-- ---------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('férfi', 'nő')),
  weight DECIMAL,
  height DECIMAL,
  goal TEXT CHECK (goal IN ('fogyás', 'izomnövelés', 'erőnövelés', 'egészség')),
  activity_level TEXT CHECK (activity_level IN ('ülő', 'mérsékelten_aktív', 'aktív', 'nagyon_aktív')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.2 — exercises
--      Static catalog seeded from the wger API (Iteration 4).
-- ---------------------------------------------------------------------
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wger_id INTEGER UNIQUE,
  name_hu TEXT NOT NULL,
  name_en TEXT,
  description_hu TEXT,
  description_en TEXT,
  muscle_group TEXT,
  muscles_secondary TEXT[],
  equipment TEXT,
  difficulty TEXT CHECK (difficulty IN ('kezdő', 'haladó', 'profi')),
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.3 — Workout plan tables
-- ---------------------------------------------------------------------
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  day_order INTEGER NOT NULL DEFAULT 0,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  rest_seconds INTEGER DEFAULT 60,
  exercise_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.4 — Calorie tracking tables
-- ---------------------------------------------------------------------
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories DECIMAL NOT NULL DEFAULT 0,
  protein DECIMAL DEFAULT 0,
  carbs DECIMAL DEFAULT 0,
  fat DECIMAL DEFAULT 0,
  amount DECIMAL DEFAULT 100,
  meal_type TEXT CHECK (meal_type IN ('reggeli', 'ebéd', 'vacsora', 'snack')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.5 — weight_logs
-- ---------------------------------------------------------------------
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ---------------------------------------------------------------------
-- 2.6 — weekly_analyses
--      Stores AI generated weekly progress analysis (OpenRouter).
-- ---------------------------------------------------------------------
CREATE TABLE weekly_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  workouts_completed INTEGER DEFAULT 0,
  avg_calories DECIMAL,
  weight_change DECIMAL,
  ai_analysis TEXT,
  ai_suggestions TEXT[],
  ai_rating INTEGER CHECK (ai_rating >= 1 AND ai_rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ---------------------------------------------------------------------
-- 2.7 — Webshop tables
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT CHECK (category IN ('protein', 'kreatin', 'vitamin', 'aminosav', 'egyéb')),
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  total INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.8 — workout_exercise_logs
--      Per-exercise actuals captured against a daily_log.
-- ---------------------------------------------------------------------
CREATE TABLE workout_exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  sets_completed INTEGER,
  reps_completed INTEGER[],
  weight_used DECIMAL[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (daily_log_id, exercise_id)
);

-- =====================================================================
-- 2.9a — Trigger: auto-create profiles row on new auth.users insert
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 2.9b — Indexes
-- =====================================================================
CREATE INDEX idx_workout_plans_user_id          ON workout_plans (user_id);
CREATE INDEX idx_daily_logs_user_date           ON daily_logs (user_id, date);
CREATE INDEX idx_food_entries_log_id            ON food_entries (daily_log_id);
CREATE INDEX idx_exercises_category             ON exercises (category);
CREATE INDEX idx_exercises_muscle_group         ON exercises (muscle_group);
CREATE INDEX idx_orders_user_id                 ON orders (user_id);
CREATE INDEX idx_weight_logs_user_date          ON weight_logs (user_id, date);
CREATE INDEX idx_workout_days_day_of_week       ON workout_days (plan_id, day_of_week);
CREATE INDEX idx_workout_exercise_logs_daily_log ON workout_exercise_logs (daily_log_id);
