-- Store the deterministic baseline and exact weekly inputs beside each AI result.
ALTER TABLE public.weekly_analyses
  ADD COLUMN IF NOT EXISTS rule_based_summary TEXT,
  ADD COLUMN IF NOT EXISTS rule_based_suggestions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rule_based_rating INTEGER
    CHECK (rule_based_rating BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS risk_warning TEXT,
  ADD COLUMN IF NOT EXISTS metrics_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS ai_status TEXT NOT NULL DEFAULT 'success'
    CHECK (ai_status IN ('success', 'fallback', 'sample'));

NOTIFY pgrst, 'reload schema';
