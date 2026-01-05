-- Create table for monthly salaries
CREATE TABLE public.monthly_salaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  nom TEXT NOT NULL DEFAULT 'Salaire',
  brut NUMERIC DEFAULT 0,
  charges NUMERIC DEFAULT 0,
  net NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for monthly other revenues
CREATE TABLE public.monthly_other_revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  nom TEXT NOT NULL DEFAULT 'Autre revenu',
  montant NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monthly_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_other_revenues ENABLE ROW LEVEL SECURITY;

-- Create policies for monthly_salaries
CREATE POLICY "Users can view their own salaries" 
ON public.monthly_salaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own salaries" 
ON public.monthly_salaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salaries" 
ON public.monthly_salaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salaries" 
ON public.monthly_salaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for monthly_other_revenues
CREATE POLICY "Users can view their own other revenues" 
ON public.monthly_other_revenues 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own other revenues" 
ON public.monthly_other_revenues 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own other revenues" 
ON public.monthly_other_revenues 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own other revenues" 
ON public.monthly_other_revenues 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_monthly_salaries_user_year_month ON public.monthly_salaries(user_id, year, month);
CREATE INDEX idx_monthly_other_revenues_user_year_month ON public.monthly_other_revenues(user_id, year, month);