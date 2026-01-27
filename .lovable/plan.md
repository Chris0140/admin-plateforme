

## Suppression de InsuranceAddPanel.tsx

### Objectif
Supprimer le composant `InsuranceAddPanel` et reorganiser l'interface des assurances.

### Fichiers a modifier

**1. Supprimer le fichier:**
- `src/components/insurance/InsuranceAddPanel.tsx`

**2. Modifier `src/pages/Insurance.tsx`:**
- Retirer l'import de `InsuranceAddPanel`
- Retirer le bloc JSX du panneau gauche (lignes 150-160)
- Integrer les fonctionnalites essentielles directement:
  - Bouton "Retour aux categories" → Deplacer dans `InsuranceDetailPanel`
  - Bouton "Ajouter une assurance" → Deplacer dans la vue principale ou dans `InsuranceDetailPanel`
  - Upload de documents → Deplacer dans `InsuranceDetailPanel`

### Nouveau layout propose

```
AVANT selection:
+--------------------------------------------------+
|              GRILLE CUBES                        |
|  [LAMal] [Complementaire] [Menage] [RC]          |
|  [Vehicule] [Juridique] [Vie] [Invalidite]       |
+--------------------------------------------------+
|  + Ajouter une assurance (bouton centre en bas)  |
+--------------------------------------------------+

APRES selection d'un cube:
+--------------------------------------------------+
|  [← Retour] LAMal                                |
+--------------------------------------------------+
|                                                  |
|  Liste des contrats + Details                    |
|  Zone upload documents                           |
|  + Nouveau contrat                               |
|                                                  |
+--------------------------------------------------+
```

### Details techniques

**Modification de `Insurance.tsx`:**
```tsx
// Retirer:
import InsuranceAddPanel from "@/components/insurance/InsuranceAddPanel";

// Retirer le bloc:
<div className={`${isMobile ? 'w-full' : selectedType ? 'w-64' : 'w-48'} flex-shrink-0`}>
  <InsuranceAddPanel ... />
</div>

// Ajouter un bouton "Ajouter" dans la vue principale (quand pas de selection)
// Le bouton retour et upload seront dans InsuranceDetailPanel
```

**Modification de `InsuranceDetailPanel.tsx`:**
- Ajouter un header avec bouton retour et label du type
- Integrer le composant `InsuranceDocumentUpload` pour les documents
- Ajouter le bouton "Nouveau contrat" dans ce panneau

### Impact
- Interface plus epuree sans panneau gauche permanent
- Toute la gestion se fait dans un seul panneau central/droit
- Upload de documents accessible depuis le panneau de details

