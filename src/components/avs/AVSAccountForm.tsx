import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, AlertTriangle, User, DollarSign } from "lucide-react";

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
    gender?: string;
    nationality?: string;
    domicile_country?: string;
    retirement_date?: string;
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
  const [gender, setGender] = useState(account?.gender || "");
  const [maritalStatus, setMaritalStatus] = useState(account?.marital_status || "");
  const [marriageDate, setMarriageDate] = useState(account?.marriage_date || "");
  const [nationality, setNationality] = useState(account?.nationality || "Suisse");
  const [domicileCountry, setDomicileCountry] = useState(account?.domicile_country || "Suisse");
  const [retirementDate, setRetirementDate] = useState(account?.retirement_date || "");
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
      gender: gender || null,
      marital_status: maritalStatus || null,
      marriage_date: showMarriageDate ? marriageDate || null : null,
      nationality: nationality || null,
      domicile_country: domicileCountry || null,
      retirement_date: retirementDate || null,
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

  const countries = [
    "Suisse", "France", "Allemagne", "Italie", "Autriche", "Espagne", 
    "Portugal", "Royaume-Uni", "États-Unis", "Autre"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Données personnelles
          </TabsTrigger>
          <TabsTrigger value="income" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Revenus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Données du requérant pour le calcul de la rente AVS</CardDescription>
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
                  placeholder="JJ.MM.AAAA"
                />
              </div>

              <div>
                <Label htmlFor="avsNumber">Numéro AVS</Label>
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
                <Label htmlFor="gender">Sexe</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="mt-1">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="femme">Femme</SelectItem>
                    <SelectItem value="homme">Homme</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="nationality">Nationalité</Label>
                <Select value={nationality} onValueChange={setNationality}>
                  <SelectTrigger id="nationality" className="mt-1">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="domicileCountry">Domicile</Label>
                <Select value={domicileCountry} onValueChange={setDomicileCountry}>
                  <SelectTrigger id="domicileCountry" className="mt-1">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="retirementDate">Date de retraite</Label>
                <Input
                  id="retirementDate"
                  type="date"
                  value={retirementDate}
                  onChange={(e) => setRetirementDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="numberOfChildren">Enfants</Label>
                <Select 
                  value={numberOfChildren > 0 ? "yes" : "no"} 
                  onValueChange={(val) => setNumberOfChildren(val === "yes" ? 1 : 0)}
                >
                  <SelectTrigger id="numberOfChildren" className="mt-1">
                    <SelectValue placeholder="Avez-vous des enfants ?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Non</SelectItem>
                    <SelectItem value="yes">Oui</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {numberOfChildren > 0 && (
                <div>
                  <Label htmlFor="childrenCount">Nombre d'enfants à charge</Label>
                  <Input
                    id="childrenCount"
                    type="number"
                    min="1"
                    max="20"
                    value={numberOfChildren}
                    onChange={(e) => setNumberOfChildren(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
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
        </TabsContent>

        <TabsContent value="income" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenu annuel brut suisse</CardTitle>
              <CardDescription>
                Le revenu estimé sera utilisé pour le calcul de votre rente. 
                Pour obtenir un calcul plus précis, vous pouvez le remplacer par votre revenu exact.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="annualIncome">Revenu annuel brut (CHF)</Label>
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
        </TabsContent>
      </Tabs>

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