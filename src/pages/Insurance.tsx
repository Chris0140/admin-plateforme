import { useEffect, useState } from "react";
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
      <div className="container mx-auto py-8">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assurances</h1>
          <p className="text-muted-foreground">Gestion de vos contrats d'assurance</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
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
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prime totale</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.totalAnnualPremium.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Par an</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capital décès</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.totalDeathCapital.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Total assuré</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rente invalidité</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.totalDisabilityRent.toLocaleString('fr-CH')} CHF
                </div>
                <p className="text-xs text-muted-foreground">Rente annuelle</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.contracts.length}</div>
                <p className="text-xs text-muted-foreground">Assurances</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Santé</CardTitle>
                <CardDescription>LAMal et complémentaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Contrats:</span>
                    <span className="font-semibold">{analysis.byType.health.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prime annuelle:</span>
                    <span className="font-semibold">
                      {analysis.byType.health.premium.toLocaleString('fr-CH')} CHF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protection</CardTitle>
                <CardDescription>Vie, invalidité, perte de gain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Contrats:</span>
                    <span className="font-semibold">{analysis.byType.protection.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prime annuelle:</span>
                    <span className="font-semibold">
                      {analysis.byType.protection.premium.toLocaleString('fr-CH')} CHF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biens</CardTitle>
                <CardDescription>Ménage, RC, véhicule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Contrats:</span>
                    <span className="font-semibold">{analysis.byType.property.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prime annuelle:</span>
                    <span className="font-semibold">
                      {analysis.byType.property.premium.toLocaleString('fr-CH')} CHF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Mes contrats</h2>
            {analysis.contracts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Aucun contrat d'assurance enregistré.
                  </p>
                  <Button onClick={() => setShowForm(true)} className="mt-4">
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
        </>
      )}
    </div>
  );
};

export default Insurance;