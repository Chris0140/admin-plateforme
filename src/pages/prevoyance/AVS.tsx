import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, ShieldAlert, Heart, Baby } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateAllAVSPensionsStructured, calculateAVSFromScale, AVSCalculationResult } from "@/lib/avsCalculations";
import AVSAccountCard from "@/components/avs/AVSAccountCard";
import AVSAccountForm, { YearlyIncome } from "@/components/avs/AVSAccountForm";

const AVS = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingYearlyIncomes, setEditingYearlyIncomes] = useState<YearlyIncome[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedResults, setCalculatedResults] = useState<any>(null);
  const [summaryPensions, setSummaryPensions] = useState<AVSCalculationResult | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Calculate summary pensions from first active account
  useEffect(() => {
    const calculateSummary = async () => {
      const activeAccount = accounts.find(a => a.is_active !== false);
      if (activeAccount?.average_annual_income_determinant && activeAccount.average_annual_income_determinant > 0) {
        try {
          const result = await calculateAVSFromScale(
            activeAccount.average_annual_income_determinant,
            activeAccount.years_contributed || 44
          );
          setSummaryPensions(result);
        } catch (error) {
          console.error("Erreur calcul résumé:", error);
          setSummaryPensions(null);
        }
      } else {
        setSummaryPensions(null);
      }
    };
    calculateSummary();
  }, [accounts]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (!profile) return;

      setProfileId(profile.id);

      // Load all AVS accounts
      const { data: avsAccounts, error } = await supabase
        .from('avs_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccounts(avsAccounts || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!editingAccount?.average_annual_income_determinant) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un revenu",
        variant: "destructive",
      });
      return;
    }

    try {
      const results = await calculateAllAVSPensionsStructured(
        editingAccount.average_annual_income_determinant,
        editingAccount.years_contributed || 44
      );
      setCalculatedResults(results);
    } catch (error) {
      console.error('Error calculating:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du calcul",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: any, yearlyIncomes: YearlyIncome[]) => {
    if (!profileId) return;

    setIsSubmitting(true);
    try {
      let avsProfileId: string;
      
      if (editingAccount?.id) {
        // Update existing account
        const { error } = await supabase
          .from('avs_profiles')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAccount.id);

        if (error) throw error;
        avsProfileId = editingAccount.id;

        toast({
          title: "Compte mis à jour",
          description: "Le compte AVS a été modifié avec succès",
        });
      } else {
        // Create new account
        const { data: newAccount, error } = await supabase
          .from('avs_profiles')
          .insert({
            profile_id: profileId,
            ...data,
          })
          .select('id')
          .single();

        if (error) throw error;
        avsProfileId = newAccount.id;

        toast({
          title: "Compte créé",
          description: "Le compte AVS a été créé avec succès",
        });
      }

      // Save yearly incomes - always delete existing first
      await supabase
        .from('avs_yearly_incomes')
        .delete()
        .eq('avs_profile_id', avsProfileId);

      const incomesToSave = yearlyIncomes
        .filter(y => y.income !== null && y.income > 0)
        .map(y => ({
          avs_profile_id: avsProfileId,
          year: y.year,
          income: y.income,
          is_estimated: y.isEstimated,
        }));

      if (incomesToSave.length > 0) {
        const { error: incomeError } = await supabase
          .from('avs_yearly_incomes')
          .insert(incomesToSave);

        if (incomeError) {
          console.error('Error saving yearly incomes:', incomeError);
          toast({
            title: "Attention",
            description: "Les revenus annuels n'ont pas pu être enregistrés",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Historique enregistré",
            description: `${incomesToSave.length} année(s) de revenus enregistrée(s)`,
          });
        }
      }

      setShowForm(false);
      setEditingAccount(null);
      setEditingYearlyIncomes([]);
      setCalculatedResults(null);
      loadData();
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le compte",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (account: any) => {
    setEditingAccount(account);
    setShowForm(true);
    setCalculatedResults(null);

    // Load yearly incomes for this account
    if (account.id) {
      const { data: incomes } = await supabase
        .from('avs_yearly_incomes')
        .select('year, income, is_estimated')
        .eq('avs_profile_id', account.id)
        .order('year', { ascending: true });

      if (incomes && incomes.length > 0) {
        const yearlyIncomes: YearlyIncome[] = incomes.map(i => ({
          year: i.year,
          income: Number(i.income),
          isEstimated: i.is_estimated,
        }));
        setEditingYearlyIncomes(yearlyIncomes);
      } else {
        setEditingYearlyIncomes([]);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('avs_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Compte supprimé",
        description: "Le compte AVS a été supprimé avec succès",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditingAccount({});
    setEditingYearlyIncomes([]);
    setShowForm(true);
    setCalculatedResults(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
    setEditingYearlyIncomes([]);
    setCalculatedResults(null);
  };

  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout title="1er Pilier - AVS" subtitle="Gérez vos comptes AVS et ceux de votre partenaire">
      {/* Add button */}
      {!showForm && (
        <div className="flex justify-end mb-6">
          <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un compte
          </Button>
        </div>
      )}

      {/* Summary cards - Rentes estimées */}
      {!showForm && summaryPensions && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Rente vieillesse</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCHF(summaryPensions.old_age_rent_monthly)} CHF</p>
              <p className="text-sm text-muted-foreground">par mois</p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">Rente invalidité</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCHF(summaryPensions.disability_rent_monthly)} CHF</p>
              <p className="text-sm text-muted-foreground">par mois</p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">Rente veuve/veuf</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCHF(summaryPensions.widow_rent_monthly)} CHF</p>
              <p className="text-sm text-muted-foreground">par mois</p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Baby className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-500">Rente enfant</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCHF(summaryPensions.child_rent_monthly)} CHF</p>
              <p className="text-sm text-muted-foreground">par mois</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section title */}
      {!showForm && accounts.length > 0 && (
        <h2 className="text-lg font-semibold mb-4">Vos comptes AVS</h2>
      )}

          {showForm ? (
            <AVSAccountForm
              account={editingAccount}
              initialYearlyIncomes={editingYearlyIncomes}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              calculatedResults={calculatedResults}
              onCalculate={handleCalculate}
            />
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : accounts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Aucun compte AVS enregistré
                  </p>
                  <Button onClick={handleAddNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer votre premier compte
                  </Button>
                </div>
              ) : (
                accounts.map((account) => (
                  <AVSAccountCard
                    key={account.id}
                    account={account}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          )}
    </AppLayout>
  );
};

export default AVS;
