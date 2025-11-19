-- Add rente_enfant_invalide field to prevoyance_data table
ALTER TABLE public.prevoyance_data
ADD COLUMN lpp_rente_enfant_invalide numeric DEFAULT 0;