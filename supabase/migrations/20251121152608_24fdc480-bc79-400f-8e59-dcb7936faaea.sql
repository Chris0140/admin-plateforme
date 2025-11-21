-- Create budget_monthly table for detailed monthly tracking
CREATE TABLE IF NOT EXISTS budget_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

  -- Entrées
  reste_mois_precedent NUMERIC DEFAULT 0,
  salaire_net NUMERIC DEFAULT 0,
  autres_revenus NUMERIC DEFAULT 0,

  -- Sorties
  depenses_variables NUMERIC DEFAULT 0,
  frais_fixes_dettes NUMERIC DEFAULT 0,
  assurances NUMERIC DEFAULT 0,
  epargne_investissements NUMERIC DEFAULT 0,

  -- Totaux calculés
  total_revenus NUMERIC DEFAULT 0,
  total_sorties NUMERIC DEFAULT 0,
  total_restant NUMERIC DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, year, month)
);

-- Enable RLS
ALTER TABLE budget_monthly ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own monthly budget
CREATE POLICY "Users can manage their own monthly budget"
ON budget_monthly
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_budget_monthly_updated_at
BEFORE UPDATE ON budget_monthly
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();