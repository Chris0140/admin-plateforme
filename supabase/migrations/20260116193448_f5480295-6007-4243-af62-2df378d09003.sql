
-- Table des profils budget (Step 1)
CREATE TABLE public.budget_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  residence_status TEXT NOT NULL CHECK (residence_status IN ('resident', 'frontalier')),
  professional_status TEXT NOT NULL CHECK (professional_status IN ('employe', 'independant')),
  job_title TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des comptes budget
CREATE TABLE public.budget_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'courant' CHECK (account_type IN ('courant', 'epargne', 'autre')),
  bank_name TEXT NOT NULL,
  revenue_type TEXT NOT NULL DEFAULT 'regulier' CHECK (revenue_type IN ('regulier', 'variable')),
  accounting_day INTEGER NOT NULL DEFAULT 1 CHECK (accounting_day >= 1 AND accounting_day <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des revenus par compte
CREATE TABLE public.budget_account_revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.budget_accounts(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_account_revenues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_profiles
CREATE POLICY "Users can view their own budget profile"
  ON public.budget_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget profile"
  ON public.budget_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget profile"
  ON public.budget_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for budget_accounts
CREATE POLICY "Users can view their own budget accounts"
  ON public.budget_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget accounts"
  ON public.budget_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget accounts"
  ON public.budget_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget accounts"
  ON public.budget_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for budget_account_revenues
CREATE POLICY "Users can view their own account revenues"
  ON public.budget_account_revenues FOR SELECT
  USING (account_id IN (
    SELECT id FROM public.budget_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own account revenues"
  ON public.budget_account_revenues FOR INSERT
  WITH CHECK (account_id IN (
    SELECT id FROM public.budget_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own account revenues"
  ON public.budget_account_revenues FOR UPDATE
  USING (account_id IN (
    SELECT id FROM public.budget_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own account revenues"
  ON public.budget_account_revenues FOR DELETE
  USING (account_id IN (
    SELECT id FROM public.budget_accounts WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_budget_profiles_updated_at
  BEFORE UPDATE ON public.budget_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_accounts_updated_at
  BEFORE UPDATE ON public.budget_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
