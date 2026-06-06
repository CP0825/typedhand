-- ===========================================================================
-- TypedHand — user fonts (Phase 2 scaffold)
-- ===========================================================================
-- Tracks each handwriting font a user uploads. For now we store the original
-- source file (e.g. a Calligraphr PDF) in the `personal-fonts` storage bucket
-- and one row here per font. The vectorised per-glyph data (SVG paths keyed by
-- Unicode code point) will live in a future `font_glyphs` table — tiny, so it
-- belongs in Postgres, not storage.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.user_fonts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                 -- display name (defaults to file name)
  source_path TEXT,                   -- path within the personal-fonts bucket
  source_type TEXT,                   -- mime type of the uploaded source file
  -- 'uploaded'  = source stored, not yet vectorised
  -- 'ready'     = glyphs extracted and usable in the editor
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_fonts_status_check CHECK (status IN ('uploaded', 'processing', 'ready', 'failed'))
);

CREATE INDEX IF NOT EXISTS user_fonts_user_id_idx ON public.user_fonts (user_id);

ALTER TABLE public.user_fonts ENABLE ROW LEVEL SECURITY;

-- A user can see, add and remove only their own fonts. The per-tier maximum is
-- enforced in the app (and could be added here as a trigger later).
DROP POLICY IF EXISTS "Fonts are viewable by owner" ON public.user_fonts;
CREATE POLICY "Fonts are viewable by owner"
  ON public.user_fonts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Fonts are insertable by owner" ON public.user_fonts;
CREATE POLICY "Fonts are insertable by owner"
  ON public.user_fonts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Fonts are deletable by owner" ON public.user_fonts;
CREATE POLICY "Fonts are deletable by owner"
  ON public.user_fonts FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: allow owners to upload and delete their own source files. Path
-- convention is <user_id>/<file>, matching the existing SELECT policy.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users upload own fonts" ON storage.objects;
CREATE POLICY "Users upload own fonts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'personal-fonts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own fonts" ON storage.objects;
CREATE POLICY "Users delete own fonts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'personal-fonts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
