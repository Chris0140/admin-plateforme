import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useBudgetOnboarding } from "@/hooks/useBudgetOnboarding";

export default function BudgetGatekeeper() {
  const { isLoading, hasProfile } = useBudgetOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for onboarding status to load
    if (isLoading) return;

    // Always go directly to accounts hub (no profile required)
    navigate("/budget/accounts", { replace: true });
  }, [isLoading, navigate]);

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
