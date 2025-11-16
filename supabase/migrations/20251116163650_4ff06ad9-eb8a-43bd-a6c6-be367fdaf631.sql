-- Ajouter les colonnes pour les données mensuelles et annuelles
ALTER TABLE public.budget_data 
  ADD COLUMN IF NOT EXISTS revenu_brut_mensuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenu_brut_annuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_sociales_mensuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_sociales_annuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depenses_logement_mensuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depenses_logement_annuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depenses_transport_mensuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depenses_transport_annuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depenses_alimentation_mensuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS depenses_alimentation_annuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autres_depenses_mensuel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autres_depenses_annuel numeric DEFAULT 0;

-- Migrer les données existantes vers les nouvelles colonnes
UPDATE public.budget_data
SET 
  revenu_brut_mensuel = CASE WHEN period_type = 'mensuel' THEN revenu_brut ELSE ROUND(revenu_brut / 12) END,
  revenu_brut_annuel = CASE WHEN period_type = 'annuel' THEN revenu_brut ELSE revenu_brut * 12 END,
  charges_sociales_mensuel = CASE WHEN period_type = 'mensuel' THEN charges_sociales ELSE ROUND(charges_sociales / 12) END,
  charges_sociales_annuel = CASE WHEN period_type = 'annuel' THEN charges_sociales ELSE charges_sociales * 12 END,
  depenses_logement_mensuel = CASE WHEN period_type = 'mensuel' THEN depenses_logement ELSE ROUND(depenses_logement / 12) END,
  depenses_logement_annuel = CASE WHEN period_type = 'annuel' THEN depenses_logement ELSE depenses_logement * 12 END,
  depenses_transport_mensuel = CASE WHEN period_type = 'mensuel' THEN depenses_transport ELSE ROUND(depenses_transport / 12) END,
  depenses_transport_annuel = CASE WHEN period_type = 'annuel' THEN depenses_transport ELSE depenses_transport * 12 END,
  depenses_alimentation_mensuel = CASE WHEN period_type = 'mensuel' THEN depenses_alimentation ELSE ROUND(depenses_alimentation / 12) END,
  depenses_alimentation_annuel = CASE WHEN period_type = 'annuel' THEN depenses_alimentation ELSE depenses_alimentation * 12 END,
  autres_depenses_mensuel = CASE WHEN period_type = 'mensuel' THEN autres_depenses ELSE ROUND(autres_depenses / 12) END,
  autres_depenses_annuel = CASE WHEN period_type = 'annuel' THEN autres_depenses ELSE autres_depenses * 12 END
WHERE revenu_brut_mensuel = 0 AND revenu_brut_annuel = 0;