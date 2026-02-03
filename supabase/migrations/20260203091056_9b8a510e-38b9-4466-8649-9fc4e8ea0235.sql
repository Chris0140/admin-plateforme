-- Add employment_status and annual_income columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS employment_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS annual_income numeric DEFAULT 0;