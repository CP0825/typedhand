-- ===========================================================================
-- TypedHand — private bucket for finished PDF exports
-- ===========================================================================
-- Every PDF a user exports is also saved under their profile so they can always
-- re-open and re-download it (read-only — they can never change a saved export).
-- Files live at `<user_id>/<file>.pdf`. The app reads them back through
-- service-role signed URLs (see lib/exports.ts), so no client RLS is required;
-- writes only happen via the service role in /api/export/save.
-- ===========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Owners may read their own saved exports directly (path convention:
-- <user_id>/...). Not strictly needed (the app uses signed URLs) but harmless
-- and consistent with personal-fonts.
DROP POLICY IF EXISTS "Users read own exports" ON storage.objects;
CREATE POLICY "Users read own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
