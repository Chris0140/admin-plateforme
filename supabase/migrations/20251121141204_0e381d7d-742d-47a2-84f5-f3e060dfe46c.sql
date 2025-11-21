-- Corriger le search_path pour la fonction de migration
DROP FUNCTION IF EXISTS migrate_prevoyance_to_lpp();

CREATE OR REPLACE FUNCTION migrate_prevoyance_to_lpp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO lpp_accounts (
    profile_id,
    provider_name,
    current_retirement_savings,
    projected_savings_at_65,
    projected_retirement_rent_at_65,
    disability_rent_annual,
    widow_rent_annual,
    orphan_rent_annual,
    death_capital,
    child_disability_rent_annual,
    last_certificate_date,
    is_active
  )
  SELECT 
    (SELECT id FROM profiles WHERE user_id = p.user_id LIMIT 1) as profile_id,
    'Caisse de pension (migré)' as provider_name,
    COALESCE(p.lpp_avoir_vieillesse, 0),
    COALESCE(p.lpp_capital_projete_65, 0),
    COALESCE(p.lpp_rente_annuelle_projetee, 0),
    COALESCE(p.lpp_rente_invalidite_annuelle, 0),
    COALESCE(p.lpp_rente_conjoint_survivant, 0),
    COALESCE(p.lpp_rente_orphelins, 0),
    COALESCE(p.lpp_capital_deces, 0),
    COALESCE(p.lpp_rente_enfant_invalide, 0),
    p.lpp_derniere_maj,
    true
  FROM prevoyance_data p
  WHERE p.lpp_avoir_vieillesse > 0 OR p.lpp_capital_projete_65 > 0
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Migration completed from prevoyance_data to lpp_accounts';
END;
$$;