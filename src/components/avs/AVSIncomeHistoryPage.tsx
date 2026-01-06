import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, TrendingUp, Save, RotateCcw, Calculator, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

const AVSIncomeHistoryPage = ({ account, onBack, showBackButton = false }: AVSIncomeHistoryPageProps) => {
  const { toast } = useToast();
  const [yearlyIncomes, setYearlyIncomes] = useState<YearlyIncome[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [calculatedPensions, setCalculatedPensions] = useState<any>(null);

  // Calculate years range based on account
  const dateOfBirth = account?.date_of_birth ? new Date(account.date_of_birth) : null;
  const birthYear = dateOfBirth ? dateOfBirth.getFullYear() : 1980;
  const startYear = birthYear + 20; // AVS starts at 20
  const currentYear = new Date().getFullYear();
  const retirementAge = account?.gender === 'F' ? 64 : 65;
  const retirementYear = birthYear + retirementAge;
  const endYear = Math.min(currentYear, retirementYear);

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

      // Update account with calculated values
      const filledIncomes = yearlyIncomes.filter(y => y.income !== null && y.income > 0);
      if (filledIncomes.length > 0) {
        const totalIncome = filledIncomes.reduce((sum, y) => sum + (y.income || 0), 0);
        const averageIncome = Math.round(totalIncome / filledIncomes.length);

        await supabase
          .from('avs_profiles')
          .update({
            average_annual_income_determinant: averageIncome,
            years_contributed: filledIncomes.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);
      }

      toast({
        title: "Sauvegardé",
        description: "L'historique des revenus a été enregistré",
      });
      setHasChanges(false);
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
    loadYearlyIncomes();
    setCalculatedPensions(null);
  };

  // Find years with gaps (lacunes)
  const filledYears = yearlyIncomes.filter(y => y.income !== null && y.income > 0);
  const hasGaps = filledYears.length > 0 && filledYears.length < yearlyIncomes.length;
  const gapYears = yearlyIncomes.filter(y => y.income === null || y.income === 0).map(y => y.year);

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
              Historique des revenus AVS
            </h2>
            <p className="text-muted-foreground">
              {account?.owner_name || "Mon compte"} • N° AVS: {account?.avs_number || "Non renseigné"}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income History Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Revenus annuels ({startYear} - {endYear})
              </CardTitle>
              <Button onClick={calculatePensions} size="sm" variant="secondary">
                <Calculator className="mr-2 h-4 w-4" />
                Calculer les rentes
              </Button>
            </div>
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
            
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {yearlyIncomes.map((yearData) => {
                  const isFutureYear = yearData.year > currentYear;
                  const hasIncome = yearData.income !== null && yearData.income > 0;
                  
                  return (
                    <div
                      key={yearData.year}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        isFutureYear 
                          ? 'bg-muted/30 opacity-60' 
                          : hasIncome 
                            ? 'bg-green-500/5 border border-green-500/20' 
                            : 'bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="w-16 font-semibold text-foreground">
                        {yearData.year}
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Revenu annuel"
                          value={yearData.income ?? ''}
                          onChange={(e) => handleIncomeChange(yearData.year, e.target.value)}
                          className="bg-background"
                          disabled={isFutureYear}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`estimated-${yearData.year}`}
                          checked={yearData.isEstimated}
                          onCheckedChange={(checked) => handleEstimatedChange(yearData.year, checked as boolean)}
                          disabled={isFutureYear}
                        />
                        <label 
                          htmlFor={`estimated-${yearData.year}`} 
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          Estimé
                        </label>
                      </div>
                      {hasIncome && (
                        <Badge variant="secondary" className="text-xs">
                          {yearData.income?.toLocaleString('fr-CH')} CHF
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
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
    </div>
  );
};

export default AVSIncomeHistoryPage;
