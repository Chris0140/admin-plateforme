-- Modifier la contrainte CHECK pour autoriser 'conjoint'
ALTER TABLE public.dependants DROP CONSTRAINT IF EXISTS dependants_relationship_check;

ALTER TABLE public.dependants ADD CONSTRAINT dependants_relationship_check 
CHECK (relationship = ANY (ARRAY['enfant'::text, 'conjoint'::text, 'autre'::text]));