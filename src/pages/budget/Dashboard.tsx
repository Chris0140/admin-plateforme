import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BudgetContent from "./BudgetContent";

interface BudgetAccount {
  id: string;
  account_type: string;
  bank_name: string;
  revenue_type: string;
  accounting_day: number;
}

export default function BudgetDashboard() {
  const { accountId } = useParams<{ accountId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [account, setAccount] = useState<BudgetAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !accountId) return;

    const fetchAccount = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("budget_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            variant: "destructive",
            title: "Compte non trouvé",
            description: "Ce compte n'existe pas ou vous n'y avez pas accès",
          });
          navigate("/budget/accounts");
          return;
        }

        setAccount(data);
      } catch (error) {
        console.error("Error fetching account:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger le compte",
        });
        navigate("/budget/accounts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccount();
  }, [user, accountId, navigate, toast]);

  if (authLoading || isLoading) {
    return (
      <AppLayout title="Budget" subtitle="Chargement...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <AppLayout 
      title="Budget" 
      subtitle={`${account.bank_name} - Compte ${account.account_type === "courant" ? "Courant" : "Épargne"}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/budget/accounts")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux comptes
        </Button>

        {/* Budget Content */}
        <BudgetContent accountId={account.id} />
      </div>
    </AppLayout>
  );
}
