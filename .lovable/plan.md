

## Suppression des cubes du centre après sélection

### Modification du layout dans `src/pages/Insurance.tsx`

**Comportement actuel:**
```
+------------------+------------------------+------------------+
|    GAUCHE        |    GRILLE CUBES       |     DROITE       |
|   (Add Panel)    |    (toujours visible) |   (Détails)      |
+------------------+------------------------+------------------+
```

**Nouveau comportement:**
```
AVANT sélection:
+------------------+------------------------------------------+
|    GAUCHE        |           GRILLE CUBES                   |
| + Ajouter        |  [Santé] [Ménage] [RC] [Véhicule]        |
|   assurance      |  [Juridique] [Vie] [Invalidité] [Perte]  |
+------------------+------------------------------------------+

APRÈS sélection d'un cube:
+---------------------------+--------------------------------+
|         GAUCHE            |           DROITE               |
|                           |                                |
|  Type sélectionné:        |  Détails du contrat            |
|  [Assurance maladie]      |                                |
|                           |  - Formulaire                  |
|  + Ajouter document PDF   |  - Champs du contrat           |
|                           |  - (futur: auto-remplissage)   |
|  Documents uploadés:      |                                |
|  [police.pdf]             |                                |
+---------------------------+--------------------------------+
```

### Modifications a effectuer

**1. `src/pages/Insurance.tsx`**
- Condition d'affichage: `{!selectedType && (...grille cubes...)}`
- Quand `selectedType !== null`:
  - Masquer completement la grille de cubes du centre
  - Layout en 2 colonnes: gauche (upload) + droite (details)
- Ajouter l'info du type selectionne dans le panneau gauche

```tsx
{/* Layout principal */}
<div className="flex flex-1 gap-6">
  {/* Panneau gauche */}
  <div className="w-64 flex-shrink-0">
    <InsuranceAddPanel
      selectedType={selectedType}
      selectedTypeLabel={selectedTypeLabel}
      // ... autres props pour upload
    />
  </div>

  {/* Centre: Cubes - UNIQUEMENT si aucun type selectionne */}
  {!selectedType && (
    <div className="flex-1">
      <div className="grid gap-4 grid-cols-3">
        {INSURANCE_TYPES.map((config) => (
          <InsuranceTypeCube ... />
        ))}
      </div>
    </div>
  )}

  {/* Droite: Details - UNIQUEMENT si type selectionne */}
  {selectedType && (
    <div className="flex-1 border-l pl-6">
      <InsuranceDetailPanel ... />
    </div>
  )}
</div>
```

**2. `src/components/insurance/InsuranceAddPanel.tsx`**
- Ajouter props: `selectedType`, `selectedTypeLabel`
- Afficher le type selectionne avec bouton retour
- Ajouter la zone d'upload de documents
- Structure du panneau apres selection:
  - Badge/indicateur du type selectionne
  - Bouton "Retour aux categories" (reinitialise `selectedType`)
  - Separateur
  - Zone upload documents
  - Liste des documents uploades

**3. Nouveau composant `src/components/insurance/InsuranceDocumentUpload.tsx`**
- Zone de drop ou bouton "Choisir un fichier"
- Formats acceptes: PDF, images, documents Office
- Limite: 10MB par fichier
- Progress bar pendant upload
- Integration Supabase Storage (bucket "documents")

**4. Modification base de donnees**
- Ajouter colonne `contract_id` a la table `documents`
- Mettre a jour les politiques RLS

### Flux utilisateur

1. L'utilisateur voit la grille de 8 cubes
2. Il clique sur "Assurance maladie"
3. La grille disparait completement
4. Le panneau gauche affiche:
   - "Assurance maladie" avec bouton retour
   - Zone d'upload de documents
5. Le panneau droit affiche les details/contrats
6. L'utilisateur peut uploader des PDF
7. Clic sur "Retour" pour revenir a la grille de cubes

### Responsive mobile

- Sur mobile: meme logique, mais layout empile verticalement
- Le panneau details reste un Drawer

