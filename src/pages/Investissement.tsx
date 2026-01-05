import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Wallet, PieChart, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import InvestmentAssetCard from "@/components/investment/InvestmentAssetCard";
import InvestmentAssetForm from "@/components/investment/InvestmentAssetForm";

interface InvestmentAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker_symbol: string | null;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string | null;
  currency: string;
  platform: string | null;
  notes: string | null;
  is_active: boolean;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  percentageChange: number;
  assetCount: number;
  byType: Record<string, { count: number; value: number; invested: number }>;
}

const assetTypeLabels: Record<string, string> = {
  actions: "Actions",
  etf: "ETF",
  crypto: "Cryptomonnaies",
  obligations: "Obligations",
  immobilier: "Immobilier",
  fonds: "Fonds",
  autres: "Autres",
};

const Investissement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profil non trouvé",
          description: "Veuillez compléter votre profil d'abord.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setProfileId(profile.id);

      const { data: assetsData, error } = await supabase
        .from("investment_assets")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedAssets = (assetsData || []) as InvestmentAsset[];
      setAssets(typedAssets);

      // Calculate summary
      const byType: Record<string, { count: number; value: number; invested: number }> = {};
      let totalInvested = 0;
      let currentValue = 0;

      typedAssets.forEach((asset) => {
        const invested = asset.quantity * asset.purchase_price;
        const value = asset.quantity * (asset.current_price || asset.purchase_price);
        totalInvested += invested;
        currentValue += value;

        if (!byType[asset.asset_type]) {
          byType[asset.asset_type] = { count: 0, value: 0, invested: 0 };
        }
        byType[asset.asset_type].count += 1;
        byType[asset.asset_type].value += value;
        byType[asset.asset_type].invested += invested;
      });

      const totalGainLoss = currentValue - totalInvested;
      const percentageChange = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

      setSummary({
        totalInvested,
        currentValue,
        totalGainLoss,
        percentageChange,
        assetCount: typedAssets.length,
        byType,
      });
    } catch (error) {
      console.error("Error loading investment data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des investissements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAssetId(null);
    loadData();
  };

  const handleEdit = (assetId: string) => {
    setEditingAssetId(assetId);
    setShowForm(true);
  };

  const handleDelete = async () => {
    await loadData();
  };

  if (loading) {
    return (
      <AppLayout title="Investissement" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Investissement" subtitle="Gérez vos actifs et votre portefeuille">
        <Card className="glass border-border/50">
          <CardContent className="py-12 text-center">
            <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Connectez-vous pour gérer vos investissements et suivre votre portefeuille.
            </p>
            <Button onClick={() => window.location.href = "/login"} className="bg-primary hover:bg-primary/90">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Investissement" subtitle="Gérez vos actifs et votre portefeuille">
      {/* Action button */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un actif
        </Button>
      </div>

      {showForm && profileId && (
        <InvestmentAssetForm
          assetId={editingAssetId}
          profileId={profileId}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAssetId(null);
          }}
        />
      )}

      {summary && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valeur du portefeuille</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {summary.currentValue.toLocaleString("fr-CH", { minimumFractionDigits: 2 })} CHF
                </div>
                <p className="text-xs text-muted-foreground">Valeur actuelle</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total investi</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <PieChart className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {summary.totalInvested.toLocaleString("fr-CH", { minimumFractionDigits: 2 })} CHF
                </div>
                <p className="text-xs text-muted-foreground">Capital initial</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gain/Perte</CardTitle>
                <div className={`p-2 rounded-lg ${summary.totalGainLoss >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  {summary.totalGainLoss >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.totalGainLoss >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {summary.totalGainLoss >= 0 ? "+" : ""}
                  {summary.totalGainLoss.toLocaleString("fr-CH", { minimumFractionDigits: 2 })} CHF
                </div>
                <p className={`text-xs ${summary.percentageChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {summary.percentageChange >= 0 ? "+" : ""}
                  {summary.percentageChange.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <LineChart className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{summary.assetCount}</div>
                <p className="text-xs text-muted-foreground">Positions actives</p>
              </CardContent>
            </Card>
          </div>

          {/* Asset type breakdown */}
          {Object.keys(summary.byType).length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(summary.byType).map(([type, data]) => {
                const gainLoss = data.value - data.invested;
                const percentage = data.invested > 0 ? (gainLoss / data.invested) * 100 : 0;
                return (
                  <Card key={type} className="glass border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{assetTypeLabels[type] || type}</CardTitle>
                      <CardDescription>{data.count} position{data.count > 1 ? "s" : ""}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Valeur:</span>
                          <span className="font-semibold text-foreground">
                            {data.value.toLocaleString("fr-CH", { minimumFractionDigits: 2 })} CHF
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Performance:</span>
                          <span className={`font-semibold ${percentage >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {percentage >= 0 ? "+" : ""}{percentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Assets list */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Mes actifs</h2>
            {assets.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Aucun actif enregistré. Commencez à suivre vos investissements.
                  </p>
                  <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter votre premier actif
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {assets.map((asset) => (
                  <InvestmentAssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Investissement;
