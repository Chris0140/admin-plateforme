-- Fonction pour synchroniser les données de prévoyance du profil vers le budget
CREATE OR REPLACE FUNCTION public.sync_prevoyance_to_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les données de prévoyance dans budget_data
  UPDATE public.budget_data
  SET
    avs_1er_pilier = NEW.avs_1er_pilier,
    lpp_2eme_pilier = NEW.lpp_2eme_pilier,
    pilier_3a = NEW.pilier_3a,
    pilier_3b = NEW.pilier_3b,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Si aucune ligne n'a été mise à jour (budget pas encore créé), ne rien faire
  -- Le budget sera créé avec ces valeurs lors de la première sauvegarde
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur prevoyance_data
CREATE TRIGGER sync_budget_on_prevoyance_change
  AFTER INSERT OR UPDATE OF avs_1er_pilier, lpp_2eme_pilier, pilier_3a, pilier_3b
  ON public.prevoyance_data
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_prevoyance_to_budget();