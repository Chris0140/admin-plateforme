import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ProfileForm } from "@/components/budget/ProfileForm";
import { useBudgetOnboarding } from "@/hooks/useBudgetOnboarding";

export default function OnboardingProfile() {
  const { isLoading, hasProfile } = useBudgetOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && hasProfile) {
      navigate("/budget/accounts");
    }
  }, [isLoading, hasProfile, navigate]);

  if (isLoading) {
    return (
      <AppLayout title="Budget" subtitle="Configuration de votre espace">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Budget" subtitle="Configuration de votre espace">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Créez votre profil financier
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Quelques informations pour personnaliser votre expérience budget
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-sm font-medium hidden sm:inline">Profil</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Compte</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Terminé</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 shadow-lg">
          <ProfileForm />
        </div>
      </div>
    </AppLayout>
  );
}
