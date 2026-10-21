-- Persist whether a planned exercise was explicitly skipped so the
-- workout log can distinguish it from an exercise that was never logged.
ALTER TABLE public.workout_exercise_logs
  ADD COLUMN IF NOT EXISTS skipped BOOLEAN NOT NULL DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
