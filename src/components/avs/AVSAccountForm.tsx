import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, AlertTriangle } from "lucide-react";
import { calculateAllAVSPensionsStructured } from "@/lib/avsCalculations";

interface AVSAccountFormProps {
  account?: {
    id?: string;
    owner_name?: string;
    avs_number?: string;
    marital_status?: string;
    average_annual_income_determinant?: number;
    years_contributed?: number;
    is_active?: boolean;
    date_of_birth?: string;
    number_of_children?: number;
    marriage_date?: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  calculatedResults?: any;
  onCalculate?: () => void;
}

const AVSAccountForm = ({
  account,
  onSubmit,
  onCancel,
  isSubmitting = false,
  calculatedResults,
  onCalculate,
}: AVSAccountFormProps) => {
  const [ownerName, setOwnerName] = useState(account?.owner_name || "");
  const [dateOfBirth, setDateOfBirth] = useState(account?.date_of_birth || "");
  const [avsNumber, setAvsNumber] = useState(account?.avs_number || "");
  const [maritalStatus, setMaritalStatus] = useState(account?.marital_status || "");
  const [marriageDate, setMarriageDate] = useState(account?.marriage_date || "");
  const [numberOfChildren, setNumberOfChildren] = useState(account?.number_of_children || 0);
  const [annualIncome, setAnnualIncome] = useState(account?.average_annual_income_determinant?.toString() || "");
  const [yearsContributed, setYearsContributed] = useState(account?.years_contributed || 44);
  const [isActive, setIsActive] = useState(account?.is_active ?? true);

  const showMarriageDate = maritalStatus === "marié" || maritalStatus === "partenariat_enregistré";

  const yearsMissing = 44 - yearsContributed;
  const rentCoefficient = Math.round((yearsContributed / 44) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      owner_name: ownerName,
      date_of_birth: dateOfBirth || null,
      avs_number: avsNumber || null,
      marital_status: maritalStatus || null,
      marriage_date: showMarriageDate ? marriageDate || null : null,
      number_of_children: numberOfChildren,
      average_annual_income_determinant: parseFloat(annualIncome) || 0,
      years_contributed: yearsContributed,
      is_active: isActive,
    });
  };

  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>Identifiez le titulaire de ce compte AVS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ownerName">Nom du titulaire *</Label>
            <Input
              id="ownerName"
              placeholder="Ex: Mon compte, Compte de mon conjoint"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date de naissance</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="avsNumber">Numéro AVS (optionnel)</Label>
            <Input
              id="avsNumber"
              placeholder="756.XXXX.XXXX.XX"
              value={avsNumber}
              onChange={(e) => setAvsNumber(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: 756.XXXX.XXXX.XX
            </p>
          </div>

          <div>
            <Label htmlFor="maritalStatus">État civil</Label>
            <Select value={maritalStatus} onValueChange={setMaritalStatus}>
              <SelectTrigger id="maritalStatus" className="mt-1">
                <SelectValue placeholder="Sélectionnez votre état civil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="célibataire">Célibataire</SelectItem>
                <SelectItem value="marié">Marié(e)</SelectItem>
                <SelectItem value="divorcé">Divorcé(e)</SelectItem>
                <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                <SelectItem value="partenariat_enregistré">Partenariat enregistré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showMarriageDate && (
            <div>
              <Label htmlFor="marriageDate">Date de mariage</Label>
              <Input
                id="marriageDate"
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="numberOfChildren">Nombre d'enfants à charge</Label>
            <Input
              id="numberOfChildren"
              type="number"
              min="0"
              max="20"
              value={numberOfChildren}
              onChange={(e) => setNumberOfChildren(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compte actif</Label>
              <p className="text-xs text-muted-foreground">
                Désactiver si ce compte n'est plus utilisé
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calcul des rentes</CardTitle>
          <CardDescription>Estimation selon l'Échelle 44 2025</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="annualIncome">Revenu brut annuel (CHF)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="annualIncome"
                type="number"
                step="1"
                placeholder="96000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value.replace(/^0+(?=\d)/, ''))}
              />
              {onCalculate && (
                <Button 
                  type="button"
                  onClick={onCalculate}
                  variant="secondary"
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Calculer
                </Button>
              )}
            </div>
          </div>

          {calculatedResults && (
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <Card className="border-2 border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rente vieillesse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCHF(calculatedResults.oldAge.fullRent.annual)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCHF(calculatedResults.oldAge.fullRent.monthly)} / mois
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rente invalidité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCHF(calculatedResults.disability.fullRent.annual)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCHF(calculatedResults.disability.fullRent.monthly)} / mois
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rente veuve/veuf</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCHF(calculatedResults.widow.fullRent.annual)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCHF(calculatedResults.widow.fullRent.monthly)} / mois
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique de cotisation</CardTitle>
          <CardDescription>Vos années de cotisation AVS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="yearsContributed">Années cotisées</Label>
              <Input
                id="yearsContributed"
                type="number"
                min="0"
                max="44"
                value={yearsContributed}
                onChange={(e) => setYearsContributed(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum : 44 ans (entre 21 et 65 ans)
              </p>
            </div>
            <div>
              <Label>Années manquantes</Label>
              <Input
                type="number"
                value={yearsMissing}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label>Coefficient de rente</Label>
              <Input
                value={`${rentCoefficient}%`}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
          </div>

          {yearsMissing > 0 && (
            <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Attention : {yearsMissing} année(s) de lacune. Rente réduite à {rentCoefficient}%.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting || !ownerName}>
          {isSubmitting ? "Enregistrement..." : account?.id ? "Mettre à jour" : "Créer le compte"}
        </Button>
      </div>
    </form>
  );
};

export default AVSAccountForm;
