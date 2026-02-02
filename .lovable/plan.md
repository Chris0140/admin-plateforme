

## Refonte de la page Prevoyance - Nouveau design visuel

### Objectif
Transformer la page `/prevoyance` pour adopter le style visuel de l'image de reference avec :
- 3 grands cubes arrondis pour les piliers (1er, 2eme, 3eme)
- Une barre horizontale avec 3 boutons-pilules (Ma retraite, Invalidite, Deces)

### Nouveau layout propose

```
+----------------------------------------------------------+
|                    Prevoyance                             |
|      Vue d'ensemble de votre prevoyance suisse           |
+----------------------------------------------------------+
|                                                          |
|  +---------------+  +---------------+  +---------------+ |
|  |               |  |               |  |               | |
|  |   1er pilier  |  |  2eme pilier  |  |  3eme pilier  | |
|  |               |  |               |  |               | |
|  +---------------+  +---------------+  +---------------+ |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  +---------------------------------------------------+   |
|  | [Ma retraite]    [Invalidite]        [Deces]     |   |
|  +---------------------------------------------------+   |
|                                                          |
+----------------------------------------------------------+
```

### Details techniques

**Fichier a modifier : `src/pages/Prevoyance.tsx`**

**1. Creer les 3 cubes de piliers :**
- Grands rectangles arrondis (rounded-2xl ou rounded-3xl)
- Fond clair/gris sur fond sombre (bg-muted ou bg-card)
- Hauteur fixe ~180-200px
- Texte centre "1er pilier", "2eme pilier", "3eme pilier"
- Cliquables pour naviguer vers les sous-pages existantes

**2. Creer la barre de navigation horizontale :**
- Conteneur horizontal avec fond gradie (bg-gradient-to-r from-muted/50 to-muted)
- 3 boutons en forme de pilule (rounded-full)
- Labels : "Ma retraite", "Invalidite", "Deces"
- Les boutons afficheront les donnees correspondantes selon la vue selectionnee

**3. Logique de vue par type :**
- Etat `selectedView`: 'retraite' | 'invalidite' | 'deces'
- Chaque vue affiche les montants pertinents des 3 piliers :
  - **Ma retraite** : Rentes AVS + LPP + 3e pilier a 65 ans
  - **Invalidite** : Rentes invalidite des 3 piliers
  - **Deces** : Capitaux deces / rentes survivants

**4. Structure du composant :**

```tsx
// Configuration des piliers
const PILLARS = [
  { id: '1er', label: '1er pilier', path: '/prevoyance/avs' },
  { id: '2eme', label: '2eme pilier', path: '/prevoyance/lpp' },
  { id: '3eme', label: '3eme pilier', path: '/prevoyance/3e-pilier' },
];

// Configuration des vues
const VIEWS = [
  { id: 'retraite', label: 'Ma retraite' },
  { id: 'invalidite', label: 'Invalidite' },
  { id: 'deces', label: 'Deces' },
];
```

**5. Styles CSS (Tailwind) :**

```tsx
// Cube de pilier
<button className="
  bg-muted/80 hover:bg-muted 
  rounded-2xl 
  h-40 md:h-48 
  flex items-center justify-center
  transition-all duration-300
  hover:scale-[1.02] hover:shadow-xl
  cursor-pointer
  border border-border/50
">
  <span className="text-lg font-medium text-foreground">1er pilier</span>
</button>

// Barre de navigation
<div className="
  bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30
  rounded-full
  p-2
  flex items-center justify-center gap-4
">
  <button className="
    bg-background 
    rounded-full 
    px-8 py-3
    shadow-md
    hover:shadow-lg
    transition-all
  ">
    Ma retraite
  </button>
</div>
```

### Gestion des donnees

Les donnees existantes seront reutilisees :
- `avsTotalRent` : Rente AVS vieillesse
- `lppSummary.total_annual_rent_65` : Rente LPP
- `thirdPillarSummary.totalProjectedAnnualRent` : Rente 3e pilier

Nouvelles donnees a afficher selon la vue :
- **Invalidite** : `lppSummary.disability_rent`, `thirdPillarSummary.disabilityRent`
- **Deces** : `lppSummary.death_capital`, `thirdPillarSummary.deathCapital`

### Impact

| Fichier | Action |
|---------|--------|
| `src/pages/Prevoyance.tsx` | Refonte complete du JSX avec le nouveau design |

### Comportement attendu

1. **Vue initiale** : Grille 3 cubes + barre avec "Ma retraite" selectionne par defaut
2. **Clic sur un cube** : Navigation vers la page detail du pilier
3. **Clic sur un bouton de la barre** : Change la vue pour afficher les montants correspondants sous les cubes
4. **Responsive** : Cubes empiles sur mobile, barre s'adapte

