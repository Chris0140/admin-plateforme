-- Add LPP certificate data columns to prevoyance_data table

ALTER TABLE prevoyance_data
  -- Avoir actuel
  ADD COLUMN IF NOT EXISTS lpp_avoir_vieillesse numeric DEFAULT 0,
  
  -- Prestations vieillesse projetées
  ADD COLUMN IF NOT EXISTS lpp_capital_projete_65 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lpp_rente_mensuelle_projetee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lpp_rente_annuelle_projetee numeric DEFAULT 0,
  
  -- Prestations invalidité
  ADD COLUMN IF NOT EXISTS lpp_rente_invalidite_mensuelle numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lpp_rente_invalidite_annuelle numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lpp_capital_invalidite numeric DEFAULT 0,
  
  -- Prestations décès
  ADD COLUMN IF NOT EXISTS lpp_rente_conjoint_survivant numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lpp_rente_orphelins numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lpp_capital_deces numeric DEFAULT 0,
  
  -- Métadonnées
  ADD COLUMN IF NOT EXISTS lpp_derniere_maj date;

COMMENT ON COLUMN prevoyance_data.lpp_avoir_vieillesse IS 'Avoir de vieillesse actuel selon certificat LPP';
COMMENT ON COLUMN prevoyance_data.lpp_capital_projete_65 IS 'Capital de vieillesse projeté à 65 ans';
COMMENT ON COLUMN prevoyance_data.lpp_rente_mensuelle_projetee IS 'Rente de vieillesse mensuelle projetée';
COMMENT ON COLUMN prevoyance_data.lpp_rente_annuelle_projetee IS 'Rente de vieillesse annuelle projetée';
COMMENT ON COLUMN prevoyance_data.lpp_rente_invalidite_mensuelle IS 'Rente d''invalidité mensuelle';
COMMENT ON COLUMN prevoyance_data.lpp_rente_invalidite_annuelle IS 'Rente d''invalidité annuelle';
COMMENT ON COLUMN prevoyance_data.lpp_capital_invalidite IS 'Capital d''invalidité';
COMMENT ON COLUMN prevoyance_data.lpp_rente_conjoint_survivant IS 'Rente de conjoint survivant';
COMMENT ON COLUMN prevoyance_data.lpp_rente_orphelins IS 'Rente pour orphelins';
COMMENT ON COLUMN prevoyance_data.lpp_capital_deces IS 'Capital décès';
COMMENT ON COLUMN prevoyance_data.lpp_derniere_maj IS 'Date de dernière mise à jour du certificat LPP';