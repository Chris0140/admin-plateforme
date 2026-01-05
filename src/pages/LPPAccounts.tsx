import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, TrendingUp, Shield, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  calculateLPPAnalysis, 
  calculateLPPRetirement,
  calculateLPPDisability,
  calculateLPPDeath,
  formatCHF,
  type LPPAnalysis 
} from "@/lib/lppCalculations";
import type { Database } from "@/integrations/supabase/types";
import { LPPAccountForm } from "@/components/lpp/LPPAccountForm";
import { LPPAccountCard } from "@/components/lpp/LPPAccountCard";

type LPPAccount = Database['public']['Tables']['lpp_accounts']['Row'];

export default function LPPAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profileId, setProfileId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LPPAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LPPAccount | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (profileId) {
      loadAnalysis();
    }
  }, [profileId]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setProfileId(data.id);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger votre profil",
        variant: "destructive"
      });
    }
  };

  const loadAnalysis = async () => {
    if (!profileId) return;
    
    setLoading(true);
    try {
      const result = await calculateLPPAnalysis(profileId);
      setAnalysis(result);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'analyse LPP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEditAccount = (account: LPPAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAccount(null);
    loadAnalysis();
  };

  if (loading) {
    return (
      <AppLayout title="2ème Pilier - LPP" subtitle="Gérez vos comptes de 2e pilier et analysez votre couverture retraite, invalidité et décès">
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="2ème Pilier - LPP" subtitle="Gérez vos comptes de 2e pilier et analysez votre couverture retraite, invalidité et décès">
      {/* Add button */}
      <div className="flex justify-end mb-6">
        <Button onClick={handleAddAccount} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un compte LPP
        </Button>
      </div>

      {/* Summary Cards */}
      {analysis && analysis.total_accounts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Savings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Avoir actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCHF(analysis.total_current_savings)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.total_accounts} compte{analysis.total_accounts > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Retirement at 65 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Rente à 65 ans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCHF(analysis.total_monthly_rent_65)}</div>
              <p className="text-xs text-muted-foreground mt-1">par mois</p>
            </CardContent>
          </Card>

          {/* Disability Coverage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-600" />
                Rente invalidité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCHF(analysis.total_disability_rent_monthly)}</div>
              <p className="text-xs text-muted-foreground mt-1">par mois</p>
            </CardContent>
          </Card>

          {/* Death Capital */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-600" />
                Capital décès
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCHF(analysis.total_death_capital)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                + {formatCHF(analysis.total_widow_rent_monthly)}/mois
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts List */}
      {analysis && analysis.total_accounts > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Vos comptes LPP</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysis.accounts_details.map((account) => (
              <LPPAccountCard
                key={account.id}
                account={account}
                onEdit={handleEditAccount}
                onRefresh={loadAnalysis}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Aucun compte LPP</CardTitle>
            <CardDescription>
              Commencez par ajouter votre premier compte de prévoyance professionnelle (2e pilier)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddAccount} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un compte LPP
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      {showForm && profileId && (
        <LPPAccountForm
          profileId={profileId}
          account={editingAccount}
          open={showForm}
          onClose={handleFormClose}
        />
      )}
    </AppLayout>
  );
}
