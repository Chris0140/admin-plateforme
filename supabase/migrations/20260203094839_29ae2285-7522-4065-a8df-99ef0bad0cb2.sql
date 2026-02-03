-- Add household columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nombre_adultes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS household_relationship text DEFAULT NULL;

-- Add professional columns to dependants table for partner data
ALTER TABLE dependants 
ADD COLUMN IF NOT EXISTS employment_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS profession text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS annual_income numeric DEFAULT 0;