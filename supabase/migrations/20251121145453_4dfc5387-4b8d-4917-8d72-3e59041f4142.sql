-- Create fixed_expenses table for user-defined recurring expenses
CREATE TABLE public.fixed_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'mensuel',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own fixed expenses"
ON public.fixed_expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fixed expenses"
ON public.fixed_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed expenses"
ON public.fixed_expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fixed expenses"
ON public.fixed_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_fixed_expenses_updated_at
BEFORE UPDATE ON public.fixed_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.fixed_expenses IS 'Dépenses fixes définies par l''utilisateur avec catégories personnalisables';
COMMENT ON COLUMN public.fixed_expenses.frequency IS 'Fréquence: mensuel, annuel';
COMMENT ON COLUMN public.fixed_expenses.category IS 'Catégorie de la dépense (ex: Abonnements, Assurances, Loisirs, etc.)';