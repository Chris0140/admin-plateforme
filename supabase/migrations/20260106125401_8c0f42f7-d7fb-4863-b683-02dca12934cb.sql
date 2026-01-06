-- Add new columns to avs_profiles table for ACOR-style form
ALTER TABLE public.avs_profiles
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Suisse',
ADD COLUMN IF NOT EXISTS domicile_country text DEFAULT 'Suisse',
ADD COLUMN IF NOT EXISTS retirement_date date;