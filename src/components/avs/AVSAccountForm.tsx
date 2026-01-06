import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, AlertTriangle, User, Edit, Plus, Trash2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface YearlyIncome {
  year: number;
  income: number | null;
  isEstimated: boolean;
}

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
    children_birth_dates?: string[];
    scale_used?: string;
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
  // Personal data
  const [dateOfBirth, setDateOfBirth] = useState(account?.date_of_birth || "");
  const [gender, setGender] = useState(account?.gender || "");
  const [maritalStatus, setMaritalStatus] = useState(account?.marital_status || "");
  const [marriageDate, setMarriageDate] = useState(account?.marriage_date || "");
  const [nationality, setNationality] = useState(account?.nationality || "Suisse");
  const [domicileCountry, setDomicileCountry] = useState(account?.domicile_country || "Suisse");
  const [retirementDate, setRetirementDate] = useState(account?.retirement_date || "");
  const [numberOfChildren, setNumberOfChildren] = useState(account?.number_of_children || 0);
  const [childrenBirthDates, setChildrenBirthDates] = useState<string[]>(
    account?.children_birth_dates || []
  );
  
  // Income data
  const [annualIncome, setAnnualIncome] = useState(account?.average_annual_income_determinant?.toString() || "");
  const [ownerName, setOwnerName] = useState(account?.owner_name || "Mon compte AVS");
  const [avsNumber, setAvsNumber] = useState(account?.avs_number || "");
  const [isActive, setIsActive] = useState(account?.is_active ?? true);
  const [scaleUsed] = useState(account?.scale_used || "44");

  // Generate 44 years of income data based on birth date (ascending order)
  const generateYearlyIncomes = (birthDate: string): YearlyIncome[] => {
    const incomes: YearlyIncome[] = [];
    if (birthDate) {
      const birthYear = new Date(birthDate).getFullYear();
      const startYear = birthYear + 21; // Cotisation commence à 21 ans
      for (let i = 0; i < 44; i++) {
        const year = startYear + i;
        incomes.push({
          year,
          income: null,
          isEstimated: false,
        });
      }
    } else {
      // Default: 44 years from current year backwards
      const currentYear = new Date().getFullYear();
      for (let i = 43; i >= 0; i--) {
        incomes.push({
          year: currentYear - i,
          income: null,
          isEstimated: false,
        });
      }
    }
    return incomes;
  };

  const [yearlyIncomes, setYearlyIncomes] = useState<YearlyIncome[]>(() => 
    generateYearlyIncomes(account?.date_of_birth || "")
  );

  // Calculate contribution years based on birth date
  const contributionInfo = useMemo(() => {
    if (!dateOfBirth) return { startYear: null, endYear: null, yearsCount: 44 };
    
    const birthYear = new Date(dateOfBirth).getFullYear();
    const startYear = birthYear + 21; // Cotisation commence à 21 ans
    const endYear = birthYear + 64; // Jusqu'à 64/65 ans
    const now = new Date().getFullYear();
    const yearsCount = Math.min(44, now - startYear + 1);
    
    return { startYear, endYear, yearsCount: Math.max(0, yearsCount) };
  }, [dateOfBirth]);

  // Update yearly incomes when birth date changes
  const handleDateOfBirthChange = (newDate: string) => {
    setDateOfBirth(newDate);
    setYearlyIncomes(generateYearlyIncomes(newDate));
  };

  const handleChildrenChange = (hasChildren: boolean) => {
    if (hasChildren) {
      setNumberOfChildren(1);
      setChildrenBirthDates([""]);
    } else {
      setNumberOfChildren(0);
      setChildrenBirthDates([]);
    }
  };

  const addChild = () => {
    setNumberOfChildren(prev => prev + 1);
    setChildrenBirthDates(prev => [...prev, ""]);
  };

  const removeChild = (index: number) => {
    setNumberOfChildren(prev => Math.max(0, prev - 1));
    setChildrenBirthDates(prev => prev.filter((_, i) => i !== index));
  };

  const handleChildBirthDateChange = (index: number, date: string) => {
    const newDates = [...childrenBirthDates];
    newDates[index] = date;
    setChildrenBirthDates(newDates);
  };

  const handleYearlyIncomeChange = (index: number, value: string) => {
    const newIncomes = [...yearlyIncomes];
    newIncomes[index] = {
      ...newIncomes[index],
      income: value ? parseFloat(value) : null,
      isEstimated: false,
    };
    setYearlyIncomes(newIncomes);
  };

  const estimateAllIncomes = () => {
    if (!annualIncome) return;
    const baseIncome = parseFloat(annualIncome);
    const newIncomes = yearlyIncomes.map((item, index) => ({
      ...item,
      income: Math.round(baseIncome * (1 - index * 0.01)), // Slight decrease for older years
      isEstimated: true,
    }));
    setYearlyIncomes(newIncomes);
  };

  const clearEstimations = () => {
    const newIncomes = yearlyIncomes.map(item => ({
      ...item,
      income: item.isEstimated ? null : item.income,
      isEstimated: item.isEstimated,
    }));
    setYearlyIncomes(newIncomes);
  };

  const showMarriageDate = maritalStatus === "marié" || maritalStatus === "partenariat_enregistré";
  
  // Calculate years contributed from filled incomes
  const yearsContributed = yearlyIncomes.filter(y => y.income !== null && y.income > 0).length;
  const yearsMissing = 44 - yearsContributed;
  const rentCoefficient = Math.round((yearsContributed / 44) * 100);

  // Calculate average income from yearly data
  const calculatedAverageIncome = useMemo(() => {
    const filledIncomes = yearlyIncomes.filter(y => y.income !== null && y.income > 0);
    if (filledIncomes.length === 0) return parseFloat(annualIncome) || 0;
    return Math.round(filledIncomes.reduce((sum, y) => sum + (y.income || 0), 0) / filledIncomes.length);
  }, [yearlyIncomes, annualIncome]);

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
      children_birth_dates: childrenBirthDates.filter(d => d),
      average_annual_income_determinant: calculatedAverageIncome || parseFloat(annualIncome) || 0,
      years_contributed: yearsContributed || 44,
      scale_used: scaleUsed,
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
    "Portugal", "Belgique", "Pays-Bas", "Luxembourg", "Royaume-Uni", 
    "États-Unis", "Canada", "Autre"
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
            <Edit className="h-4 w-4" />
            Édition des revenus
          </TabsTrigger>
        </TabsList>

        {/* PERSONAL DATA TAB */}
        <TabsContent value="personal" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Date de naissance */}
              <div>
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => handleDateOfBirthChange(e.target.value)}
                  className="mt-1"
                  placeholder="JJ.MM.AAAA"
                />
              </div>

              {/* Revenu annuel brut suisse */}
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="annualIncome">Revenu annuel brut suisse</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Revenu brut annuel moyen pour le calcul de la rente</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="annualIncome"
                  type="number"
                  step="1"
                  placeholder="Ex: 85000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value.replace(/^0+(?=\d)/, ''))}
                  className="mt-1"
                />
              </div>

              {/* Sexe */}
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

              {/* État civil */}
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="maritalStatus">État civil</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>L'état civil influence le calcul des rentes de couple</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                  <SelectTrigger id="maritalStatus" className="mt-1">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="célibataire">Célibataire</SelectItem>
                    <SelectItem value="marié">Marié(e)</SelectItem>
                    <SelectItem value="divorcé">Divorcé(e)</SelectItem>
                    <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date de mariage (conditionnelle) */}
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

              {/* Nationalité */}
              <div>
                <Label htmlFor="nationality">Nationalité</Label>
                <Select value={nationality} onValueChange={setNationality}>
                  <SelectTrigger id="nationality" className="mt-1">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Domicile */}
              <div>
                <Label htmlFor="domicileCountry">Domicile</Label>
                <Select value={domicileCountry} onValueChange={setDomicileCountry}>
                  <SelectTrigger id="domicileCountry" className="mt-1">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date de retraite */}
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

              {/* Enfants */}
              <div>
                <Label>Enfants</Label>
                <Select 
                  value={numberOfChildren > 0 ? "yes" : "no"} 
                  onValueChange={(val) => handleChildrenChange(val === "yes")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Avez-vous des enfants ?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Non</SelectItem>
                    <SelectItem value="yes">Oui</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liste des enfants */}
              {numberOfChildren > 0 && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  {childrenBirthDates.map((date, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Enfant ({index + 1})</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        <div>
                          <Label htmlFor={`childBirthDate-${index}`}>Date de naissance</Label>
                          <Input
                            id={`childBirthDate-${index}`}
                            type="date"
                            value={date}
                            onChange={(e) => handleChildBirthDateChange(index, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeChild(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer l'enfant
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addChild}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un enfant
                  </Button>
                </div>
              )}

              {/* Identifiants du compte */}
              <div className="pt-4 border-t space-y-4">
                <div>
                  <Label htmlFor="ownerName">Nom du compte</Label>
                  <Input
                    id="ownerName"
                    placeholder="Ex: Mon compte, Compte conjoint"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EDITING INCOME TAB */}
        <TabsContent value="income" className="space-y-4 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Années cotisées</p>
                <p className="text-2xl font-bold">{yearsContributed} / 44</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Revenu moyen</p>
                <p className="text-2xl font-bold text-primary">{formatCHF(calculatedAverageIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Échelle utilisée</p>
                <p className="text-2xl font-bold">Échelle {scaleUsed}</p>
              </CardContent>
            </Card>
          </div>

          {yearsMissing > 0 && yearsContributed > 0 && (
            <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {yearsMissing} année(s) de lacune.
              </p>
            </div>
          )}

          {/* Calculation results */}
          {calculatedResults && (
            <div className="grid md:grid-cols-3 gap-4">
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


          {/* Income table */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des revenus</CardTitle>
              <CardDescription>
                Entrez vos revenus bruts pour chaque année de cotisation (de 21 à 65 ans)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-[120px]">Année de revenu</TableHead>
                      <TableHead>Revenu brut de l'année</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyIncomes.map((item, index) => (
                      <TableRow key={item.year}>
                        <TableCell className="font-medium">{item.year}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.income ?? ""}
                            onChange={(e) => handleYearlyIncomeChange(index, e.target.value)}
                            className=""
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <Button 
            type="button"
            onClick={clearEstimations}
            variant="ghost"
          >
            Réinitialiser
          </Button>
          {onCalculate && (
            <Button 
              type="button" 
              onClick={onCalculate}
              variant="secondary"
            >
              <Calculator className="h-4 w-4" />
              Calculer la rente
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : account?.id ? "Mettre à jour" : "Créer le compte"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AVSAccountForm;
