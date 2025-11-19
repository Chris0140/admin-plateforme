-- Add etat_civil and nombre_enfants to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS etat_civil text,
ADD COLUMN IF NOT EXISTS nombre_enfants integer DEFAULT 0;