-- Create prevoyance_data table
CREATE TABLE public.prevoyance_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avs_1er_pilier NUMERIC DEFAULT 0,
  lpp_2eme_pilier NUMERIC DEFAULT 0,
  pilier_3a NUMERIC DEFAULT 0,
  pilier_3b NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prevoyance_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own prevoyance data" 
ON public.prevoyance_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prevoyance data" 
ON public.prevoyance_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prevoyance data" 
ON public.prevoyance_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prevoyance data" 
ON public.prevoyance_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_prevoyance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prevoyance_data_updated_at
BEFORE UPDATE ON public.prevoyance_data
FOR EACH ROW
EXECUTE FUNCTION public.update_prevoyance_updated_at();