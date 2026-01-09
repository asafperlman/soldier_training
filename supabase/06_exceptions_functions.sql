-- =============================================================================
-- HELPER FUNCTIONS FOR EXCEPTIONS COMPUTATION
-- Add these to your Supabase SQL Editor
-- =============================================================================

-- Get class average best time for a training type (last N days)
CREATE OR REPLACE FUNCTION get_class_avg_best(
  p_class_id UUID,
  p_training_type_id UUID,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH soldier_bests AS (
    SELECT
      ta.soldier_id,
      MIN(ta.value_seconds) as best_seconds
    FROM training_attempts ta
    JOIN training_sessions ts ON ta.session_id = ts.id
    WHERE ts.class_id = p_class_id
      AND ts.training_type_id = p_training_type_id
      AND ts.session_at >= p_cutoff_date
      AND ta.value_seconds IS NOT NULL
    GROUP BY ta.soldier_id
  )
  SELECT AVG(best_seconds)::NUMERIC
  FROM soldier_bests;
$$;

-- Get department average best time for a training type (last N days)
CREATE OR REPLACE FUNCTION get_dept_avg_best(
  p_dept_id UUID,
  p_training_type_id UUID,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH soldier_bests AS (
    SELECT
      ta.soldier_id,
      MIN(ta.value_seconds) as best_seconds
    FROM training_attempts ta
    JOIN training_sessions ts ON ta.session_id = ts.id
    WHERE ts.department_id = p_dept_id
      AND ts.training_type_id = p_training_type_id
      AND ts.session_at >= p_cutoff_date
      AND ta.value_seconds IS NOT NULL
    GROUP BY ta.soldier_id
  )
  SELECT AVG(best_seconds)::NUMERIC
  FROM soldier_bests;
$$;

-- Get department average session count per soldier for a training type (last N days)
CREATE OR REPLACE FUNCTION get_dept_avg_session_count(
  p_dept_id UUID,
  p_training_type_id UUID,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH soldier_session_counts AS (
    SELECT
      s.id as soldier_id,
      COUNT(DISTINCT ts.id) as session_count
    FROM soldiers s
    LEFT JOIN training_attempts ta ON ta.soldier_id = s.id
    LEFT JOIN training_sessions ts ON ta.session_id = ts.id
      AND ts.training_type_id = p_training_type_id
      AND ts.session_at >= p_cutoff_date
    WHERE s.department_id = p_dept_id
      AND s.status = 'active'
    GROUP BY s.id
  )
  SELECT AVG(session_count)::NUMERIC
  FROM soldier_session_counts;
$$;

-- Get soldier's best time for a training type (last N days)
CREATE OR REPLACE FUNCTION get_soldier_best(
  p_soldier_id UUID,
  p_training_type_id UUID,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT MIN(ta.value_seconds)::NUMERIC
  FROM training_attempts ta
  JOIN training_sessions ts ON ta.session_id = ts.id
  WHERE ta.soldier_id = p_soldier_id
    AND ts.training_type_id = p_training_type_id
    AND ts.session_at >= p_cutoff_date
    AND ta.value_seconds IS NOT NULL;
$$;

-- Get soldier's session count for a training type (last N days)
CREATE OR REPLACE FUNCTION get_soldier_session_count(
  p_soldier_id UUID,
  p_training_type_id UUID,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(DISTINCT ts.id)::INTEGER
  FROM training_attempts ta
  JOIN training_sessions ts ON ta.session_id = ts.id
  WHERE ta.soldier_id = p_soldier_id
    AND ts.training_type_id = p_training_type_id
    AND ts.session_at >= p_cutoff_date;
$$;
