

## Affichage des onglets profil en barre horizontale avec icones

### Objectif
Transformer l'interface du profil utilisateur pour utiliser une barre d'onglets horizontale similaire a l'image de reference, avec des icones pour chaque onglet.

### Design de la barre d'onglets

```text
+------------------------------------------------------------------+
|                      Profil utilisateur                           |
+------------------------------------------------------------------+
| [👤 Mon profil]  [👫 Conjoint/Partenaire]  [+ Ajouter au foyer]  |
+------------------------------------------------------------------+
|                                                                   |
|  Contenu de l'onglet actif...                                    |
|                                                                   |
+------------------------------------------------------------------+
```

### Style de la barre d'onglets

Basee sur l'image de reference, la barre d'onglets aura :
- Fond sombre avec bordure inferieure
- Onglets avec icone a gauche du texte
- Onglet actif mis en surbrillance
- Espacement regulier entre les onglets
- Transition fluide au changement d'onglet

### Implementation technique

#### Composant Tabs (Radix UI)

Utilisation du composant Tabs existant avec personnalisation du style :

```typescript
<Tabs defaultValue="mon-profil" className="w-full">
  <TabsList className="w-full justify-start bg-card border-b rounded-none px-0">
    <TabsTrigger value="mon-profil" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
      <User className="h-4 w-4 mr-2" />
      Mon profil
    </TabsTrigger>
    {hasPartner && (
      <TabsTrigger value="conjoint">
        <Users className="h-4 w-4 mr-2" />
        Conjoint/Partenaire
      </TabsTrigger>
    )}
    {!hasPartner && (
      <Button variant="ghost" onClick={openAddDialog}>
        <UserPlus className="h-4 w-4 mr-2" />
        Ajouter au foyer
      </Button>
    )}
  </TabsList>
  
  <TabsContent value="mon-profil">
    {/* Formulaire profil principal */}
  </TabsContent>
  
  <TabsContent value="conjoint">
    {/* Formulaire conjoint */}
  </TabsContent>
</Tabs>
```

### Modifications techniques

| Fichier | Action |
|---------|--------|
| `src/pages/UserProfile.tsx` | Ajouter le systeme d'onglets avec Tabs |
| `src/components/profile/ProfileInformationsForm.tsx` | Adapter en tant que contenu d'onglet |
| Nouveau: `src/components/profile/AddHouseholdMemberDialog.tsx` | Dialog pour ajouter un membre |
| Nouveau: `src/components/profile/PartnerProfileTab.tsx` | Formulaire complet du conjoint |

### Structure des onglets

| Onglet | Icone | Visible si |
|--------|-------|------------|
| Mon profil | User | Toujours |
| Conjoint/Partenaire | Users | nombre_adultes >= 1 |
| + Ajouter au foyer | UserPlus | nombre_adultes === 0 (bouton, pas onglet) |

### Styles CSS pour la barre d'onglets

```typescript
// TabsList personnalise
className="w-full justify-start bg-card/50 backdrop-blur border-b rounded-none h-12 p-0 gap-0"

// TabsTrigger personnalise
className="h-full px-6 rounded-none border-b-2 border-transparent 
           data-[state=active]:border-primary data-[state=active]:bg-transparent
           data-[state=active]:text-primary transition-all"
```

### Composant AddHouseholdMemberDialog

Dialog qui s'ouvre au clic sur "+ Ajouter au foyer" :

```typescript
interface AddHouseholdMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRelationship: (relationship: string) => void;
}

// Options affichees :
// - Marie(e)
// - Concubinage
// - Partenaire enregistre
```

### Composant PartnerProfileTab

Formulaire complet pour le conjoint dans son propre onglet :
- Affichage du type de lien en haut
- Informations personnelles (Prenom, Nom, Genre, Date de naissance)
- Situation professionnelle (Statut, Profession, Revenu annuel)
- Bouton "Supprimer ce profil"

### Section Foyer dans "Mon profil"

Une fois un conjoint ajoute, la section Foyer du profil principal affiche :
- Resume du conjoint avec nom, prenom et lien
- Lien "Voir le profil" qui switch vers l'onglet Conjoint
- Gestion des enfants (inchangee)

### Flux utilisateur

1. L'utilisateur arrive → onglet "Mon profil" actif
2. S'il n'a pas de conjoint → bouton "+ Ajouter au foyer" visible
3. Clic sur le bouton → dialog avec choix du lien
4. Selection → onglet "Conjoint/Partenaire" cree et actif
5. Dans "Mon profil", resume du conjoint avec lien vers son onglet
6. Possibilite de supprimer le conjoint depuis son onglet

### Comportement attendu

1. Barre d'onglets horizontale avec icones style dark/glassmorphism
2. Onglet actif souligne avec la couleur primary
3. Bouton d'ajout integre a la barre (pas un onglet)
4. Transition fluide entre les onglets
5. Formulaire complet du conjoint dans son propre onglet
6. Resume visible dans le profil principal

