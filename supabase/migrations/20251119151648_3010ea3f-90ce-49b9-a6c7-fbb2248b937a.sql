-- Add AVS pension calculation fields to prevoyance_data
ALTER TABLE public.prevoyance_data
  ADD COLUMN IF NOT EXISTS rente_vieillesse_mensuelle numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rente_vieillesse_annuelle numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rente_invalidite_mensuelle numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rente_invalidite_annuelle numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenu_annuel_determinant numeric DEFAULT 0;

COMMENT ON COLUMN public.prevoyance_data.rente_vieillesse_mensuelle IS 'Monthly old-age pension calculated from Echelle 44';
COMMENT ON COLUMN public.prevoyance_data.rente_vieillesse_annuelle IS 'Annual old-age pension (monthly * 12)';
COMMENT ON COLUMN public.prevoyance_data.rente_invalidite_mensuelle IS 'Monthly disability pension (same as old-age for AVS)';
COMMENT ON COLUMN public.prevoyance_data.rente_invalidite_annuelle IS 'Annual disability pension (monthly * 12)';
COMMENT ON COLUMN public.prevoyance_data.revenu_annuel_determinant IS 'Determining annual income used for AVS calculation';