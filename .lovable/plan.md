

## Nettoyage de Insurance.tsx - Garder uniquement la nouvelle version

### Probleme identifie
Le fichier actuel contient deux systemes melanges :
- **Nouveau** : Grille de 4 cubes + modale d'ajout avec PDF
- **Ancien** : `InsuranceDetailPanel` avec sa propre logique de gestion

### Modifications a effectuer

**1. Retirer l'import de InsuranceDetailPanel :**
```tsx
// SUPPRIMER cette ligne
import InsuranceDetailPanel from "@/components/insurance/InsuranceDetailPanel";
```

**2. Simplifier la vue de detail (lignes 459-476) :**

Remplacer le bloc `InsuranceDetailPanel` par une liste simple des contrats avec :
- Bouton "Retour" pour revenir aux categories
- Liste des contrats existants avec options Modifier/Supprimer
- Zone d'upload de documents integree

**3. Structure finale du fichier :**

```
ETAT INITIAL (pas de categorie selectionnee) :
+--------------------------------------------------+
|  Grille 4 cubes (Maladie, Menage, Auto, Vie)     |
+--------------------------------------------------+
|  Prime totale: X CHF  |  Contrats actifs: X      |
+--------------------------------------------------+

ETAT DETAIL (categorie selectionnee) :
+--------------------------------------------------+
|  [← Retour] Contrats : Assurance Maladie         |
|  [+ Nouveau contrat] ← ouvre la modale PDF       |
+--------------------------------------------------+
|  Liste des contrats (cartes simples)             |
|  - Nom compagnie, N° police, prime               |
|  - Boutons Modifier / Supprimer                  |
+--------------------------------------------------+
|  (Si vide) Message "Aucun contrat"               |
+--------------------------------------------------+
```

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/pages/Insurance.tsx` | Nettoyer : retirer InsuranceDetailPanel, creer liste inline |
| `src/components/insurance/InsuranceDetailPanel.tsx` | Potentiellement supprimer si plus utilise |

### Details techniques

**Remplacer le bloc InsuranceDetailPanel (lignes 459-469) par :**

```tsx
{/* Bouton retour */}
<Button variant="ghost" onClick={handleBack} className="w-fit">
  <ArrowLeft className="mr-2 h-4 w-4" />
  Retour aux categories
</Button>

{/* Liste des contrats de cette categorie */}
<div className="space-y-4">
  {analysis?.contracts
    .filter(c => selectedCategory.types.includes(c.insurance_type))
    .map(contract => (
      <Card key={contract.id} className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{contract.company_name}</h4>
            <p className="text-sm text-muted-foreground">N° {contract.contract_number}</p>
          </div>
          <Badge>{contract.annual_premium.toLocaleString('fr-CH')} CHF/an</Badge>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm">Modifier</Button>
          <Button variant="outline" size="sm" className="text-destructive">Supprimer</Button>
        </div>
      </Card>
    ))}
</div>
```

### Impact
- Interface unifiee avec un seul systeme de navigation
- La modale d'ajout avec PDF devient le point central pour creer des contrats
- Suppression de la duplication du bouton "Nouveau contrat"
- Code plus simple et maintenable

