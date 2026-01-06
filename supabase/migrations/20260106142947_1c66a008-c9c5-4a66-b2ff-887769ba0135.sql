-- Create table for AVS yearly incomes history
CREATE TABLE public.avs_yearly_incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avs_profile_id UUID NOT NULL REFERENCES public.avs_profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  income NUMERIC NOT NULL DEFAULT 0,
  is_estimated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(avs_profile_id, year)
);

-- Enable RLS
ALTER TABLE public.avs_yearly_incomes ENABLE ROW LEVEL SECURITY;

-- Create policies - users can manage their own yearly incomes through their AVS profiles
CREATE POLICY "Users can view their own AVS yearly incomes"
ON public.avs_yearly_incomes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avs_profiles ap
    JOIN public.profiles p ON ap.profile_id = p.id
    WHERE ap.id = avs_yearly_incomes.avs_profile_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own AVS yearly incomes"
ON public.avs_yearly_incomes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avs_profiles ap
    JOIN public.profiles p ON ap.profile_id = p.id
    WHERE ap.id = avs_yearly_incomes.avs_profile_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own AVS yearly incomes"
ON public.avs_yearly_incomes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.avs_profiles ap
    JOIN public.profiles p ON ap.profile_id = p.id
    WHERE ap.id = avs_yearly_incomes.avs_profile_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own AVS yearly incomes"
ON public.avs_yearly_incomes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.avs_profiles ap
    JOIN public.profiles p ON ap.profile_id = p.id
    WHERE ap.id = avs_yearly_incomes.avs_profile_id
    AND p.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_avs_yearly_incomes_updated_at
BEFORE UPDATE ON public.avs_yearly_incomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();