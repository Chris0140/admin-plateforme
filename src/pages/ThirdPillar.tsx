import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateThirdPillarAnalysis, ThirdPillarAnalysis } from "@/lib/thirdPillarCalculations";
import ThirdPillarAccountCard from "@/components/third-pillar/ThirdPillarAccountCard";
import ThirdPillarAccountForm from "@/components/third-pillar/ThirdPillarAccountForm";

const ThirdPillar = () => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<ThirdPillarAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Non authentifié",
          description: "Veuillez vous connecter pour accéder à cette page.",
          variant: "destructive",
        });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, date_naissance')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profil non trouvé",
          description: "Veuillez compléter votre profil d'abord.",
          variant: "destructive",
        });
        return;
      }

      const analysisResult = await calculateThirdPillarAnalysis(
        profile.id,
        profile.date_naissance
      );
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Error loading third pillar data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du 3e pilier.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccountId(null);
    loadData();
  };

  const handleEdit = (accountId: string) => {
    setEditingAccountId(accountId);
    setShowForm(true);
  };

  const handleDelete = async () => {
    await loadData();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">3e Pilier</h1>
          <p className="text-muted-foreground">Gestion de vos comptes 3a et 3b</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un compte
        </Button>
      </div>

      {showForm && (
        <ThirdPillarAccountForm
          accountId={editingAccountId}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAccountId(null);
          }}
        />
      )}

      {analysis && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capital actuel</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.totalCurrentAmount.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur {analysis.accounts.length} compte(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cotisation annuelle</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.totalAnnualContribution.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Par an</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capital projeté à 65 ans</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.totalProjectedAmount.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">À la retraite</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rente annuelle projetée</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.totalProjectedAnnualRent.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Sur 20 ans</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Mes comptes</h2>
            {analysis.accounts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Aucun compte 3e pilier enregistré.
                  </p>
                  <Button onClick={() => setShowForm(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter votre premier compte
                  </Button>
                </CardContent>
              </Card>
            ) : (
              analysis.accounts.map((account) => (
                <ThirdPillarAccountCard
                  key={account.accountId}
                  account={account}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ThirdPillar;