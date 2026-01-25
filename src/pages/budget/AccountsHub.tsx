import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Plus, Wallet, LayoutGrid, Layers } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AccountConfigForm } from "@/components/budget/AccountConfigForm";
import { AccountCard } from "@/components/budget/AccountCard";
import { AggregatedBudgetTable } from "@/components/budget/AggregatedBudgetTable";
import { AggregationToolbar } from "@/components/budget/AggregationToolbar";
import { useBudgetOnboarding } from "@/hooks/useBudgetOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BudgetAccount {
  id: string;
  account_type: string;
  bank_name: string;
  revenue_type: string;
  accounting_day: number;
  is_active: boolean;
}

const LOCAL_STORAGE_KEY = "budget_accounts_guest";

// Helper to get guest accounts from localStorage
const getGuestAccounts = (): BudgetAccount[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save guest accounts to localStorage
const saveGuestAccounts = (accounts: BudgetAccount[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(accounts));
};

export default function AccountsHub() {
  const { user } = useAuth();
  const { isLoading: onboardingLoading, hasProfile } = useBudgetOnboarding();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Aggregation state
  const [selectedForAggregation, setSelectedForAggregation] = useState<string[]>([]);
  const [showAggregation, setShowAggregation] = useState(false);
  const [aggregationMode, setAggregationMode] = useState(false);
  const [aggregationMonth, setAggregationMonth] = useState(new Date().getMonth() + 1);
  const [aggregationYear, setAggregationYear] = useState(new Date().getFullYear());

  // Redirect if no profile
  useEffect(() => {
    if (!onboardingLoading && !hasProfile) {
      navigate("/budget/onboarding/profile");
    }
  }, [onboardingLoading, hasProfile, navigate]);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      if (user) {
        // Authenticated user: fetch from Supabase
        const { data, error } = await supabase
          .from("budget_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setAccounts(data || []);
      } else {
        // Guest user: fetch from localStorage
        setAccounts(getGuestAccounts());
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos comptes",
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreateAccount = () => {
    setEditingAccountId(null);
    setShowAccountSheet(true);
  };

  const handleEditAccount = (accountId: string) => {
    setEditingAccountId(accountId);
    setShowAccountSheet(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    setDeletingAccountId(accountId);
    try {
      if (user) {
        // Authenticated user: delete from Supabase
        await supabase
          .from("budget_account_revenues")
          .delete()
          .eq("account_id", accountId);

        const { error } = await supabase
          .from("budget_accounts")
          .delete()
          .eq("id", accountId);

        if (error) throw error;
      } else {
        // Guest user: delete from localStorage
        const updatedAccounts = getGuestAccounts().filter((acc) => acc.id !== accountId);
        saveGuestAccounts(updatedAccounts);
      }

      // Optimistic update
      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));

      toast({
        title: "Compte supprimé",
        description: "Le compte a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le compte",
      });
    } finally {
      setDeletingAccountId(null);
    }
  };

  const handleSheetClose = () => {
    setShowAccountSheet(false);
    setEditingAccountId(null);
  };

  const handleFormSuccess = async () => {
    // Refresh accounts list
    await fetchAccounts();
  };

  if (onboardingLoading || isLoadingAccounts) {
    return (
      <AppLayout title="Budget" subtitle="Mes Comptes">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const hasAccounts = accounts.length > 0;
  const canAggregate = accounts.length >= 2;

  const handleSelectionChange = (accountId: string, selected: boolean) => {
    if (selected) {
      setSelectedForAggregation((prev) => [...prev, accountId]);
    } else {
      setSelectedForAggregation((prev) => prev.filter((id) => id !== accountId));
    }
  };

  const handleToggleAggregationMode = () => {
    if (aggregationMode) {
      // Exiting aggregation mode
      setAggregationMode(false);
      setSelectedForAggregation([]);
      setShowAggregation(false);
    } else {
      // Entering aggregation mode
      setAggregationMode(true);
    }
  };

  const handleCalculateAggregation = () => {
    if (selectedForAggregation.length >= 2) {
      setShowAggregation(true);
    }
  };

  const handleClearAggregation = () => {
    setSelectedForAggregation([]);
    setShowAggregation(false);
  };

  const selectedAccounts = accounts.filter((acc) =>
    selectedForAggregation.includes(acc.id)
  );

  return (
    <AppLayout title="Budget" subtitle="Mes Comptes">
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-3">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Mes Comptes
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasAccounts
                ? aggregationMode 
                  ? "Sélectionnez les comptes à agréger"
                  : "Sélectionnez un compte pour accéder à son tableau de bord"
                : "Créez votre premier compte pour commencer"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAggregate && (
              <Button
                variant={aggregationMode ? "default" : "outline"}
                onClick={handleToggleAggregationMode}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                {aggregationMode ? "Annuler" : "Agréger"}
              </Button>
            )}
            {hasAccounts && !aggregationMode && (
              <Button onClick={handleCreateAccount} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau compte
              </Button>
            )}
          </div>
        </div>

        {/* Aggregation Toolbar */}
        {aggregationMode && selectedForAggregation.length >= 2 && (
          <AggregationToolbar
            selectedCount={selectedForAggregation.length}
            month={aggregationMonth}
            year={aggregationYear}
            onMonthChange={setAggregationMonth}
            onYearChange={setAggregationYear}
            onCalculate={handleCalculateAggregation}
            onClear={handleClearAggregation}
          />
        )}

        {/* Aggregation help text */}
        {aggregationMode && selectedForAggregation.length < 2 && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
            Sélectionnez au moins 2 comptes pour voir le récapitulatif agrégé
          </div>
        )}

        {/* Empty State */}
        {!hasAccounts && (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun compte configuré
              </h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Créez votre premier compte pour commencer à gérer votre budget
              </p>
              <Button onClick={handleCreateAccount} size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Créer mon premier compte
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Accounts Grid */}
        {hasAccounts && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Accounts */}
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
                isDeleting={deletingAccountId === account.id}
                showSelection={aggregationMode}
                isSelected={selectedForAggregation.includes(account.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}

            {/* Add Account Card - hide in aggregation mode */}
            {!aggregationMode && (
              <Card
                className={cn(
                  "border-dashed border-2 cursor-pointer transition-all duration-300",
                  "hover:border-primary hover:bg-primary/5"
                )}
                onClick={handleCreateAccount}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-xl bg-muted text-muted-foreground mb-2">
                    <Plus className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-lg">Ajouter un compte</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-sm">
                    Configurez un nouveau compte pour suivre vos finances
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Aggregated Budget Table */}
        {showAggregation && selectedAccounts.length >= 2 && (
          <AggregatedBudgetTable
            selectedAccounts={selectedAccounts}
            year={aggregationYear}
            month={aggregationMonth}
          />
        )}
      </div>

      {/* Account Configuration Sheet */}
      <Sheet open={showAccountSheet} onOpenChange={handleSheetClose}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {editingAccountId ? "Paramètres du compte" : "Nouveau Compte Courant"}
            </SheetTitle>
            <SheetDescription>
              {editingAccountId
                ? "Modifiez les paramètres de votre compte"
                : "Configurez les paramètres de votre compte pour un suivi précis de votre budget"}
            </SheetDescription>
          </SheetHeader>
          <AccountConfigForm
            accountId={editingAccountId || undefined}
            onClose={handleSheetClose}
            onSuccess={handleFormSuccess}
          />
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
