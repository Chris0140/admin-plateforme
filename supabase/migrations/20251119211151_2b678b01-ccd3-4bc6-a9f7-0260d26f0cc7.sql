-- Add child pension fields to prevoyance_data table
ALTER TABLE public.prevoyance_data
ADD COLUMN avs_rente_enfant_mensuelle numeric DEFAULT 0,
ADD COLUMN avs_rente_enfant_annuelle numeric DEFAULT 0;

COMMENT ON COLUMN public.prevoyance_data.avs_rente_enfant_mensuelle IS 'Monthly AVS child pension (30% of base pension per child)';
COMMENT ON COLUMN public.prevoyance_data.avs_rente_enfant_annuelle IS 'Annual AVS child pension (30% of base pension per child)';