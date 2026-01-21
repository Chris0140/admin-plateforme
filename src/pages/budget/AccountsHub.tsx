import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, PiggyBank, Plus, Wallet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AccountConfigForm } from "@/components/budget/AccountConfigForm";
import { AccountCard } from "@/components/budget/AccountCard";
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

export default function AccountsHub() {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: onboardingLoading, hasProfile } = useBudgetOnboarding();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Redirect if no profile
  useEffect(() => {
    if (!onboardingLoading && !hasProfile) {
      navigate("/budget/onboarding/profile");
    }
  }, [onboardingLoading, hasProfile, navigate]);

  // Fetch accounts
  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const { data, error } = await supabase
          .from("budget_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setAccounts(data || []);
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
    };

    fetchAccounts();
  }, [user, toast]);

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
      // Delete revenues first (cascade would be better but we do it manually)
      await supabase
        .from("budget_account_revenues")
        .delete()
        .eq("account_id", accountId);

      // Delete the account
      const { error } = await supabase
        .from("budget_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

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
    if (!user) return;
    
    const { data, error } = await supabase
      .from("budget_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setAccounts(data);
    }
  };

  if (authLoading || onboardingLoading || isLoadingAccounts) {
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

  return (
    <AppLayout title="Budget" subtitle="Mes Comptes">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-3">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Mes Comptes
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasAccounts
                ? "Sélectionnez un compte pour accéder à son tableau de bord"
                : "Créez votre premier compte pour commencer"}
            </p>
          </div>
          {hasAccounts && (
            <Button onClick={handleCreateAccount} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau compte
            </Button>
          )}
        </div>

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
              />
            ))}

            {/* Add Account Card */}
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
          </div>
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
