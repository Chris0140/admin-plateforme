-- Supprimer les triggers qui causent la récursion infinie
DROP TRIGGER IF EXISTS sync_prevoyance_on_budget_change ON public.budget_data;
DROP TRIGGER IF EXISTS sync_budget_on_prevoyance_change ON public.prevoyance_data;

-- Supprimer les fonctions associées
DROP FUNCTION IF EXISTS public.sync_budget_to_prevoyance();
DROP FUNCTION IF EXISTS public.sync_prevoyance_to_budget();