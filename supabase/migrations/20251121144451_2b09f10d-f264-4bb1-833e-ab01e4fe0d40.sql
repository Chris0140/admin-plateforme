-- Add owner_name field to identify AVS accounts within a profile
ALTER TABLE public.avs_profiles 
ADD COLUMN owner_name TEXT DEFAULT 'Mon compte AVS';

-- Add comment for clarity
COMMENT ON COLUMN public.avs_profiles.owner_name IS 'Nom du titulaire du compte AVS (ex: Mon compte, Compte de mon conjoint)';