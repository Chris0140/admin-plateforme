import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, AlertTriangle, ChevronRight, Wallet, Shield, PiggyBank, Save } from "lucide-react";
import { calculateAllAVSPensions, saveAVSProfile, loadAVSProfile } from "@/lib/avsCalculations";
import { calculateLPPAnalysis } from "@/lib/lppCalculations";
import { calculateThirdPillarAnalysis } from "@/lib/thirdPillarCalculations";

const Prevoyance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // AVS States
  const [avsRevenuDeterminant, setAvsRevenuDeterminant] = useState("");
  const [avsYearsContributed, setAvsYearsContributed] = useState(44);
  const [avsResults, setAvsResults] = useState<any>(null);
  const [isCalculatingAVS, setIsCalculatingAVS] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [dateNaissance, setDateNaissance] = useState<string>("");

  // LPP Summary
  const [lppSummary, setLppSummary] = useState<any>(null);

  // 3e Pilier Summary
  const [thirdPillarSummary, setThirdPillarSummary] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, date_naissance')
        .eq('user_id', currentUser.id)
        .single();

      if (!profile) return;

      setProfileId(profile.id);
      setDateNaissance(profile.date_naissance);

      // Load AVS data
      const avsProfile = await loadAVSProfile(profile.id);
      if (avsProfile) {
        setAvsRevenuDeterminant(avsProfile.average_annual_income_determinant?.toString() || "");
        setAvsYearsContributed(avsProfile.years_contributed || 44);

        // If we have saved data, calculate results
        if (avsProfile.average_annual_income_determinant) {
          const results = await calculateAllAVSPensions(
            avsProfile.average_annual_income_determinant,
            avsProfile.years_contributed || 44
          );
          setAvsResults(results);
        }
      }

      // Load LPP summary
      const lppAnalysis = await calculateLPPAnalysis(profile.id);
      setLppSummary(lppAnalysis);

      // Load 3e Pilier summary
      const thirdPillarAnalysis = await calculateThirdPillarAnalysis(profile.id, profile.date_naissance);
      setThirdPillarSummary(thirdPillarAnalysis);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCalculateAVS = async () => {
    const revenu = parseFloat(avsRevenuDeterminant);
    
    if (isNaN(revenu) || revenu <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un revenu valide",
        variant: "destructive",
      });
      return;
    }

    setIsCalculatingAVS(true);
    try {
      const results = await calculateAllAVSPensions(revenu, avsYearsContributed);
      setAvsResults(results);

      // Save to profile if logged in
      if (profileId) {
        await saveAVSProfile(profileId, revenu, avsYearsContributed);
      }

      toast({
        title: "Calcul effectué",
        description: "Les rentes AVS ont été calculées avec succès",
      });
    } catch (error) {
      console.error('Error calculating AVS:', error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer les rentes AVS",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingAVS(false);
    }
  };

  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Prévoyance</h1>
            <p className="text-muted-foreground">Vue d'ensemble de votre prévoyance suisse (AVS, LPP, 3e pilier)</p>
          </div>

          <div className="space-y-6">
            {/* 1er Pilier AVS */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/prevoyance/avs')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">1er Pilier - AVS</CardTitle>
                      <CardDescription>Assurance Vieillesse et Survivants</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {avsResults ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rente vieillesse</p>
                      <p className="text-2xl font-bold">{formatCHF(avsResults.oldAge.fullRent.annual)}</p>
                      <p className="text-xs text-muted-foreground">par an</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Années cotisées</p>
                      <p className="text-2xl font-bold">{avsYearsContributed} / 44</p>
                      <p className="text-xs text-muted-foreground">ans</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coefficient</p>
                      <p className="text-2xl font-bold">{Math.round((avsYearsContributed / 44) * 100)}%</p>
                      <p className="text-xs text-muted-foreground">de rente</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Cliquez pour gérer votre AVS</p>
                )}
              </CardContent>
            </Card>

            {/* 2ème Pilier LPP */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/prevoyance/lpp')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">2ème Pilier - LPP</CardTitle>
                      <CardDescription>Prévoyance professionnelle</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {lppSummary ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Comptes actifs</p>
                      <p className="text-2xl font-bold">{lppSummary.total_accounts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capital total actuel</p>
                      <p className="text-2xl font-bold">{formatCHF(lppSummary.total_current_savings)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rente projetée à 65 ans</p>
                      <p className="text-2xl font-bold">{formatCHF(lppSummary.total_annual_rent_65)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Cliquez pour gérer vos comptes LPP</p>
                )}
              </CardContent>
            </Card>

            {/* 3ème Pilier */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/prevoyance/3e-pilier')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <PiggyBank className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">3ème Pilier</CardTitle>
                      <CardDescription>Prévoyance individuelle (3a / 3b)</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {thirdPillarSummary ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Comptes actifs</p>
                      <p className="text-2xl font-bold">{thirdPillarSummary.accounts.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capital actuel</p>
                      <p className="text-2xl font-bold">{formatCHF(thirdPillarSummary.totalCurrentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capital projeté à 65 ans</p>
                      <p className="text-2xl font-bold">{formatCHF(thirdPillarSummary.totalProjectedAmount)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Cliquez pour gérer vos comptes 3e pilier</p>
                )}
              </CardContent>
            </Card>

            {/* Vue d'ensemble */}
            {(avsResults || lppSummary || thirdPillarSummary) && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-2xl">Vue d'ensemble - Revenu retraite estimé</CardTitle>
                  <CardDescription>Projection de vos revenus à la retraite (65 ans)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">1er Pilier AVS</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {avsResults ? formatCHF(avsResults.oldAge.fullRent.annual) : formatCHF(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">par an</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">2ème Pilier LPP</p>
                      <p className="text-xl font-bold text-orange-600">
                        {lppSummary ? formatCHF(lppSummary.total_annual_rent_65) : formatCHF(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">par an</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">3ème Pilier</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {thirdPillarSummary ? formatCHF(thirdPillarSummary.totalProjectedAnnualRent) : formatCHF(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">par an</p>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCHF(
                          (avsResults?.oldAge.fullRent.annual || 0) +
                          (lppSummary?.total_annual_rent_65 || 0) +
                          (thirdPillarSummary?.totalProjectedAnnualRent || 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">par an</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Prevoyance;