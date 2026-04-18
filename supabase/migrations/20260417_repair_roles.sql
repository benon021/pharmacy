
-- 1. Update the app_role enum to include all required roles
-- Note: In Supabase, you can't easily ALTER TYPE ENUM inside a transaction.
-- This script assumes you are running it in the Supabase SQL Editor.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pharmacist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'storekeeper';

-- 2. Update handle_new_user to correctly assign roles from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Extract role from metadata, default to 'seller'
  _role := (NEW.raw_user_meta_data->>'role')::public.app_role;
  IF _role IS NULL THEN
    _role := 'seller';
  END IF;

  -- Insert into profiles
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

-- 3. Provision the initial Master Super Admin (if you haven't yet)
-- This is a template. Run this manually with specific user ID if needed.
-- INSERT INTO auth.users (id, email, raw_user_meta_data) ... 
-- Usually handled via the DebugSetup.tsx UI once this trigger is live.
