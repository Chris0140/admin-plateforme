-- Add column to store children birth dates as JSON array
ALTER TABLE public.avs_profiles
ADD COLUMN IF NOT EXISTS children_birth_dates jsonb DEFAULT '[]'::jsonb;