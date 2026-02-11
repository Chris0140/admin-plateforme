

## Refonte du graphique de retraite - Hauteurs proportionnelles au salaire

### Objectif
Transformer le graphique actuel (barres horizontales de hauteur fixe) en un vrai graphique proportionnel ou :
- **Avant la retraite** : une barre pleine representant le salaire annuel actuel (100% de la hauteur)
- **Apres la retraite** : les 3 rentes empilees (AVS + LPP + 3e pilier), dont la hauteur totale est proportionnelle au salaire, montrant visuellement le "gap" de revenu

### Donnees necessaires

Le salaire annuel est deja disponible dans la table `profiles.annual_income`. Il faut :
1. Le charger dans `Prevoyance.tsx`
2. Le passer au composant `RetirementChart`

### Nouveau design du graphique

```text
  Salaire actuel
  ┌───────────┐
  │           │  ┌─── 3e pilier ───┐  ← hauteur proportionnelle
  │  Salaire  │  ├─── 2e pilier ───┤
  │  annuel   │  ├─── AVS (1er) ───┤
  │  actuel   │  │                 │
  │           │  │   (gap vide)    │  ← zone vide = perte de revenu
  └───────────┘  └─────────────────┘
  aujourd'hui     65 ans → 85 ans
```

Le graphique utilisera Recharts (deja installe) avec un `BarChart` ou `AreaChart` pour avoir un rendu professionnel avec :
- Axe Y en CHF
- Axe X en ages
- Zone "salaire" avant 65 ans
- Zones empilees apres 65 ans
- Ligne de reference horizontale en pointille au niveau du salaire actuel (pour visualiser le gap)

### Fichiers a modifier

| Fichier | Changements |
|---------|-------------|
| `src/pages/Prevoyance.tsx` | Charger `annual_income` depuis le profil, le passer au chart |
| `src/components/prevoyance/RetirementChart.tsx` | Refonte complete avec Recharts, barres proportionnelles |

### Details techniques

**RetirementChart.tsx** - Nouvelle interface :
- Ajouter prop `annualSalary: number` pour le salaire avant retraite
- Utiliser `BarChart` de Recharts avec barres empilees
- Generer des donnees par tranche d'age (ex: une barre tous les 5 ans)
- Avant 65 ans : une seule barre "Salaire" a 100%
- Apres 65 ans : 3 barres empilees (AVS, LPP, 3e pilier)
- Ligne de reference (`ReferenceLine`) au niveau du salaire pour montrer la difference
- Couleurs distinctes pour chaque pilier avec legende
- Tooltip au survol montrant les montants

**Prevoyance.tsx** :
- Ajouter `annual_income` dans la requete `profiles` existante
- Passer la valeur au composant `RetirementChart`

### Rendu attendu

Le graphique montrera clairement :
1. Le salaire actuel comme reference visuelle (la "hauteur max")
2. L'addition des 3 rentes apres la retraite
3. Le "gap" entre le salaire et les rentes (zone vide au-dessus des rentes empilees)
4. Les montants en CHF sur l'axe Y et les ages sur l'axe X
