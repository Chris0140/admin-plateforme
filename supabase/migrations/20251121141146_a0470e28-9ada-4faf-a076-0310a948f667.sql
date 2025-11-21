-- ============================================================================
-- PHASE 2: LPP ACCOUNTS & DEPENDANTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table DEPENDANTS (personnes à charge)
-- ----------------------------------------------------------------------------
CREATE TABLE dependants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Identité
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'Autre')),
  
  -- Relation
  relationship TEXT NOT NULL CHECK (relationship IN ('enfant', 'autre')),
  shared_custody BOOLEAN DEFAULT false,
  
  -- Statut
  is_student BOOLEAN DEFAULT false,
  is_disabled BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_birth_date CHECK (date_of_birth <= CURRENT_DATE)
);

-- Index pour recherche par profil
CREATE INDEX idx_dependants_profile ON dependants(profile_id);

-- RLS pour dependants
ALTER TABLE dependants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their dependants"
ON dependants FOR ALL
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Trigger mise à jour
CREATE TRIGGER update_dependants_updated_at
BEFORE UPDATE ON dependants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. Table LPP_ACCOUNTS (comptes de prévoyance professionnelle)
-- ----------------------------------------------------------------------------
CREATE TABLE lpp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Institution
  provider_name TEXT NOT NULL,
  contract_number TEXT,
  plan_name TEXT,
  entry_date DATE,
  
  -- Salaires
  avs_salary NUMERIC DEFAULT 0,
  insured_salary NUMERIC DEFAULT 0,
  coordination_deduction NUMERIC DEFAULT 0,
  
  -- Cotisations annuelles
  employee_savings_contribution NUMERIC DEFAULT 0,
  employer_savings_contribution NUMERIC DEFAULT 0,
  employee_risk_contribution NUMERIC DEFAULT 0,
  employer_risk_contribution NUMERIC DEFAULT 0,
  admin_fees NUMERIC DEFAULT 0,
  total_annual_contribution NUMERIC DEFAULT 0,
  
  -- Avoir de vieillesse
  current_retirement_savings NUMERIC DEFAULT 0,
  projected_savings_at_65 NUMERIC DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  
  -- Rente de vieillesse
  conversion_rate_at_65 NUMERIC DEFAULT 0,
  projected_retirement_rent_at_65 NUMERIC DEFAULT 0,
  projected_retirement_rent_at_64 NUMERIC DEFAULT 0,
  projected_retirement_rent_at_63 NUMERIC DEFAULT 0,
  projected_retirement_rent_at_62 NUMERIC DEFAULT 0,
  projected_retirement_rent_at_61 NUMERIC DEFAULT 0,
  projected_retirement_rent_at_60 NUMERIC DEFAULT 0,
  
  -- Invalidité
  disability_rent_annual NUMERIC DEFAULT 0,
  child_disability_rent_annual NUMERIC DEFAULT 0,
  waiting_period_days INTEGER DEFAULT 0,
  
  -- Décès
  widow_rent_annual NUMERIC DEFAULT 0,
  orphan_rent_annual NUMERIC DEFAULT 0,
  death_capital NUMERIC DEFAULT 0,
  additional_death_capital NUMERIC DEFAULT 0,
  
  -- Rachat
  max_buyback_amount NUMERIC DEFAULT 0,
  last_buyback_amount NUMERIC DEFAULT 0,
  last_buyback_date DATE,
  
  -- EPL (Encouragement à la propriété du logement)
  epl_withdrawal_amount NUMERIC DEFAULT 0,
  epl_withdrawal_date DATE,
  epl_min_amount_remaining NUMERIC DEFAULT 0,
  epl_pledged BOOLEAN DEFAULT false,
  epl_pledge_amount NUMERIC DEFAULT 0,
  
  -- Métadonnées
  last_certificate_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX idx_lpp_accounts_profile ON lpp_accounts(profile_id);
CREATE INDEX idx_lpp_accounts_active ON lpp_accounts(profile_id, is_active);

-- RLS pour lpp_accounts
ALTER TABLE lpp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their LPP accounts"
ON lpp_accounts FOR ALL
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Trigger mise à jour
CREATE TRIGGER update_lpp_accounts_updated_at
BEFORE UPDATE ON lpp_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. Script de migration des données existantes (prevoyance_data -> lpp_accounts)
-- ----------------------------------------------------------------------------
-- Cette fonction permet de migrer les données de l'ancienne table vers la nouvelle
CREATE OR REPLACE FUNCTION migrate_prevoyance_to_lpp()
RETURNS void
LANGUAGE plpgsql
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

-- Exécuter la migration si des données existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM prevoyance_data LIMIT 1) THEN
    PERFORM migrate_prevoyance_to_lpp();
  END IF;
END $$;