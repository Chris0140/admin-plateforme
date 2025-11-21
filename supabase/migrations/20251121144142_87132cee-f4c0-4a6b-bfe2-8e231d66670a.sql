-- Add AVS number and marital status to avs_profiles
ALTER TABLE public.avs_profiles 
ADD COLUMN avs_number TEXT,
ADD COLUMN marital_status TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.avs_profiles.avs_number IS 'Numéro AVS du profil (format: 756.XXXX.XXXX.XX)';
COMMENT ON COLUMN public.avs_profiles.marital_status IS 'État civil: célibataire, marié, divorcé, veuf';