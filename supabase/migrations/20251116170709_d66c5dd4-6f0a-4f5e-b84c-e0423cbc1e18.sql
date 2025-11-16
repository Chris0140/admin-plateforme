-- Create tax_data table
CREATE TABLE public.tax_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  canton TEXT NOT NULL,
  commune TEXT NOT NULL,
  etat_civil TEXT NOT NULL,
  confession TEXT,
  revenu_annuel NUMERIC NOT NULL DEFAULT 0,
  fortune NUMERIC DEFAULT 0,
  nombre_enfants INTEGER DEFAULT 0,
  deduction_3eme_pilier NUMERIC DEFAULT 0,
  interets_hypothecaires NUMERIC DEFAULT 0,
  autres_deductions NUMERIC DEFAULT 0,
  charges_sociales NUMERIC DEFAULT 0,
  impot_federal NUMERIC DEFAULT 0,
  impot_cantonal NUMERIC DEFAULT 0,
  impot_communal NUMERIC DEFAULT 0,
  impot_ecclesiastique NUMERIC DEFAULT 0,
  impot_fortune NUMERIC DEFAULT 0,
  total_impots NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tax data" 
ON public.tax_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax data" 
ON public.tax_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax data" 
ON public.tax_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax data" 
ON public.tax_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tax_data_updated_at
BEFORE UPDATE ON public.tax_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();