-- Create budget_data table to store user budget information
CREATE TABLE public.budget_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'mensuel',
  revenu_brut NUMERIC DEFAULT 0,
  charges_sociales NUMERIC DEFAULT 0,
  depenses_logement NUMERIC DEFAULT 0,
  depenses_transport NUMERIC DEFAULT 0,
  depenses_alimentation NUMERIC DEFAULT 0,
  autres_depenses NUMERIC DEFAULT 0,
  avs_1er_pilier NUMERIC DEFAULT 0,
  lpp_2eme_pilier NUMERIC DEFAULT 0,
  pilier_3a NUMERIC DEFAULT 0,
  pilier_3b NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.budget_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own budget data"
ON public.budget_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget data"
ON public.budget_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget data"
ON public.budget_data
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget data"
ON public.budget_data
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_budget_data_updated_at
BEFORE UPDATE ON public.budget_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();