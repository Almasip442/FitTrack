-- =====================================================================
-- Iteration 8 — Exercise full-text search
--
-- Adds a generated tsvector column over (name_hu, name_en, description_hu)
-- and a GIN index for fast text search.
--
-- Dictionary: 'simple' is used instead of 'hungarian' for portability —
-- the Hungarian text search dictionary is not always available on
-- Supabase cloud, while 'simple' is guaranteed to exist and is sufficient
-- for token-based name/description matching.
-- =====================================================================

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(name_hu, '') || ' ' ||
      coalesce(name_en, '') || ' ' ||
      coalesce(description_hu, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_exercises_search
  ON exercises
  USING GIN (search_vector);
