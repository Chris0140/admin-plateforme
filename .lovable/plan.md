
## Refonte de l'onglet "Informations" du Profil Utilisateur

### Objectif
Remplacer le contenu actuel de l'onglet "Informations" par un formulaire unique et simplifie avec les champs demandes.

### Migration de base de donnees requise

La table `profiles` necessite 2 nouvelles colonnes :

```sql
ALTER TABLE profiles 
ADD COLUMN employment_status text DEFAULT NULL,
ADD COLUMN annual_income numeric DEFAULT 0;
```

- `employment_status` : 'employe', 'independant', 'sans_activite'
- `annual_income` : revenu annuel brut en CHF

### Nouveau formulaire "Informations"

Le formulaire sera organise avec les champs suivants dans une grille responsive :

```text
+----------------------------------------------------------+
|                    Informations                           |
|  Vos donnees personnelles et professionnelles            |
+----------------------------------------------------------+
|  +-------------------------+  +------------------------+ |
|  | Nom                    |  | Prenom                  | |
|  +-------------------------+  +------------------------+ |
|  +-------------------------+  +------------------------+ |
|  | Genre (menu)           |  | Date de naissance       | |
|  +-------------------------+  +------------------------+ |
|  +-------------------------+  +------------------------+ |
|  | Etat civil (menu)      |  | Nombre d'enfants        | |
|  +-------------------------+  +------------------------+ |
|                                                          |
|  [Si nombre_enfants > 0 : formulaires dynamiques]       |
|                                                          |
|  +-------------------------+  +------------------------+ |
|  | Statut (menu)          |  | Profession              | |
|  +-------------------------+  +------------------------+ |
|  +----------------------------------------------------+ |
|  | Revenu annuel (CHF)                                | |
|  +----------------------------------------------------+ |
|                                                          |
|  COORDONNEES                                             |
|  +----------------------------------------------------+ |
|  | Email (lecture seule)                              | |
|  +----------------------------------------------------+ |
|  +-------------------------+  +------------------------+ |
|  | Telephone              |  | Adresse                 | |
|  +-------------------------+  +------------------------+ |
|  +-------------------------+  +------------------------+ |
|  | Localite               |  |                         | |
|  +-------------------------+  +------------------------+ |
+----------------------------------------------------------+
|          [Enregistrer les modifications]                 |
+----------------------------------------------------------+
```

### Champs du formulaire

| Champ | Type | Options/Validation |
|-------|------|-------------------|
| Nom | Input texte | Obligatoire |
| Prenom | Input texte | Obligatoire |
| Genre | Select | Homme, Femme, Autre |
| Date de naissance | Input date | Obligatoire |
| Etat civil | Select | Celibataire, Marie(e), Divorce(e), Veuf(ve) |
| Nombre d'enfants | Input number | 0-20, avec formulaires dynamiques si > 0 |
| Statut | Select | Employe, Independant, Sans activite |
| Profession | Input texte | Optionnel |
| Revenu annuel | Input number | En CHF, min 0 |
| Email | Input texte | Lecture seule |
| Telephone | Input tel | Optionnel |
| Adresse | Input texte | Optionnel |
| Localite | Input texte | Obligatoire |

### Options du menu Statut

```typescript
const statusOptions = [
  { value: "employe", label: "Employe" },
  { value: "independant", label: "Independant" },
  { value: "sans_activite", label: "Sans activite" },
];
```

### Elements supprimes

Les champs suivants seront retires de l'onglet Informations :
- Appellation (Monsieur/Madame)
- Nationalite
- Employeur
- Sexe (remplace par Genre)

### Modifications techniques

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonnes `employment_status`, `annual_income` |
| `src/pages/UserProfile.tsx` | Refonte de l'onglet Informations avec le nouveau formulaire |

### Schema de validation Zod mis a jour

```typescript
const profileSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis"),
  prenom: z.string().trim().min(1, "Le prenom est requis"),
  gender: z.string().optional(),
  date_naissance: z.string().min(1, "La date de naissance est requise"),
  etat_civil: z.string().optional(),
  nombre_enfants: z.number().min(0).max(20).optional(),
  employment_status: z.string().optional(),
  profession: z.string().optional(),
  annual_income: z.number().min(0).optional(),
  email: z.string().email(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  localite: z.string().min(1, "La localite est requise"),
});
```

### Gestion dynamique des enfants

La fonctionnalite existante `ChildrenFormSection` sera conservee :
- Si `nombre_enfants = 0` : rien n'est affiche
- Si `nombre_enfants >= 1` : formulaires dynamiques pour chaque enfant (Prenom, Nom, Date de naissance)

### Comportement attendu

1. L'utilisateur voit un formulaire unique et simplifie
2. Le bouton "Modifier" permet d'editer les champs
3. Le champ Email reste en lecture seule
4. Les enfants sont geres dynamiquement selon le nombre saisi
5. Le statut professionnel (employe/independant/sans activite) est un menu deroulant
6. Le revenu annuel est sauvegarde dans la nouvelle colonne `annual_income`
7. Sauvegarde vers Supabase au clic sur "Enregistrer"
