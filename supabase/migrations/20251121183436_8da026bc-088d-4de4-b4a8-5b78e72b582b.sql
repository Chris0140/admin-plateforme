-- Add phone_verified column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update the handle_new_user function to include all required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    appellation,
    nom,
    prenom,
    email,
    date_naissance,
    canton,
    localite,
    telephone,
    phone_verified
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'appellation', 'Monsieur'),
    NEW.raw_user_meta_data->>'nom',
    NEW.raw_user_meta_data->>'prenom',
    NEW.email,
    (NEW.raw_user_meta_data->>'date_naissance')::DATE,
    NEW.raw_user_meta_data->>'canton',
    COALESCE(NEW.raw_user_meta_data->>'localite', ''),
    NEW.raw_user_meta_data->>'telephone',
    false
  );
  RETURN NEW;
END;
$$;