import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, PiggyBank, Plus, Wallet, Clock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AccountConfigForm } from "@/components/budget/AccountConfigForm";
import { useBudgetOnboarding } from "@/hooks/useBudgetOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function AccountsHub() {
  const { user, loading: authLoading } = useAuth();
  const { isLoading, hasProfile, hasAccount } = useBudgetOnboarding();
  const navigate = useNavigate();
  const [showAccountSheet, setShowAccountSheet] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !hasProfile) {
      navigate("/budget/onboarding/profile");
    }
  }, [isLoading, hasProfile, navigate]);

  useEffect(() => {
    if (!isLoading && hasAccount) {
      navigate("/budget/dashboard");
    }
  }, [isLoading, hasAccount, navigate]);

  if (authLoading || isLoading) {
    return (
      <AppLayout title="Budget" subtitle="Sélection du compte">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const accountTypes = [
    {
      id: "courant",
      title: "Compte Courant",
      description: "Gérez vos dépenses quotidiennes et suivez votre budget mensuel",
      icon: CreditCard,
      available: true,
      onClick: () => setShowAccountSheet(true),
    },
    {
      id: "epargne",
      title: "Compte Épargne",
      description: "Suivez vos objectifs d'épargne et faites fructifier votre argent",
      icon: PiggyBank,
      available: false,
      badge: "Bientôt",
    },
    {
      id: "autre",
      title: "Ajouter un compte",
      description: "Configurez un autre type de compte selon vos besoins",
      icon: Plus,
      available: false,
      badge: "Bientôt",
    },
  ];

  return (
    <AppLayout title="Budget" subtitle="Sélection du compte">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Choisissez votre type de compte
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sélectionnez le compte que vous souhaitez configurer en premier
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
              ✓
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Profil</span>
          </div>
          <div className="h-px w-8 bg-primary/30" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Compte</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Terminé</span>
          </div>
        </div>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            return (
              <Card
                key={account.id}
                className={cn(
                  "relative transition-all duration-300 border-2",
                  account.available
                    ? "cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                    : "opacity-60 cursor-not-allowed"
                )}
                onClick={account.available ? account.onClick : undefined}
              >
                {account.badge && (
                  <Badge
                    variant="secondary"
                    className="absolute top-4 right-4 gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {account.badge}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div
                    className={cn(
                      "mx-auto flex items-center justify-center h-14 w-14 rounded-xl mb-2",
                      account.available
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-lg">{account.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-sm">
                    {account.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Account Configuration Sheet */}
      <Sheet open={showAccountSheet} onOpenChange={setShowAccountSheet}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Configuration du Compte Courant
            </SheetTitle>
            <SheetDescription>
              Configurez les paramètres de votre compte pour un suivi précis de votre budget
            </SheetDescription>
          </SheetHeader>
          <AccountConfigForm onClose={() => setShowAccountSheet(false)} />
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
