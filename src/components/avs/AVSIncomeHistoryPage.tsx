import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, TrendingUp, Save, RotateCcw, Calculator, AlertTriangle, User, Edit, Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateAVSFromScale } from "@/lib/avsCalculations";

export interface YearlyIncome {
  year: number;
  income: number | null;
  isEstimated: boolean;
}

interface AVSIncomeHistoryPageProps {
  account: any;
  onBack?: () => void;
  showBackButton?: boolean;
  onAccountUpdated?: () => void;
}

const AVSIncomeHistoryPage = ({ account, onBack, showBackButton = false, onAccountUpdated }: AVSIncomeHistoryPageProps) => {
  const { toast } = useToast();
  const [yearlyIncomes, setYearlyIncomes] = useState<YearlyIncome[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [calculatedPensions, setCalculatedPensions] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("income");

  // Personal data state
  const [ownerName, setOwnerName] = useState(account?.owner_name || "Mon compte AVS");
  const [avsNumber, setAvsNumber] = useState(account?.avs_number || "");
  const [dateOfBirth, setDateOfBirth] = useState(account?.date_of_birth || "");
  const [gender, setGender] = useState(account?.gender || "");
  const [maritalStatus, setMaritalStatus] = useState(account?.marital_status || "");
  const [marriageDate, setMarriageDate] = useState(account?.marriage_date || "");
  const [nationality, setNationality] = useState(account?.nationality || "Suisse");
  const [domicileCountry, setDomicileCountry] = useState(account?.domicile_country || "Suisse");
  const [retirementDate, setRetirementDate] = useState(account?.retirement_date || "");
  const [numberOfChildren, setNumberOfChildren] = useState(account?.number_of_children || 0);
  const [childrenBirthDates, setChildrenBirthDates] = useState<string[]>(
    Array.isArray(account?.children_birth_dates) ? account.children_birth_dates : []
  );
  const [isActive, setIsActive] = useState(account?.is_active ?? true);

  // Calculate years range based on account
  const birthYear = dateOfBirth ? new Date(dateOfBirth).getFullYear() : 1980;
  const startYear = birthYear + 20;
  const currentYear = new Date().getFullYear();
  const retirementAge = gender === 'femme' || gender === 'F' ? 64 : 65;
  const retirementYear = birthYear + retirementAge;
  const endYear = Math.min(currentYear, retirementYear);

  const countries = [
    "Suisse", "France", "Allemagne", "Italie", "Autriche", "Espagne", 
    "Portugal", "Belgique", "Pays-Bas", "Luxembourg", "Royaume-Uni", 
    "États-Unis", "Canada", "Autre"
  ];

  useEffect(() => {
    loadYearlyIncomes();
  }, [account?.id]);

  const loadYearlyIncomes = async () => {
    if (!account?.id) {
      initializeEmptyYears();
      return;
    }

    const { data: incomes } = await supabase
      .from('avs_yearly_incomes')
      .select('year, income, is_estimated')
      .eq('avs_profile_id', account.id)
      .order('year', { ascending: true });

    if (incomes && incomes.length > 0) {
      const incomeMap = new Map(incomes.map(i => [i.year, { income: Number(i.income), isEstimated: i.is_estimated }]));
      const years: YearlyIncome[] = [];
      for (let year = startYear; year <= endYear; year++) {
        const existing = incomeMap.get(year);
        years.push({
          year,
          income: existing?.income ?? null,
          isEstimated: existing?.isEstimated ?? false,
        });
      }
      setYearlyIncomes(years);
    } else {
      initializeEmptyYears();
    }
    setHasChanges(false);
  };

  const initializeEmptyYears = () => {
    const years: YearlyIncome[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push({ year, income: null, isEstimated: false });
    }
    setYearlyIncomes(years);
  };

  const handleIncomeChange = (year: number, value: string) => {
    const numValue = value === '' ? null : Number(value);
    setYearlyIncomes(prev => prev.map(y => y.year === year ? { ...y, income: numValue } : y));
    setHasChanges(true);
  };

  const handleEstimatedChange = (year: number, checked: boolean) => {
    setYearlyIncomes(prev => prev.map(y => y.year === year ? { ...y, isEstimated: checked } : y));
    setHasChanges(true);
  };

  const handleChildrenChange = (hasChildren: boolean) => {
    if (hasChildren) {
      setNumberOfChildren(1);
      setChildrenBirthDates([""]);
    } else {
      setNumberOfChildren(0);
      setChildrenBirthDates([]);
    }
    setHasChanges(true);
  };

  const addChild = () => {
    setNumberOfChildren(prev => prev + 1);
    setChildrenBirthDates(prev => [...prev, ""]);
    setHasChanges(true);
  };

  const removeChild = (index: number) => {
    setNumberOfChildren(prev => Math.max(0, prev - 1));
    setChildrenBirthDates(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleChildBirthDateChange = (index: number, date: string) => {
    const newDates = [...childrenBirthDates];
    newDates[index] = date;
    setChildrenBirthDates(newDates);
    setHasChanges(true);
  };

  const calculatePensions = async () => {
    const filledIncomes = yearlyIncomes.filter(y => y.income !== null && y.income > 0);
    if (filledIncomes.length === 0) {
      toast({
        title: "Aucun revenu",
        description: "Veuillez saisir au moins un revenu pour calculer",
        variant: "destructive",
      });
      return;
    }

    const totalIncome = filledIncomes.reduce((sum, y) => sum + (y.income || 0), 0);
    const averageIncome = Math.round(totalIncome / filledIncomes.length);
    const yearsContributed = filledIncomes.length;

    const results = await calculateAVSFromScale(averageIncome, yearsContributed);
    setCalculatedPensions({ ...results, averageIncome, yearsContributed });
  };

  const handleSave = async () => {
    if (!account?.id) {
      toast({
        title: "Erreur",
        description: "Compte non trouvé",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save yearly incomes
      const incomesToSave = yearlyIncomes
        .filter(y => y.income !== null && y.income > 0)
        .map(y => ({
          avs_profile_id: account.id,
          year: y.year,
          income: y.income,
          is_estimated: y.isEstimated,
        }));

      // Delete existing incomes
      await supabase
        .from('avs_yearly_incomes')
        .delete()
        .eq('avs_profile_id', account.id);

      if (incomesToSave.length > 0) {
        const { error } = await supabase
          .from('avs_yearly_incomes')
          .insert(incomesToSave);

        if (error) throw error;
      }

      // Calculate average income
      const filledIncomes = yearlyIncomes.filter(y => y.income !== null && y.income > 0);
      const averageIncome = filledIncomes.length > 0
        ? Math.round(filledIncomes.reduce((sum, y) => sum + (y.income || 0), 0) / filledIncomes.length)
        : null;

      // Update account with all data
      const showMarriageDate = maritalStatus === "marié" || maritalStatus === "partenariat_enregistré";
      
      const { error: updateError } = await supabase
        .from('avs_profiles')
        .update({
          owner_name: ownerName,
          avs_number: avsNumber || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          marital_status: maritalStatus || null,
          marriage_date: showMarriageDate ? marriageDate || null : null,
          nationality: nationality || null,
          domicile_country: domicileCountry || null,
          retirement_date: retirementDate || null,
          number_of_children: numberOfChildren,
          children_birth_dates: childrenBirthDates.filter(d => d),
          is_active: isActive,
          average_annual_income_determinant: averageIncome,
          years_contributed: filledIncomes.length || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      toast({
        title: "Sauvegardé",
        description: "Toutes les données ont été enregistrées",
      });
      setHasChanges(false);
      onAccountUpdated?.();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les données",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset personal data
    setOwnerName(account?.owner_name || "Mon compte AVS");
    setAvsNumber(account?.avs_number || "");
    setDateOfBirth(account?.date_of_birth || "");
    setGender(account?.gender || "");
    setMaritalStatus(account?.marital_status || "");
    setMarriageDate(account?.marriage_date || "");
    setNationality(account?.nationality || "Suisse");
    setDomicileCountry(account?.domicile_country || "Suisse");
    setRetirementDate(account?.retirement_date || "");
    setNumberOfChildren(account?.number_of_children || 0);
    setChildrenBirthDates(Array.isArray(account?.children_birth_dates) ? account.children_birth_dates : []);
    setIsActive(account?.is_active ?? true);
    
    // Reset incomes
    loadYearlyIncomes();
    setCalculatedPensions(null);
  };

  // Find years with gaps (lacunes)
  const filledYears = yearlyIncomes.filter(y => y.income !== null && y.income > 0);
  const hasGaps = filledYears.length > 0 && filledYears.length < yearlyIncomes.length;
  const gapYears = yearlyIncomes.filter(y => y.income === null || y.income === 0).map(y => y.year);
  const showMarriageDate = maritalStatus === "marié" || maritalStatus === "partenariat_enregistré";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {ownerName || "Mon compte AVS"}
            </h2>
            <p className="text-muted-foreground">
              N° AVS: {avsNumber || "Non renseigné"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="income" className="gap-2">
            <Calendar className="h-4 w-4" />
            Revenus annuels
          </TabsTrigger>
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Données personnelles
          </TabsTrigger>
        </TabsList>

        {/* INCOME TAB */}
        <TabsContent value="income" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income History Table */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  Historique des revenus
                </CardTitle>
                <CardDescription>
                  Entrez vos revenus bruts pour chaque année de cotisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasGaps && gapYears.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-amber-600">Lacunes détectées : </span>
                      <span className="text-muted-foreground">
                        {gapYears.length <= 5 
                          ? gapYears.join(", ") 
                          : `${gapYears.slice(0, 5).join(", ")}... (+${gapYears.length - 5})`}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="border rounded-md max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-[120px]">Année de revenu</TableHead>
                        <TableHead>Revenu brut de l'année</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearlyIncomes.map((yearData) => (
                        <TableRow key={yearData.year}>
                          <TableCell className="font-medium">{yearData.year}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0"
                              value={yearData.income ?? ""}
                              onChange={(e) => handleIncomeChange(yearData.year, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Résumé
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Années renseignées</span>
                    <span className="font-semibold">{filledYears.length} / {yearlyIncomes.length}</span>
                  </div>
                  {filledYears.length > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Revenu moyen</span>
                        <span className="font-semibold">
                          {Math.round(filledYears.reduce((s, y) => s + (y.income || 0), 0) / filledYears.length).toLocaleString('fr-CH')} CHF
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Années estimées</span>
                        <span className="font-semibold">{filledYears.filter(y => y.isEstimated).length}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Calculated Pensions */}
              {calculatedPensions && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary">Rentes estimées</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Basé sur {calculatedPensions.yearsContributed} années et un revenu moyen de {calculatedPensions.averageIncome.toLocaleString('fr-CH')} CHF
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-background rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Rente vieillesse</div>
                      <div className="text-2xl font-bold text-primary">
                        {calculatedPensions.oldAgeRent?.toLocaleString('fr-CH')} CHF<span className="text-sm font-normal text-muted-foreground">/mois</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-background rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1">Rente invalidité</div>
                        <div className="text-lg font-semibold">
                          {calculatedPensions.disabilityRent?.toLocaleString('fr-CH')} CHF
                        </div>
                      </div>
                      <div className="p-3 bg-background rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1">Rente survivant</div>
                        <div className="text-lg font-semibold">
                          {calculatedPensions.widowRent?.toLocaleString('fr-CH')} CHF
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="text-xs text-muted-foreground mb-1">Rente enfant</div>
                      <div className="text-lg font-semibold">
                        {calculatedPensions.childRent?.toLocaleString('fr-CH')} CHF<span className="text-xs font-normal text-muted-foreground">/enfant</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* PERSONAL DATA TAB */}
        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Données personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ownerName">Nom du compte</Label>
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(e) => { setOwnerName(e.target.value); setHasChanges(true); }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="avsNumber">Numéro AVS</Label>
                    <Input
                      id="avsNumber"
                      placeholder="756.XXXX.XXXX.XX"
                      value={avsNumber}
                      onChange={(e) => { setAvsNumber(e.target.value); setHasChanges(true); }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date de naissance</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => { setDateOfBirth(e.target.value); setHasChanges(true); }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Sexe</Label>
                    <Select value={gender} onValueChange={(v) => { setGender(v); setHasChanges(true); }}>
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
                    <Select value={maritalStatus} onValueChange={(v) => { setMaritalStatus(v); setHasChanges(true); }}>
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

                  {showMarriageDate && (
                    <div>
                      <Label htmlFor="marriageDate">Date de mariage</Label>
                      <Input
                        id="marriageDate"
                        type="date"
                        value={marriageDate}
                        onChange={(e) => { setMarriageDate(e.target.value); setHasChanges(true); }}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nationality">Nationalité</Label>
                    <Select value={nationality} onValueChange={(v) => { setNationality(v); setHasChanges(true); }}>
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
                    <Select value={domicileCountry} onValueChange={(v) => { setDomicileCountry(v); setHasChanges(true); }}>
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
                      onChange={(e) => { setRetirementDate(e.target.value); setHasChanges(true); }}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label htmlFor="isActive">Compte actif</Label>
                    <Checkbox
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={(checked) => { setIsActive(checked as boolean); setHasChanges(true); }}
                    />
                  </div>
                </div>
              </div>

              {/* Children section */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base">Enfants</Label>
                  <Select 
                    value={numberOfChildren > 0 ? "yes" : "no"} 
                    onValueChange={(val) => handleChildrenChange(val === "yes")}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Enfants ?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Non</SelectItem>
                      <SelectItem value="yes">Oui</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {numberOfChildren > 0 && (
                  <div className="space-y-3">
                    {childrenBirthDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium w-20">Enfant {index + 1}</span>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => handleChildBirthDateChange(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeChild(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AVSIncomeHistoryPage;
