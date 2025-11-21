import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FixedExpenseFormProps {
  expense?: {
    id?: string;
    name?: string;
    category?: string;
    amount?: number;
    frequency?: string;
    notes?: string;
    is_active?: boolean;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EXPENSE_CATEGORIES = [
  "Logement",
  "Abonnements",
  "Assurances",
  "Transport",
  "Santé",
  "Loisirs",
  "Éducation",
  "Alimentation",
  "Télécommunications",
  "Services publics",
  "Crédits/Prêts",
  "Épargne",
  "Autre",
];

const FixedExpenseForm = ({
  expense,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FixedExpenseFormProps) => {
  const [name, setName] = useState(expense?.name || "");
  const [category, setCategory] = useState(expense?.category || "");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [frequency, setFrequency] = useState(expense?.frequency || "mensuel");
  const [notes, setNotes] = useState(expense?.notes || "");
  const [isActive, setIsActive] = useState(expense?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = category === "custom" ? customCategory : category;
    
    onSubmit({
      name,
      category: finalCategory,
      amount: parseFloat(amount) || 0,
      frequency,
      notes: notes || null,
      is_active: isActive,
    });
  };

  const monthlyAmount = frequency === 'annuel' ? (parseFloat(amount) || 0) / 12 : (parseFloat(amount) || 0);
  const annualAmount = frequency === 'mensuel' ? (parseFloat(amount) || 0) * 12 : (parseFloat(amount) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de la dépense</CardTitle>
          <CardDescription>Définissez votre dépense fixe récurrente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la dépense *</Label>
            <Input
              id="name"
              placeholder="Ex: Loyer, Netflix, Assurance maladie"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category" className="mt-1">
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Catégorie personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {category === "custom" && (
            <div>
              <Label htmlFor="customCategory">Nom de la catégorie *</Label>
              <Input
                id="customCategory"
                placeholder="Ex: Ma catégorie"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Montant (CHF) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="frequency">Fréquence</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {parseFloat(amount) > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Par mois</p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat('fr-CH', {
                      style: 'currency',
                      currency: 'CHF',
                      minimumFractionDigits: 2,
                    }).format(monthlyAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Par an</p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat('fr-CH', {
                      style: 'currency',
                      currency: 'CHF',
                      minimumFractionDigits: 2,
                    }).format(annualAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Dépense active</Label>
              <p className="text-xs text-muted-foreground">
                Désactiver si cette dépense n'est plus d'actualité
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting || !name || !category || !amount}>
          {isSubmitting ? "Enregistrement..." : expense?.id ? "Mettre à jour" : "Ajouter la dépense"}
        </Button>
      </div>
    </form>
  );
};

export default FixedExpenseForm;
