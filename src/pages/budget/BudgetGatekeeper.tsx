import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useBudgetOnboarding } from "@/hooks/useBudgetOnboarding";
import { useAuth } from "@/contexts/AuthContext";

export default function BudgetGatekeeper() {
  const { user, loading: authLoading } = useAuth();
  const { isLoading, hasProfile, hasAccount } = useBudgetOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      navigate("/login");
      return;
    }

    // Wait for onboarding status to load
    if (isLoading) return;

    // Route based on onboarding status
    if (!hasProfile) {
      navigate("/budget/onboarding/profile", { replace: true });
    } else if (!hasAccount) {
      navigate("/budget/accounts", { replace: true });
    } else {
      navigate("/budget/dashboard", { replace: true });
    }
  }, [user, authLoading, isLoading, hasProfile, hasAccount, navigate]);

  // Show loading state while determining route
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}
