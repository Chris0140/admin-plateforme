-- Fonction pour synchroniser les données de prévoyance du budget vers prevoyance_data
CREATE OR REPLACE FUNCTION public.sync_budget_to_prevoyance()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer ou mettre à jour les données de prévoyance
  INSERT INTO public.prevoyance_data (
    user_id,
    avs_1er_pilier,
    lpp_2eme_pilier,
    pilier_3a,
    pilier_3b
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.avs_1er_pilier, 0),
    COALESCE(NEW.lpp_2eme_pilier, 0),
    COALESCE(NEW.pilier_3a, 0),
    COALESCE(NEW.pilier_3b, 0)
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    avs_1er_pilier = COALESCE(EXCLUDED.avs_1er_pilier, prevoyance_data.avs_1er_pilier),
    lpp_2eme_pilier = COALESCE(EXCLUDED.lpp_2eme_pilier, prevoyance_data.lpp_2eme_pilier),
    pilier_3a = COALESCE(EXCLUDED.pilier_3a, prevoyance_data.pilier_3a),
    pilier_3b = COALESCE(EXCLUDED.pilier_3b, prevoyance_data.pilier_3b),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ajouter une contrainte unique sur user_id pour permettre ON CONFLICT
ALTER TABLE public.prevoyance_data 
ADD CONSTRAINT prevoyance_data_user_id_unique UNIQUE (user_id);

-- Créer le trigger sur budget_data
CREATE TRIGGER sync_prevoyance_on_budget_change
  AFTER INSERT OR UPDATE OF avs_1er_pilier, lpp_2eme_pilier, pilier_3a, pilier_3b
  ON public.budget_data
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_budget_to_prevoyance();