-- Add new columns to avs_profiles table
ALTER TABLE public.avs_profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS number_of_children integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS marriage_date date;