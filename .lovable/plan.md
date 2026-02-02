

## Ajout de la gestion dynamique des enfants dans le formulaire Profil

### Objectif
Quand l'utilisateur indique un nombre d'enfants superieur a 0, afficher dynamiquement des formulaires pour renseigner le nom, prenom et date de naissance de chaque enfant.

### Structure de donnees existante

**Aucune migration necessaire** - Les tables existent deja :

| Table | Champs utilises |
|-------|-----------------|
| `profiles` | `nombre_enfants` (number) |
| `dependants` | `first_name`, `last_name`, `date_of_birth`, `profile_id`, `relationship` |

### Comportement attendu

1. **nombre_enfants = 0** : Rien de supplementaire n'est affiche
2. **nombre_enfants >= 1** : Pour chaque enfant, afficher 3 champs :
   - Prenom de l'enfant
   - Nom de l'enfant  
   - Date de naissance de l'enfant

### Modifications a effectuer

**Fichier : `src/pages/Profile.tsx`**

#### 1. Ajouter un type pour les enfants

```typescript
interface ChildData {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}
```

#### 2. Ajouter un state pour les enfants

```typescript
const [children, setChildren] = useState<ChildData[]>([]);
```

#### 3. Synchroniser le nombre d'enfants avec le tableau

Quand `nombre_enfants` change :
- Si le nombre augmente : ajouter des objets vides au tableau
- Si le nombre diminue : tronquer le tableau

```typescript
const handleChildrenCountChange = (count: number) => {
  const newCount = Math.max(0, Math.min(20, count));
  handleChange("nombre_enfants", newCount.toString());
  
  setChildren(prev => {
    if (newCount > prev.length) {
      // Ajouter des enfants vides
      const newChildren = [...prev];
      for (let i = prev.length; i < newCount; i++) {
        newChildren.push({ first_name: "", last_name: "", date_of_birth: "" });
      }
      return newChildren;
    } else {
      // Tronquer le tableau
      return prev.slice(0, newCount);
    }
  });
};
```

#### 4. Afficher dynamiquement les formulaires enfants

```text
+----------------------------------------------------------+
|  Nombre d'enfants: [2]                                    |
+----------------------------------------------------------+
|  ENFANT 1                                                 |
|  +-------------------------+  +------------------------+  |
|  | Prenom                  |  | Nom                    |  |
|  +-------------------------+  +------------------------+  |
|  +----------------------------------------------------+  |
|  | Date de naissance                                  |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
|  ENFANT 2                                                 |
|  +-------------------------+  +------------------------+  |
|  | Prenom                  |  | Nom                    |  |
|  +-------------------------+  +------------------------+  |
|  +----------------------------------------------------+  |
|  | Date de naissance                                  |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

#### 5. Charger les enfants existants depuis la base

Dans `fetchProfile` :

```typescript
// Charger les enfants depuis la table dependants
const { data: dependants } = await supabase
  .from("dependants")
  .select("*")
  .eq("profile_id", profile.id)
  .eq("relationship", "enfant");

if (dependants) {
  setChildren(dependants.map(d => ({
    id: d.id,
    first_name: d.first_name,
    last_name: d.last_name,
    date_of_birth: d.date_of_birth,
  })));
}
```

#### 6. Sauvegarder les enfants

Dans `handleSubmit` :

```typescript
// Supprimer les anciens enfants
await supabase
  .from("dependants")
  .delete()
  .eq("profile_id", profileId)
  .eq("relationship", "enfant");

// Inserer les nouveaux enfants
if (children.length > 0) {
  const childrenToInsert = children
    .filter(c => c.first_name && c.last_name && c.date_of_birth)
    .map(c => ({
      profile_id: profileId,
      first_name: c.first_name,
      last_name: c.last_name,
      date_of_birth: c.date_of_birth,
      relationship: "enfant",
    }));
  
  if (childrenToInsert.length > 0) {
    await supabase.from("dependants").insert(childrenToInsert);
  }
}
```

#### 7. JSX pour afficher les enfants

```tsx
{/* Nombre d'enfants */}
<div>
  <Label>Nombre d'enfants</Label>
  <Input
    type="number"
    min="0"
    max="20"
    value={formData.nombre_enfants}
    onChange={(e) => handleChildrenCountChange(parseInt(e.target.value) || 0)}
  />
</div>

{/* Formulaires dynamiques pour chaque enfant */}
{children.length > 0 && (
  <div className="space-y-6 mt-6 p-4 border rounded-lg bg-muted/20">
    <h4 className="font-medium">Informations sur les enfants</h4>
    {children.map((child, index) => (
      <div key={index} className="space-y-4 p-4 border rounded-lg bg-background">
        <p className="text-sm font-medium text-muted-foreground">
          Enfant {index + 1}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Prenom</Label>
            <Input
              value={child.first_name}
              onChange={(e) => updateChild(index, "first_name", e.target.value)}
              placeholder="Prenom de l'enfant"
            />
          </div>
          <div>
            <Label>Nom</Label>
            <Input
              value={child.last_name}
              onChange={(e) => updateChild(index, "last_name", e.target.value)}
              placeholder="Nom de l'enfant"
            />
          </div>
        </div>
        <div>
          <Label>Date de naissance</Label>
          <Input
            type="date"
            value={child.date_of_birth}
            onChange={(e) => updateChild(index, "date_of_birth", e.target.value)}
          />
        </div>
      </div>
    ))}
  </div>
)}
```

#### 8. Fonction de mise a jour d'un enfant

```typescript
const updateChild = (index: number, field: keyof ChildData, value: string) => {
  setChildren(prev => {
    const updated = [...prev];
    updated[index] = { ...updated[index], [field]: value };
    return updated;
  });
};
```

### Resume des fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/pages/Profile.tsx` | Ajouter la logique dynamique pour les formulaires enfants |

### Points techniques

- Utilisation de la table `dependants` existante avec `relationship = "enfant"`
- Synchronisation automatique du nombre de formulaires avec le champ `nombre_enfants`
- Validation : seuls les enfants avec tous les champs remplis sont sauvegardes
- Style coherent avec le reste du formulaire (cards imbriquees)

