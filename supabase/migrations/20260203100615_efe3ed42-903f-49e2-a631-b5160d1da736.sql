-- Ajouter une colonne pour définir le lien parental de chaque enfant
-- 'principal' = enfant du profil principal uniquement
-- 'conjoint' = enfant du conjoint uniquement  
-- 'commun' = enfant commun aux deux parents
ALTER TABLE public.dependants 
ADD COLUMN parent_link text DEFAULT 'principal';

-- Mettre à jour les enfants existants comme "commun" par défaut s'il y a un conjoint
COMMENT ON COLUMN public.dependants.parent_link IS 'Lien parental: principal, conjoint, ou commun';