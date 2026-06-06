-- ===========================================================================
-- TypedHand — record which fixed template a font job used
-- ===========================================================================
-- Users now pick one of the issued TypedHand templates per upload (they cannot
-- craft their own sheet). Storing the chosen template's convert.py layout key
-- on the job lets the worker map cells -> Unicode directly, with no QR decode
-- or per-cell OCR. NULL = a legacy job (worker falls back to QR id / OCR).
-- ===========================================================================

ALTER TABLE public.font_jobs
  ADD COLUMN IF NOT EXISTS template TEXT;  -- convert.py layout key, e.g. 'template_3'
