

## Systeme hybride : Profil simple OU Compte lie par numero client

### Objectif
Permettre deux modes de gestion du conjoint/partenaire :
1. **Profil simple** : Le conjoint n'a pas de compte, ses informations sont gerees par le titulaire (systeme actuel)
2. **Compte lie** : Le conjoint possede son propre compte et le lie via un numero client unique

### Architecture du systeme

```text
+---------------------------+          +---------------------------+
|   OPTION 1: Profil simple |          |   OPTION 2: Compte lie    |
+---------------------------+          +---------------------------+
|                           |          |                           |
|   Titulaire (compte)      |          |   Titulaire (compte)      |
|   └── Conjoint (profil)   |          |   client_number: CLI-00042|
|       └── Enfants         |          |           ↑               |
|                           |          |   Conjoint (compte)       |
|   Tout stocke dans        |          |   linked_to_client:       |
|   table "dependants"      |          |   CLI-00042               |
|                           |          |                           |
+---------------------------+          +---------------------------+
```

### Modifications de la base de donnees

Nouvelles colonnes dans la table `profiles` :

| Colonne | Type | Description |
|---------|------|-------------|
| `client_number` | text UNIQUE | Numero client auto-genere (ex: CLI-00042) |
| `linked_to_client` | text | Numero client du titulaire (si compte lie) |
| `household_role` | text | Role: 'titulaire' ou 'linked_partner' |

Nouvelle fonction PostgreSQL :
- `generate_client_number()` : genere automatiquement CLI-XXXXX a la creation du profil

Nouveau trigger :
- Attribution automatique du numero client lors de l'insertion dans profiles

### Flux utilisateur

**Scenario A : Ajouter un conjoint sans compte (actuel)**

```text
1. Utilisateur clique "Ajouter au foyer"
2. Choix du lien (Marie, Concubinage, Partenaire enregistre)
3. Onglet Conjoint cree → saisie des infos
4. Donnees sauvegardees dans table "dependants"
```

**Scenario B : Lier un conjoint avec son propre compte**

```text
1. Titulaire : copie son numero client CLI-00042
2. Conjoint : cree son compte (inscription normale)
3. Conjoint : va dans son profil → bouton "Lier a un foyer"
4. Conjoint : saisit CLI-00042
5. Systeme : verifie et cree la liaison
6. Conjoint : voit les enfants partages du foyer
```

### Nouveaux composants UI

| Composant | Description |
|-----------|-------------|
| `ClientNumberCard.tsx` | Affiche le numero client avec bouton copier |
| `LinkToHouseholdDialog.tsx` | Dialog pour saisir un numero client et lier |

### Modifications des fichiers existants

| Fichier | Changements |
|---------|-------------|
| `UserProfile.tsx` | Afficher ClientNumberCard, detecter si compte lie |
| `AddHouseholdMemberDialog.tsx` | Ajouter option "Lier un compte existant" |
| `ProfileInformationsForm.tsx` | Afficher info de liaison si lie |

### Interface du dialog "Ajouter au foyer"

```text
┌──────────────────────────────────────────────┐
│         Ajouter au foyer                     │
├──────────────────────────────────────────────┤
│                                              │
│  [♥ Marie(e)]                               │
│     Vous etes legalement marie(e)            │
│                                              │
│  [👫 Concubinage]                            │
│     Vous vivez en couple sans etre marie(e)  │
│                                              │
│  [📄 Partenaire enregistre]                  │
│     Partenariat enregistre officiellement    │
│                                              │
│  ─────────── OU ───────────                  │
│                                              │
│  [🔗 Lier un compte existant]                │
│     Votre partenaire a deja un compte        │
│                                              │
└──────────────────────────────────────────────┘
```

### Affichage du numero client

Dans l'onglet "Mon profil", nouvelle section :

```text
┌─────────────────────────────────────┐
│  📋 Votre numero client             │
│                                     │
│  CLI-00042          [📋 Copier]     │
│                                     │
│  Partagez ce numero avec votre      │
│  conjoint pour lier vos comptes     │
└─────────────────────────────────────┘
```

### Regles de gestion

1. Chaque compte recoit automatiquement un numero client unique
2. Un titulaire ne peut avoir qu'un seul compte lie
3. Un compte ne peut etre lie qu'a un seul titulaire
4. Les enfants du titulaire sont visibles par le compte lie
5. Le conjoint peut choisir de se delier (retour a l'independance)
6. Si un conjoint simple existe deja, impossible de lier un compte (et vice versa)

### Migration SQL

```sql
-- 1. Ajouter les colonnes
ALTER TABLE profiles
ADD COLUMN client_number text UNIQUE,
ADD COLUMN linked_to_client text,
ADD COLUMN household_role text DEFAULT 'titulaire';

-- 2. Creer la sequence pour le numero client
CREATE SEQUENCE IF NOT EXISTS client_number_seq START 1;

-- 3. Fonction de generation
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS text AS $$
BEGIN
  RETURN 'CLI-' || LPAD(nextval('client_number_seq')::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour attribution automatique
CREATE TRIGGER set_client_number
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.client_number IS NULL)
  EXECUTE FUNCTION trigger_set_client_number();

-- 5. Mettre a jour les profils existants
UPDATE profiles 
SET client_number = generate_client_number()
WHERE client_number IS NULL;
```

### Acces aux donnees partagees

Quand un compte est lie (`linked_to_client` non null) :
- Recuperer le `profile_id` du titulaire via `client_number`
- Lire les enfants de ce profil
- Afficher en lecture seule ou avec droits limites

### Securite RLS

Nouvelles policies pour permettre :
- Lecture des dependants du titulaire pour le compte lie
- Pas de modification des dependants par le compte lie (lecture seule)

### Resume des etapes d'implementation

1. **Migration BDD** : Ajouter colonnes, fonction, trigger, mettre a jour les profils existants
2. **ClientNumberCard** : Composant d'affichage du numero avec copie
3. **LinkToHouseholdDialog** : Dialog pour lier via numero client
4. **Modifier AddHouseholdMemberDialog** : Ajouter l'option "Lier un compte"
5. **Modifier UserProfile** : Integrer ClientNumberCard et logique de liaison
6. **Adapter RLS** : Policies pour acces partage des dependants

