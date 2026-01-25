

## Refonte de la page Assurances - Layout interactif avec cubes cliquables

### Vue d'ensemble du nouveau layout

```
+------------------+------------------------------------------+
|    PANNEAU       |           GRILLE CUBES                   |
|    GAUCHE        |        (zone centrale)                   |
|                  |                                          |
| + Ajouter        |  [LAMal]     [LCA]      [Menage]         |
|   contrat        |  [RC]       [Vehicule]  [Juridique]      |
|   (formulaire    |  [Vie]      [Invalidite] [Perte gain]    |
|    ou dialog)    |                                          |
|                  |  clic = ouvre panneau droit              |
+------------------+------------------------------------------+
|          TOTAUX DISCRETS (bandeau bas bg-background)        |
+-------------------------------------------------------------+
```

```
Apres clic sur un cube:

+----------------+--------------------+----------------------+
|   PANNEAU      |    GRILLE CUBES    |   PANNEAU DETAIL     |
|   GAUCHE       |    (plus petit)    |                      |
|                |                    | Contrats du type     |
| + Ajouter      |  [LAMal] [LCA]     | selectionne          |
|   contrat      |  [RC]   [...]      |                      |
|                |                    | + Ajouter document   |
|                |                    | + Modifier details   |
+----------------+--------------------+----------------------+
```

### Fichiers a creer

**1. `src/components/insurance/InsuranceTypeCube.tsx`**
- Cube cliquable representant un type d'assurance
- Props: `type`, `label`, `icon`, `contractCount`, `totalPremium`, `isSelected`, `onClick`
- Style: bordure arrondie, icone centree, effet hover scale + ombre
- Etat actif: bordure primary, fond leger primary/10

**2. `src/components/insurance/InsuranceDetailPanel.tsx`**
- Panneau lateral droit (slide-in animation)
- Affiche:
  - Titre du type d'assurance selectionne
  - Liste des contrats existants (cartes compactes)
  - Bouton "Ajouter un document" pour chaque contrat
  - Bouton "Modifier" pour editer les details
  - Bouton fermer (X)
- Fonctionnalites:
  - Upload de documents (utilise le storage bucket "documents")
  - Edition inline des contrats
  - Suppression avec confirmation

**3. `src/components/insurance/InsuranceAddPanel.tsx`**
- Panneau gauche fixe
- Contient le bouton "Ajouter une assurance"
- Au clic, ouvre un dialog avec le formulaire existant `InsuranceContractForm`
- Style compact et discret

### Fichiers a modifier

**4. `src/pages/Insurance.tsx`** (refonte complete)
- Nouveau layout en colonnes flexbox/grid
- Gestion de l'etat:
  - `selectedType`: type d'assurance selectionne (null = panneau droit ferme)
  - `showAddForm`: boolean pour afficher le dialog d'ajout
- Grille de 9 cubes au centre
- Panneau gauche toujours visible
- Panneau droit conditionnel (visible si `selectedType !== null`)
- Bandeau totaux en bas avec style discret

### Details des 9 cubes

| Type | Label | Icone Lucide |
|------|-------|--------------|
| health_basic | LAMal | Heart |
| health_complementary | LCA | HeartPulse |
| household | Menage | Home |
| liability | RC | Scale |
| vehicle | Vehicule | Car |
| legal_protection | Juridique | Gavel |
| life | Vie | Users |
| disability | Invalidite | Accessibility |
| loss_of_earnings | Perte de gain | TrendingDown |

### Gestion des documents

- Utiliser le bucket Supabase Storage "documents" existant
- Structure de path: `insurance/{profile_id}/{contract_id}/{filename}`
- Ajouter une table ou un champ pour stocker les references des documents
- Afficher la liste des documents dans le panneau detail avec possibilite de telecharger/supprimer

### Style et animations

- Cubes: `hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg`
- Panneau droit: `animate-slide-in-right` (deja defini dans tailwind.config)
- Totaux: `bg-background text-sm text-muted-foreground` au lieu de cards glass
- Cube actif: `border-2 border-primary bg-primary/5`

### Responsive (mobile)

- Sur ecrans < 768px:
  - Layout en colonne empilee
  - Panneau detail devient un Drawer (tiroir du bas) avec le composant vaul existant
  - Cubes en grille 2x5 au lieu de 3x3

