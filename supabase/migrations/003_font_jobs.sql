-- ===========================================================================
-- TypedHand — font generation jobs (Phase 2: "Generate my font")
-- ===========================================================================
-- A user uploads one or more marked-up Calligraphr PDFs and presses "Generate
-- my font". The Next route stores the PDFs in the `personal-fonts` bucket and
-- enqueues ONE font_jobs row (status 'queued'). A background worker container
-- polls for queued jobs, converts each PDF -> TTF (font-worker/convert.py),
-- stores the TTFs, writes one user_fonts row per variant, and marks the job
-- 'done' (or 'failed' with an error).
--
-- One PDF = one font variant; several PDFs in one job = several variants, which
-- the editor's per-character randomiser mixes for a natural hand-written look.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Extend user_fonts to hold the produced TTF + conversion metadata.
-- (002 only modelled the uploaded source; now we also store the output.)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_fonts
  ADD COLUMN IF NOT EXISTS font_path TEXT,        -- TTF path in personal-fonts
  ADD COLUMN IF NOT EXISTS glyph_count INTEGER,   -- glyphs extracted
  ADD COLUMN IF NOT EXISTS layout TEXT,           -- resolved template layout
  ADD COLUMN IF NOT EXISTS variant_index INTEGER, -- 1-based within a job
  ADD COLUMN IF NOT EXISTS job_id UUID,           -- originating font_jobs.id
  -- Unicode code points this variant actually contains a glyph for. The editor
  -- writes ONLY with the user's own hand, so it picks a variant per character
  -- only from those that cover it (falling back to a built-in font otherwise).
  ADD COLUMN IF NOT EXISTS codepoints INTEGER[];

-- ---------------------------------------------------------------------------
-- font_jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.font_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                       -- base display name for the variants
  -- 'queued'     = awaiting a worker
  -- 'processing' = claimed by a worker
  -- 'done'       = TTF(s) produced, user_fonts rows written
  -- 'failed'     = gave up; see error
  status TEXT NOT NULL DEFAULT 'queued',
  source_paths TEXT[] NOT NULL DEFAULT '{}', -- uploaded PDF paths in the bucket
  font_ids UUID[] NOT NULL DEFAULT '{}',     -- resulting user_fonts ids
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  CONSTRAINT font_jobs_status_check
    CHECK (status IN ('queued', 'processing', 'done', 'failed'))
);

CREATE INDEX IF NOT EXISTS font_jobs_user_id_idx ON public.font_jobs (user_id);
-- Partial index keeps the worker's "next queued job" lookup cheap.
CREATE INDEX IF NOT EXISTS font_jobs_queued_idx
  ON public.font_jobs (created_at) WHERE status = 'queued';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.font_jobs ENABLE ROW LEVEL SECURITY;

-- Owners may read their own jobs (the UI polls for status). Inserts and all
-- worker updates go through the service-role key, which bypasses RLS — so no
-- INSERT/UPDATE policies are granted to regular users (mirrors `exports`).
DROP POLICY IF EXISTS "Font jobs are viewable by owner" ON public.font_jobs;
CREATE POLICY "Font jobs are viewable by owner"
  ON public.font_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Atomic job claim for the polling worker.
-- FOR UPDATE SKIP LOCKED lets several worker replicas claim distinct jobs
-- without ever grabbing the same one. Returns 0 or 1 rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_font_job()
RETURNS SETOF public.font_jobs
LANGUAGE sql
AS $$
  UPDATE public.font_jobs
  SET status = 'processing',
      started_at = now(),
      updated_at = now(),
      attempts = attempts + 1
  WHERE id = (
    SELECT id FROM public.font_jobs
    WHERE status = 'queued'
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$;

-- Only the worker (service role) may claim jobs.
REVOKE ALL ON FUNCTION public.claim_font_job() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_font_job() TO service_role;

-- ---------------------------------------------------------------------------
-- Reap stuck jobs. If a worker dies mid-job (crash / OOM / deploy restart) the
-- row is left in 'processing' and would never be reclaimed (claim_font_job only
-- looks at 'queued'). This requeues such jobs once they exceed p_timeout, or
-- marks them 'failed' once attempts have hit p_max_attempts — so a job that
-- repeatedly kills the worker is bounded instead of looping forever. The worker
-- calls this when idle. Returns the number of rows touched.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.requeue_stale_font_jobs(
  p_timeout INTERVAL DEFAULT INTERVAL '10 minutes',
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS INTEGER
LANGUAGE sql
AS $$
  WITH stale AS (
    SELECT id FROM public.font_jobs
    WHERE status = 'processing'
      AND started_at < now() - p_timeout
    FOR UPDATE SKIP LOCKED
  ), updated AS (
    UPDATE public.font_jobs j
    SET status = CASE WHEN j.attempts >= p_max_attempts THEN 'failed' ELSE 'queued' END,
        error  = CASE WHEN j.attempts >= p_max_attempts
                      THEN 'worker stalled (no completion within timeout)'
                      ELSE j.error END,
        finished_at = CASE WHEN j.attempts >= p_max_attempts THEN now() ELSE j.finished_at END,
        updated_at = now()
    FROM stale
    WHERE j.id = stale.id
    RETURNING 1
  )
  SELECT count(*)::INTEGER FROM updated;
$$;

REVOKE ALL ON FUNCTION public.requeue_stale_font_jobs(INTERVAL, INTEGER)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requeue_stale_font_jobs(INTERVAL, INTEGER)
  TO service_role;
