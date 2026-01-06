import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, User, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AVSAccountForm, { YearlyIncome } from "@/components/avs/AVSAccountForm";
import AVSIncomeHistoryPage from "@/components/avs/AVSIncomeHistoryPage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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
      
      // If only one account, auto-select it
      if (avsAccounts && avsAccounts.length === 1) {
        setSelectedAccount(avsAccounts[0]);
      }
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

      // Save yearly incomes
      const incomesToSave = yearlyIncomes
        .filter(y => y.income !== null && y.income > 0)
        .map(y => ({
          avs_profile_id: avsProfileId,
          year: y.year,
          income: y.income,
          is_estimated: y.isEstimated,
        }));

      if (incomesToSave.length > 0) {
        // Delete existing incomes for this profile
        await supabase
          .from('avs_yearly_incomes')
          .delete()
          .eq('avs_profile_id', avsProfileId);

        // Insert new incomes
        const { error: incomeError } = await supabase
          .from('avs_yearly_incomes')
          .insert(incomesToSave);

        if (incomeError) {
          console.error('Error saving yearly incomes:', incomeError);
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

  const handleEditAccount = async (account: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAccount(account);
    setShowForm(true);
    setSelectedAccount(null);
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

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

      setSelectedAccount(null);
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
    setSelectedAccount(null);
    setCalculatedResults(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
    setEditingYearlyIncomes([]);
    setCalculatedResults(null);
  };

  const handleSelectAccount = (account: any) => {
    setSelectedAccount(account);
  };

  const handleBackToList = () => {
    setSelectedAccount(null);
  };

  // Show form for creating/editing
  if (showForm) {
    return (
      <AppLayout title="1er Pilier - AVS" subtitle={editingAccount?.id ? "Modifier le compte" : "Créer un compte"}>
        <AVSAccountForm
          account={editingAccount}
          initialYearlyIncomes={editingYearlyIncomes}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          calculatedResults={calculatedResults}
          onCalculate={() => {}}
        />
      </AppLayout>
    );
  }

  // Show income history page for selected account
  if (selectedAccount) {
    return (
      <AppLayout 
        title="1er Pilier - AVS" 
        subtitle={accounts.length > 1 ? "Historique des revenus" : "Gérez votre historique de revenus AVS"}
      >
        <div className="mb-4 flex items-center justify-between">
          {accounts.length > 1 && (
            <Button variant="ghost" onClick={handleBackToList} className="gap-2">
              ← Retour aux comptes
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={(e) => handleEditAccount(selectedAccount, e)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Modifier le compte
            </Button>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un compte
            </Button>
          </div>
        </div>
        <AVSIncomeHistoryPage 
          account={selectedAccount} 
          onBack={accounts.length > 1 ? handleBackToList : undefined}
          showBackButton={false}
        />
      </AppLayout>
    );
  }

  // Show account selection (for multiple accounts) or empty state
  return (
    <AppLayout title="1er Pilier - AVS" subtitle="Gérez vos comptes AVS et ceux de votre partenaire">
      <div className="flex justify-end mb-6">
        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un compte
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Chargement...</p>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun compte AVS enregistré</h3>
          <p className="text-muted-foreground mb-6">
            Créez votre premier compte pour commencer à suivre votre prévoyance
          </p>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer votre premier compte
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Sélectionnez un compte pour gérer l'historique des revenus
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <Card 
                key={account.id} 
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => handleSelectAccount(account)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{account.owner_name || "Mon compte"}</h4>
                        <p className="text-sm text-muted-foreground">
                          N° AVS: {account.avs_number || "Non renseigné"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={account.is_active ? "default" : "secondary"}>
                            {account.is_active ? "Actif" : "Inactif"}
                          </Badge>
                          {account.years_contributed && (
                            <Badge variant="outline">
                              {account.years_contributed} années cotisées
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleEditAccount(account, e)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera définitivement le compte AVS de {account.owner_name || "ce titulaire"} ainsi que tout l'historique des revenus associé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={(e) => handleDelete(account.id, e)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  
                  {account.average_annual_income_determinant && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenu déterminant</span>
                        <span className="font-medium">{account.average_annual_income_determinant.toLocaleString('fr-CH')} CHF</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AVS;
