-- 1. Ajouter les colonnes pour le système de numéro client
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS client_number text UNIQUE,
ADD COLUMN IF NOT EXISTS linked_to_client text,
ADD COLUMN IF NOT EXISTS household_role text DEFAULT 'titulaire';

-- 2. Créer la séquence pour le numéro client
CREATE SEQUENCE IF NOT EXISTS client_number_seq START 1;

-- 3. Fonction de génération du numéro client
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS text AS $$
BEGIN
  RETURN 'CLI-' || LPAD(nextval('client_number_seq')::text, 5, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4. Fonction trigger pour attribution automatique
CREATE OR REPLACE FUNCTION trigger_set_client_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_number IS NULL THEN
    NEW.client_number := generate_client_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 5. Trigger pour attribution automatique lors de l'insertion
DROP TRIGGER IF EXISTS set_client_number ON profiles;
CREATE TRIGGER set_client_number
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_client_number();

-- 6. Mettre à jour les profils existants avec un numéro client
UPDATE profiles 
SET client_number = generate_client_number()
WHERE client_number IS NULL;

-- 7. Créer un index pour les recherches par numéro client
CREATE INDEX IF NOT EXISTS idx_profiles_client_number ON profiles(client_number);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_to_client ON profiles(linked_to_client);

-- 8. Politique RLS pour permettre aux comptes liés de lire les dependants du titulaire
CREATE POLICY "Linked partners can view titulaire dependants"
ON dependants
FOR SELECT
USING (
  profile_id IN (
    SELECT p.id FROM profiles p
    WHERE p.client_number = (
      SELECT linked_to_client FROM profiles WHERE user_id = auth.uid()
    )
  )
);