-- ===========================================================================
-- TypedHand — font-pipeline hardening
-- ===========================================================================
-- 1. user_fonts.approved — a converted font must be previewed + approved by the
--    user before the editor uses it for exports (preview/approve step).
-- 2. font_jobs.next_attempt_at — retry-with-backoff: a requeued job is not
--    re-claimed until this time has passed.
-- 3. worker_status — single-row heartbeat the web app reads so a dead worker
--    surfaces "processing delayed" instead of hanging forever.
-- ===========================================================================

-- ── 1. Approve gate ────────────────────────────────────────────────────────
ALTER TABLE public.user_fonts
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

-- Keep already-converted fonts usable (they predate the approve step).
UPDATE public.user_fonts SET approved = true WHERE status = 'ready';

-- Owners may update their own font rows (used to set approved = true).
DROP POLICY IF EXISTS "Fonts are updatable by owner" ON public.user_fonts;
CREATE POLICY "Fonts are updatable by owner"
  ON public.user_fonts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. Retry backoff ─────────────────────────────────────────────────────────
ALTER TABLE public.font_jobs
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;

-- Recreate the claim so a backed-off job is skipped until next_attempt_at.
CREATE OR REPLACE FUNCTION public.claim_font_job()
RETURNS SETOF public.font_jobs
LANGUAGE sql
AS $$
  UPDATE public.font_jobs
  SET status = 'processing',
      started_at = now(),
      updated_at = now(),
      next_attempt_at = NULL,
      attempts = attempts + 1
  WHERE id = (
    SELECT id FROM public.font_jobs
    WHERE status = 'queued'
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.claim_font_job() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_font_job() TO service_role;

-- ── 3. Worker heartbeat ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.worker_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  CONSTRAINT worker_status_singleton CHECK (id = 1)
);

INSERT INTO public.worker_status (id, last_seen_at)
VALUES (1, now())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.worker_status ENABLE ROW LEVEL SECURITY;

-- The heartbeat is non-sensitive (just a timestamp). Any signed-in user may read
-- it so the dashboard/editor can tell whether the converter is alive. Only the
-- worker (service role) writes it.
DROP POLICY IF EXISTS "Worker status readable by authenticated" ON public.worker_status;
CREATE POLICY "Worker status readable by authenticated"
  ON public.worker_status FOR SELECT
  TO authenticated
  USING (true);
