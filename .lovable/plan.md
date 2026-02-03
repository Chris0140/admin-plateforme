

## Reorganisation du Profil Utilisateur par Categories

### Objectif
Reorganiser le formulaire du profil en sections distinctes :
1. **Informations personnelles** : Nom, prenom, genre, date de naissance, etat civil
2. **Foyer** : Gestion des adultes (avec type de lien) et des enfants

### Migration de base de donnees requise

La table `profiles` necessite une nouvelle colonne pour le nombre d'adultes dans le foyer :

```sql
ALTER TABLE profiles 
ADD COLUMN nombre_adultes integer DEFAULT 0,
ADD COLUMN household_relationship text DEFAULT NULL;
```

- `nombre_adultes` : nombre d'adultes supplementaires dans le foyer (0 ou 1)
- `household_relationship` : 'marie', 'concubinage', 'partenaire_enregistre'

### Structure du formulaire

```text
+----------------------------------------------------------+
|                 INFORMATIONS PERSONNELLES                 |
|  Vos donnees d'identite                                   |
+----------------------------------------------------------+
|  +-------------------------+  +------------------------+  |
|  | Nom                    |  | Prenom                  |  |
|  +-------------------------+  +------------------------+  |
|  +-------------------------+  +------------------------+  |
|  | Genre (menu)           |  | Date de naissance       |  |
|  +-------------------------+  +------------------------+  |
|  +-------------------------+                              |
|  | Etat civil (menu)      |                              |
|  +-------------------------+                              |
+----------------------------------------------------------+
|                         FOYER                             |
|  Composition de votre foyer                               |
+----------------------------------------------------------+
|  +-------------------------+  +------------------------+  |
|  | Nombre d'adultes (0-1) |  | Lien (si >= 1)         |  |
|  +-------------------------+  +------------------------+  |
|                                                           |
|  [Si nombre_adultes = 1 : Onglet profil conjoint]        |
|  +-----------------------------------------------------+ |
|  | PROFIL DU CONJOINT/PARTENAIRE                       | |
|  | - Prenom, Nom, Genre, Date de naissance             | |
|  | - Statut professionnel, Profession, Revenu annuel   | |
|  +-----------------------------------------------------+ |
|                                                           |
|  +-------------------------+                              |
|  | Nombre d'enfants (0-20)|                              |
|  +-------------------------+                              |
|                                                           |
|  [Si nombre_enfants >= 1 : Formulaires dynamiques]       |
|  +-----------------------------------------------------+ |
|  | ENFANT 1 : Prenom, Nom, Date de naissance           | |
|  +-----------------------------------------------------+ |
|  | ENFANT 2 : Prenom, Nom, Date de naissance           | |
|  +-----------------------------------------------------+ |
+----------------------------------------------------------+
|                   SITUATION PROFESSIONNELLE               |
+----------------------------------------------------------+
|  +-------------------------+  +------------------------+  |
|  | Statut (menu)          |  | Profession              |  |
|  +-------------------------+  +------------------------+  |
|  +-----------------------------------------------------+ |
|  | Revenu annuel (CHF)                                 | |
|  +-----------------------------------------------------+ |
+----------------------------------------------------------+
|                      COORDONNEES                          |
+----------------------------------------------------------+
|  +-----------------------------------------------------+ |
|  | Email (lecture seule)                               | |
|  +-----------------------------------------------------+ |
|  +-------------------------+  +------------------------+  |
|  | Telephone              |  | Adresse                 |  |
|  +-------------------------+  +------------------------+  |
|  +-------------------------+                              |
|  | Localite               |                              |
|  +-------------------------+                              |
+----------------------------------------------------------+
|          [Enregistrer les modifications]                  |
+----------------------------------------------------------+
```

### Options du menu "Lien" (relation foyer)

```typescript
const householdRelationshipOptions = [
  { value: "marie", label: "Marie(e)" },
  { value: "concubinage", label: "Concubinage" },
  { value: "partenaire_enregistre", label: "Partenaire enregistre" },
];
```

### Gestion des adultes du foyer

La table `dependants` sera reutilisee avec `relationship = "conjoint"` ou `"partenaire"` :

| Champ | Description |
|-------|-------------|
| first_name | Prenom du conjoint/partenaire |
| last_name | Nom du conjoint/partenaire |
| date_of_birth | Date de naissance |
| gender | Genre |
| relationship | "conjoint" ou "partenaire" |

### Nouveau composant : AdultFormSection

Similaire a `ChildrenFormSection`, ce composant gerera :
- L'affichage conditionnel si `nombre_adultes >= 1`
- Le formulaire complet du conjoint/partenaire avec :
  - Informations personnelles (Prenom, Nom, Genre, Date de naissance)
  - Situation professionnelle (Statut, Profession, Revenu annuel)
- Sauvegarde dans la table `dependants` avec `relationship = "conjoint"`

### Modifications techniques

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonnes `nombre_adultes`, `household_relationship` |
| `src/components/profile/ProfileInformationsForm.tsx` | Reorganiser en sections avec separateurs visuels |
| `src/components/profile/AdultFormSection.tsx` | Nouveau composant pour gerer le profil adulte du foyer |
| `src/components/profile/ChildrenFormSection.tsx` | Aucune modification necessaire |
| `src/pages/UserProfile.tsx` | Mettre a jour le schema et la logique de sauvegarde |

### Schema Zod mis a jour

```typescript
const profileInfoSchema = z.object({
  // Informations personnelles
  nom: z.string().trim().min(1, "Le nom est requis"),
  prenom: z.string().trim().min(1, "Le prenom est requis"),
  gender: z.string().optional(),
  date_naissance: z.string().min(1, "La date de naissance est requise"),
  etat_civil: z.string().optional(),
  
  // Foyer
  nombre_adultes: z.number().min(0).max(1).optional(),
  household_relationship: z.string().optional(),
  nombre_enfants: z.number().min(0).max(20).optional(),
  
  // Situation professionnelle
  employment_status: z.string().optional(),
  profession: z.string().optional(),
  annual_income: z.number().min(0).optional(),
  
  // Coordonnees
  email: z.string().email(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  localite: z.string().min(1, "La localite est requise"),
});
```

### Interface AdultData

```typescript
interface AdultData {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  employment_status?: string;
  profession?: string;
  annual_income?: number;
}
```

### Logique conditionnelle

1. **Nombre d'adultes = 0** : Masquer le champ "Lien" et le formulaire adulte
2. **Nombre d'adultes = 1** : 
   - Afficher le menu "Lien" (Marie, Concubinage, Partenaire enregistre)
   - Afficher le formulaire complet du conjoint/partenaire
3. **Nombre d'enfants > 0** : Afficher les formulaires enfants (existant)

### Sauvegarde dans la base de donnees

Pour l'adulte du foyer, utilisation de la table `dependants` :

```typescript
// Sauvegarder le conjoint/partenaire
await supabase.from("dependants").upsert({
  profile_id: profileId,
  first_name: adultData.first_name,
  last_name: adultData.last_name,
  date_of_birth: adultData.date_of_birth,
  gender: adultData.gender,
  relationship: "conjoint", // ou "partenaire" selon household_relationship
});
```

Note : Les champs professionnels du conjoint (employment_status, profession, annual_income) ne sont pas stockes dans `dependants`. Une extension de la table serait necessaire pour les stocker, ou une table separee `household_adults`.

### Alternative : Extension de la table dependants

Pour stocker les informations professionnelles du conjoint, ajouter des colonnes a `dependants` :

```sql
ALTER TABLE dependants 
ADD COLUMN employment_status text DEFAULT NULL,
ADD COLUMN profession text DEFAULT NULL,
ADD COLUMN annual_income numeric DEFAULT 0;
```

### Comportement attendu

1. Le formulaire est divise en 4 sections visuellement distinctes
2. Le champ "Lien" n'apparait que si nombre_adultes >= 1
3. Le formulaire conjoint s'affiche comme un sous-onglet/accordion
4. Les enfants restent geres par le composant existant
5. Toutes les donnees sont synchronisees avec Supabase a l'enregistrement

