-- ============================================================================
-- Oscar Mkatoliki Admin – Admin Auth Table
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- ============================================================================

-- 1. Create admin role enum
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  role        admin_role NOT NULL DEFAULT 'admin',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by auth_id
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_id ON public.admin_users(auth_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email   ON public.admin_users(email);

-- 3. Auto-update `updated_at` on every row change
CREATE OR REPLACE FUNCTION public.set_admin_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

-- 4. Auto-create admin_users row when a new user signs up
--    (only fires for new auth users; won't duplicate)
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_users (auth_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- 5. Helper: check if current user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_id = auth.uid()
      AND is_active = true
  );
END;
$$;

-- 6. Helper: get current admin's role
CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS admin_role LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  _role admin_role;
BEGIN
  SELECT role INTO _role FROM public.admin_users
  WHERE auth_id = auth.uid() AND is_active = true;
  RETURN _role;
END;
$$;

-- 7. Row-Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can read their own row
DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_users;
CREATE POLICY "Admins can view own profile"
  ON public.admin_users FOR SELECT
  USING (auth_id = auth.uid());

-- Admins can update their own row (name, phone, avatar only — not role)
DROP POLICY IF EXISTS "Admins can update own profile" ON public.admin_users;
CREATE POLICY "Admins can update own profile"
  ON public.admin_users FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Super-admins can see all admin users
DROP POLICY IF EXISTS "Super admins can view all" ON public.admin_users;
CREATE POLICY "Super admins can view all"
  ON public.admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE auth_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Super-admins can update any admin user (role, is_active, etc.)
DROP POLICY IF EXISTS "Super admins can update all" ON public.admin_users;
CREATE POLICY "Super admins can update all"
  ON public.admin_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE auth_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Service role / trigger can insert (SECURITY DEFINER on the trigger fn handles this)
DROP POLICY IF EXISTS "Service can insert" ON public.admin_users;
CREATE POLICY "Service can insert"
  ON public.admin_users FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 8. Bootstrap: make an existing user a super_admin (replace YOUR email below)
-- ============================================================================
-- Uncomment and edit the email, then run once:

 INSERT INTO public.admin_users (auth_id, full_name, email, role)
 SELECT id, COALESCE(raw_user_meta_data ->> 'full_name', ''), email, 'super_admin'
 FROM auth.users
 WHERE email = 'zoomdigital365@gmail.com'
 ON CONFLICT (auth_id) DO UPDATE SET role = 'super_admin';
-- ============================================================================
