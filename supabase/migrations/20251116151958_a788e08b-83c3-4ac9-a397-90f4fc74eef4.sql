-- Add subcategories for charges sociales in budget_data table
ALTER TABLE public.budget_data 
ADD COLUMN charges_sociales_1er_pilier numeric DEFAULT 0,
ADD COLUMN charges_sociales_2eme_pilier numeric DEFAULT 0,
ADD COLUMN charges_sociales_autres numeric DEFAULT 0;

-- Update existing charges_sociales to be calculated from subcategories
-- For existing rows, put all current charges_sociales value into charges_sociales_autres
UPDATE public.budget_data 
SET charges_sociales_autres = COALESCE(charges_sociales, 0)
WHERE charges_sociales_autres = 0;