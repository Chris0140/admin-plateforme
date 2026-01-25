

## Plan : Agrégation Multi-Comptes sur le Hub des Comptes

### Objectif
Ajouter une section sous la grille des comptes permettant de selectionner plusieurs comptes et afficher un tableau recapitulatif des budgets combines.

---

### 1. Modifications de la Base de Donnees

**Probleme actuel** : La table `budget_monthly` n'a pas de colonne `account_id` - les donnees sont liees uniquement a `user_id`.

**Solution** : Ajouter une colonne `account_id` a la table `budget_monthly` pour lier chaque budget mensuel a un compte specifique.

```sql
ALTER TABLE budget_monthly 
ADD COLUMN account_id uuid REFERENCES budget_accounts(id);

-- Optionnel : Mettre a jour les contraintes d'unicite
ALTER TABLE budget_monthly 
DROP CONSTRAINT IF EXISTS budget_monthly_user_id_year_month_key;

ALTER TABLE budget_monthly 
ADD CONSTRAINT budget_monthly_user_account_year_month_key 
UNIQUE (user_id, account_id, year, month);
```

---

### 2. Nouveau Composant : AggregatedBudgetTable

**Fichier** : `src/components/budget/AggregatedBudgetTable.tsx`

**Structure** :
- Props : `selectedAccountIds: string[]`, `year: number`, `month: number`
- Fetch les donnees `budget_monthly` pour tous les comptes selectionnes
- Calcule les totaux agreges

**Colonnes du tableau** :
| Colonne | Description |
|---------|-------------|
| Compte | Nom de la banque |
| Revenus | Total des revenus (salaires + autres) |
| Depenses | Total des sorties |
| Solde | Restant (revenus - depenses) |
| **TOTAL** | Ligne de synthese agregee |

---

### 3. Modifications de AccountsHub.tsx

**Ajouts d'etat** :
```typescript
const [selectedForAggregation, setSelectedForAggregation] = useState<string[]>([]);
const [showAggregation, setShowAggregation] = useState(false);
const [aggregationMonth, setAggregationMonth] = useState(new Date().getMonth() + 1);
const [aggregationYear, setAggregationYear] = useState(new Date().getFullYear());
```

**UI Ajoutee** :
1. **Checkbox sur chaque AccountCard** : Permet de selectionner/deselectionner un compte pour l'agregation
2. **Barre d'actions flottante** : Apparait quand au moins 2 comptes sont selectionnes
   - Selecteurs mois/annee
   - Bouton "Voir le recapitulatif"
3. **Section Tableau** : Affichee sous la grille des comptes quand `showAggregation = true`

---

### 4. Structure du Code

```
src/
├── components/
│   └── budget/
│       ├── AccountCard.tsx          # + Checkbox de selection
│       ├── AggregatedBudgetTable.tsx # NOUVEAU
│       └── AggregationToolbar.tsx    # NOUVEAU - Barre d'outils
└── pages/
    └── budget/
        └── AccountsHub.tsx           # Integration
```

---

### 5. Design UI

**AccountCard modifie** :
- Checkbox discrete dans le coin superieur gauche
- Style visuel quand selectionne (bordure coloree, background leger)

**Barre d'outils d'agregation** (sticky en bas ou sous le header) :
```
[✓ 3 comptes selectionnes]  [Mois: Janvier ▼]  [Annee: 2026 ▼]  [Calculer le recapitulatif]
```

**Tableau de resultats** :
- Utilise les composants Shadcn Table
- Ligne de total en gras avec fond colore
- Indicateurs visuels (vert pour solde positif, rouge pour negatif)
- Icones TrendingUp/TrendingDown

---

### 6. Logique de Calcul

```typescript
interface AggregatedData {
  accountId: string;
  accountName: string;
  totalRevenus: number;
  totalSorties: number;
  solde: number;
}

// Fetch pour chaque compte selectionne
const fetchAggregatedData = async (accountIds: string[], year: number, month: number) => {
  const results = await Promise.all(
    accountIds.map(async (id) => {
      const { data } = await supabase
        .from("budget_monthly")
        .select("*")
        .eq("account_id", id)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();
      return { accountId: id, data };
    })
  );
  
  // Calculer les totaux
  const totals = results.reduce((acc, item) => ({
    totalRevenus: acc.totalRevenus + (item.data?.total_revenus || 0),
    totalSorties: acc.totalSorties + (item.data?.total_sorties || 0),
    solde: acc.solde + (item.data?.total_restant || 0),
  }), { totalRevenus: 0, totalSorties: 0, solde: 0 });
  
  return { details: results, totals };
};
```

---

### 7. Gestion Guest Mode

Pour les utilisateurs non connectes :
- Les donnees sont stockees dans localStorage avec la structure :
  ```json
  {
    "budget_monthly_guest": {
      "[accountId]_[year]_[month]": { ... }
    }
  }
  ```
- La logique d'agregation fonctionne de maniere identique

---

### 8. Etapes d'Implementation

1. **Migration DB** : Ajouter `account_id` a `budget_monthly`
2. **Creer AggregatedBudgetTable.tsx** : Composant tableau avec Shadcn
3. **Creer AggregationToolbar.tsx** : Barre de selection mois/annee
4. **Modifier AccountCard.tsx** : Ajouter checkbox de selection
5. **Modifier AccountsHub.tsx** : Integrer les nouveaux composants
6. **Adapter BudgetContent.tsx** : Sauvegarder avec `account_id`
7. **Tests** : Guest mode + Authenticated mode

