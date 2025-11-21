-- Create third_pillar_accounts table
CREATE TABLE public.third_pillar_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('3a_bank', '3a_insurance', '3b')),
  institution_name TEXT NOT NULL,
  contract_number TEXT,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  annual_contribution NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  return_rate NUMERIC NOT NULL DEFAULT 0,
  projected_amount_at_retirement NUMERIC DEFAULT 0,
  projected_annual_rent NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.third_pillar_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their third pillar accounts"
ON public.third_pillar_accounts
FOR ALL
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_third_pillar_accounts_updated_at
BEFORE UPDATE ON public.third_pillar_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create insurance_contracts table
CREATE TABLE public.insurance_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('health_basic', 'health_complementary', 'household', 'liability', 'vehicle', 'legal_protection', 'life', 'disability', 'loss_of_earnings')),
  company_name TEXT NOT NULL,
  contract_number TEXT,
  annual_premium NUMERIC NOT NULL DEFAULT 0,
  deductible NUMERIC DEFAULT 0,
  coverage_amount NUMERIC DEFAULT 0,
  disability_rent_annual NUMERIC DEFAULT 0,
  death_capital NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insurance_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their insurance contracts"
ON public.insurance_contracts
FOR ALL
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_insurance_contracts_updated_at
BEFORE UPDATE ON public.insurance_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();