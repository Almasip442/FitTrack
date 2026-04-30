-- =====================================================================
-- FitTrack Pro — Workout RPC functions
-- Migration: 20260430000007_workout_rpc.sql
-- Iteration: Backend I7 — Edzésterv CRUD
--
-- Purpose:
--   Provide two SECURITY DEFINER helpers that PostgREST cannot express
--   cleanly as a single statement:
--
--     1. update_exercise_order(updates JSONB)
--        Batch-update `exercise_order` for a list of
--        `workout_day_exercises` rows in one round-trip.
--
--     2. set_active_workout_plan(p_plan_id UUID, p_user_id UUID)
--        Mark exactly one workout plan as active for the given user
--        in a single transaction (clearing all others first).
--
-- Notes:
--   * Both functions run with SECURITY DEFINER to bypass RLS for the
--     internal multi-row update. Caller-side authorization must happen
--     in the application layer (Server Action) before invoking them.
--   * `set_active_workout_plan` additionally constrains writes to the
--     `p_user_id` argument so that even an accidental cross-user call
--     cannot flip another user's flag.
--   * `update_exercise_order` validates ownership inline by joining
--     each updated row through workout_days -> workout_plans and
--     filtering by `auth.uid()`, so a SECURITY DEFINER call still
--     cannot mutate rows that do not belong to the caller.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 7.7 — Batch update exercise_order on workout_day_exercises
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_exercise_order(updates JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE workout_day_exercises wde
       SET exercise_order = (item->>'exercise_order')::INTEGER
     WHERE wde.id = (item->>'id')::UUID
       AND EXISTS (
         SELECT 1
           FROM workout_days wd
           JOIN workout_plans wp ON wp.id = wd.plan_id
          WHERE wd.id = wde.workout_day_id
            AND wp.user_id = auth.uid()
       );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.update_exercise_order(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_exercise_order(JSONB) TO authenticated;


-- ---------------------------------------------------------------------
-- 7.8 — Set the active workout plan for a user
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_active_workout_plan(
  p_plan_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized for this user';
  END IF;

  UPDATE workout_plans
     SET is_active = FALSE,
         updated_at = NOW()
   WHERE user_id = p_user_id
     AND is_active = TRUE;

  UPDATE workout_plans
     SET is_active = TRUE,
         updated_at = NOW()
   WHERE id = p_plan_id
     AND user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_active_workout_plan(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_active_workout_plan(UUID, UUID) TO authenticated;
