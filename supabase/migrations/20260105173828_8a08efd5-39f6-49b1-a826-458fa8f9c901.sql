-- Create investment_assets table
CREATE TABLE public.investment_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- actions, etf, crypto, obligations, immobilier, fonds, autres
  ticker_symbol TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC DEFAULT 0,
  purchase_date DATE,
  currency TEXT NOT NULL DEFAULT 'CHF',
  platform TEXT, -- broker/exchange name
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_assets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own assets"
ON public.investment_assets
FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own assets"
ON public.investment_assets
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own assets"
ON public.investment_assets
FOR UPDATE
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own assets"
ON public.investment_assets
FOR DELETE
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_investment_assets_updated_at
BEFORE UPDATE ON public.investment_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();