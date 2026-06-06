-- ===========================================================================
-- TypedHand — consent & age gate (DSGVO Art. 8)
-- ===========================================================================
-- Records, per user, the consent given at signup: that they confirmed being at
-- least 16 (Germany's digital-consent age under Art. 8 DSGVO), which
-- Terms/Privacy version they accepted, and when. The signup API passes these as
-- auth user metadata; the handle_new_user trigger copies them onto the profile
-- with a server-side timestamp (more trustworthy than a client-supplied time).
--
-- AGE GATE: users under 16 are HARD-BLOCKED at signup (server-side validated),
-- so no minor accounts are ever created and parental-consent collection is not
-- required — the block itself is the mechanism. We therefore do NOT store any
-- minor / parental-consent state.
--
-- DATA MINIMISATION: we deliberately do NOT store the raw date of birth. It is
-- only used server-side for the age check and then discarded; we keep just the
-- derived `confirmed_age_16_plus` flag.
--
-- TODO(constantin): consider an append-only consent_events audit table if you
-- need a full history of re-consents across Terms/Privacy versions.
-- ===========================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS confirmed_age_16_plus BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;

-- Recreate the new-user trigger so it persists the consent metadata the signup
-- API sends via auth.signUp({ options: { data: {...} } }). The consent_timestamp
-- is stamped server-side with now() rather than trusting a client value.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version TEXT := NEW.raw_user_meta_data->>'consent_version';
  v_confirmed BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'confirmed_age_16_plus')::boolean, false);
BEGIN
  INSERT INTO public.profiles (
    id, email,
    confirmed_age_16_plus, consent_version, consent_timestamp
  )
  VALUES (
    NEW.id, NEW.email,
    v_confirmed,
    v_version,
    CASE WHEN v_version IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
