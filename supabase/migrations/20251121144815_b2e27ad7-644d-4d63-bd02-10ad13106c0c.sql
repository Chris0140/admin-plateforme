-- Add is_active column to avs_profiles to match lpp_accounts and third_pillar_accounts structure
ALTER TABLE public.avs_profiles 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.avs_profiles.is_active IS 'Indique si le compte AVS est actif ou archivé';