-- ===========================================================================
-- TypedHand — initial schema
-- ===========================================================================
-- Run this in the Supabase SQL editor (or via the Supabase CLI) on a fresh
-- project. It creates the profiles + exports tables, RLS policies, and a
-- trigger that provisions a profile row whenever a new auth user is created.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',            -- 'free' | 'student' | 'pro'
  export_count INTEGER NOT NULL DEFAULT 0,
  export_reset_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'student', 'pro'))
);

CREATE TABLE IF NOT EXISTS public.exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,                    -- 'png' | 'pdf'
  font_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exports_type_check CHECK (export_type IN ('png', 'pdf'))
);

CREATE INDEX IF NOT EXISTS exports_user_id_idx ON public.exports (user_id);
CREATE INDEX IF NOT EXISTS exports_created_at_idx ON public.exports (created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx
  ON public.profiles (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Profiles: a user may read and update only their own row. The service-role
-- key (used by webhooks / admin / export accounting) bypasses RLS entirely.
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are updatable by owner" ON public.profiles;
CREATE POLICY "Profiles are updatable by owner"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Exports: a user may read only their own export log. Inserts happen via the
-- service role (server-side accounting), so no INSERT policy is granted to
-- regular users.
DROP POLICY IF EXISTS "Exports are viewable by owner" ON public.exports;
CREATE POLICY "Exports are viewable by owner"
  ON public.exports FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- New-user trigger: provision a profile row on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Storage bucket for Phase 2 personal handwriting fonts (scaffold only — no
-- upload UI is wired up yet).
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('personal-fonts', 'personal-fonts', false)
ON CONFLICT (id) DO NOTHING;

-- Owners may read their own uploaded fonts (path convention: <user_id>/...).
DROP POLICY IF EXISTS "Users read own fonts" ON storage.objects;
CREATE POLICY "Users read own fonts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'personal-fonts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ===========================================================================
-- AFTER FIRST DEPLOY — create the admin account
-- ===========================================================================
-- 1. Sign up normally through the app with your admin email.
-- 2. Then run (replacing the email):
--
--    UPDATE public.profiles
--    SET is_admin = true, tier = 'pro'
--    WHERE email = 'admin@typedhand.com';
-- ===========================================================================
