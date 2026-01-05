import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield, DollarSign, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateInsuranceAnalysis, InsuranceAnalysis } from "@/lib/insuranceCalculations";
import InsuranceContractCard from "@/components/insurance/InsuranceContractCard";
import InsuranceContractForm from "@/components/insurance/InsuranceContractForm";

const Insurance = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<InsuranceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

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
        .select('id')
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

      const analysisResult = await calculateInsuranceAnalysis(profile.id);
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Error loading insurance data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des assurances.",
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
    setEditingContractId(null);
    loadData();
  };

  const handleEdit = (contractId: string) => {
    setEditingContractId(contractId);
    setShowForm(true);
  };

  const handleDelete = async () => {
    await loadData();
  };

  if (loading) {
    return (
      <AppLayout title="Assurances" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Assurances" subtitle="Gestion de vos contrats d'assurance">
      {/* Action button */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une assurance
        </Button>
      </div>

      {showForm && (
        <InsuranceContractForm
          contractId={editingContractId}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingContractId(null);
          }}
        />
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prime totale</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {analysis.totalAnnualPremium.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Par an</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capital décès</CardTitle>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Heart className="h-4 w-4 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {analysis.totalDeathCapital.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Total assuré</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rente invalidité</CardTitle>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Shield className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {analysis.totalDisabilityRent.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Rente annuelle</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Shield className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{analysis.contracts.length}</div>
                <p className="text-xs text-muted-foreground">Assurances</p>
              </CardContent>
            </Card>
          </div>

          {/* Category cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Santé</CardTitle>
                <CardDescription>LAMal et complémentaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contrats:</span>
                    <span className="font-semibold text-foreground">{analysis.byType.health.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prime annuelle:</span>
                    <span className="font-semibold text-primary">
                      {analysis.byType.health.premium.toLocaleString('fr-CH')} CHF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Protection</CardTitle>
                <CardDescription>Vie, invalidité, perte de gain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contrats:</span>
                    <span className="font-semibold text-foreground">{analysis.byType.protection.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prime annuelle:</span>
                    <span className="font-semibold text-primary">
                      {analysis.byType.protection.premium.toLocaleString('fr-CH')} CHF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Biens</CardTitle>
                <CardDescription>Ménage, RC, véhicule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contrats:</span>
                    <span className="font-semibold text-foreground">{analysis.byType.property.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prime annuelle:</span>
                    <span className="font-semibold text-primary">
                      {analysis.byType.property.premium.toLocaleString('fr-CH')} CHF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contracts list */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Mes contrats</h2>
            {analysis.contracts.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Aucun contrat d'assurance enregistré.
                  </p>
                  <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter votre premier contrat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              analysis.contracts.map((contract) => (
                <InsuranceContractCard
                  key={contract.id}
                  contract={contract}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Insurance;
