-- Add new columns to prevoyance_data for configuration
ALTER TABLE prevoyance_data 
ADD COLUMN IF NOT EXISTS besoin_pourcentage numeric DEFAULT 80,
ADD COLUMN IF NOT EXISTS revenu_brut_reference numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS etat_civil text,
ADD COLUMN IF NOT EXISTS nombre_enfants integer DEFAULT 0;