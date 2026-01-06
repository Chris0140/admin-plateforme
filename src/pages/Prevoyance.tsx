import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Wallet, Shield, PiggyBank } from "lucide-react";
import { calculateAllAVSPensionsStructured } from "@/lib/avsCalculations";
import { calculateLPPAnalysis } from "@/lib/lppCalculations";
import { calculateThirdPillarAnalysis } from "@/lib/thirdPillarCalculations";

interface AVSAccount {
  id: string;
  owner_name?: string;
  avs_number?: string;
  marital_status?: string;
  average_annual_income_determinant?: number;
  years_contributed?: number;
  is_active?: boolean;
}

const Prevoyance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // AVS States
  const [avsAccounts, setAvsAccounts] = useState<AVSAccount[]>([]);
  const [avsYearsContributed, setAvsYearsContributed] = useState(0);
  const [avsTotalRent, setAvsTotalRent] = useState(0);

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

      // Load AVS accounts  
      const { data: avsAccountsData } = await supabase
        .from('avs_profiles')
        .select('id, owner_name, avs_number, marital_status, average_annual_income_determinant, years_contributed, is_active')
        .eq('profile_id', profile.id)
        .eq('is_active', true);

      if (avsAccountsData && avsAccountsData.length > 0) {
        setAvsAccounts(avsAccountsData as AVSAccount[]);
        
        const avgYears = Math.round(
          avsAccountsData.reduce((sum, acc) => sum + (acc.years_contributed || 0), 0) / avsAccountsData.length
        );
        setAvsYearsContributed(avgYears);

        let totalRent = 0;
        for (const account of avsAccountsData) {
          if (account.average_annual_income_determinant) {
            const results = await calculateAllAVSPensionsStructured(
              account.average_annual_income_determinant,
              account.years_contributed || 44
            );
            totalRent += results.oldAge.fullRent.annual;
          }
        }
        setAvsTotalRent(totalRent);
      }

      const lppAnalysis = await calculateLPPAnalysis(profile.id);
      setLppSummary(lppAnalysis);

      const thirdPillarAnalysis = await calculateThirdPillarAnalysis(profile.id, profile.date_naissance);
      setThirdPillarSummary(thirdPillarAnalysis);

    } catch (error) {
      console.error('Error loading data:', error);
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

  // Calculate totals
  const totalCurrentCapital = 
    (lppSummary?.total_current_savings || 0) + 
    (thirdPillarSummary?.totalCurrentAmount || 0);
  
  const totalProjectedRent = 
    avsTotalRent +
    (lppSummary?.total_annual_rent_65 || 0) +
    (thirdPillarSummary?.totalProjectedAnnualRent || 0);

  return (
    <AppLayout 
      title="Prévoyance" 
      subtitle="Vue d'ensemble de votre prévoyance suisse"
    >

      {/* Pillar Cards */}
      <div className="space-y-3 md:space-y-4">
        {/* 1er Pilier AVS */}
        <Card 
          className="glass border-border/50 cursor-pointer hover:border-primary/50 transition-all duration-300 group" 
          onClick={() => navigate('/prevoyance/avs')}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors flex-shrink-0">
                  <Wallet className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-foreground truncate">1er Pilier - AVS</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Assurance Vieillesse et Survivants</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-8">
                {avsAccounts.length > 0 ? (
                  <>
                    <div className="text-right hidden lg:block">
                      <p className="text-xs md:text-sm text-muted-foreground">Rente estimée</p>
                      <p className="text-lg md:text-xl font-bold text-foreground">{formatCHF(avsTotalRent)}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-xs md:text-sm text-muted-foreground">Années</p>
                      <p className="text-lg md:text-xl font-bold text-foreground">{avsYearsContributed}/44</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground">Configurer</p>
                )}
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2ème Pilier LPP */}
        <Card 
          className="glass border-border/50 cursor-pointer hover:border-primary/50 transition-all duration-300 group" 
          onClick={() => navigate('/prevoyance/lpp')}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors flex-shrink-0">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-foreground truncate">2ème Pilier - LPP</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Prévoyance professionnelle</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-8">
                {lppSummary ? (
                  <>
                    <div className="text-right hidden lg:block">
                      <p className="text-xs md:text-sm text-muted-foreground">Capital actuel</p>
                      <p className="text-lg md:text-xl font-bold text-foreground">{formatCHF(lppSummary.total_current_savings)}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-xs md:text-sm text-muted-foreground">Rente projetée</p>
                      <p className="text-lg md:text-xl font-bold text-foreground">{formatCHF(lppSummary.total_annual_rent_65)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground">Configurer</p>
                )}
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3ème Pilier */}
        <Card 
          className="glass border-border/50 cursor-pointer hover:border-primary/50 transition-all duration-300 group" 
          onClick={() => navigate('/prevoyance/3e-pilier')}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors flex-shrink-0">
                  <PiggyBank className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-foreground truncate">3ème Pilier</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Prévoyance individuelle (3a / 3b)</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-8">
                {thirdPillarSummary ? (
                  <>
                    <div className="text-right hidden lg:block">
                      <p className="text-xs md:text-sm text-muted-foreground">Capital actuel</p>
                      <p className="text-lg md:text-xl font-bold text-foreground">{formatCHF(thirdPillarSummary.totalCurrentAmount)}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-xs md:text-sm text-muted-foreground">Capital projeté</p>
                      <p className="text-lg md:text-xl font-bold text-foreground">{formatCHF(thirdPillarSummary.totalProjectedAmount)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground">Configurer</p>
                )}
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retirement Overview Chart Placeholder */}
      {(avsAccounts.length > 0 || lppSummary || thirdPillarSummary) && (
        <Card className="glass border-primary/50 mt-6 md:mt-8">
          <CardHeader className="px-4 md:px-6 py-4 md:py-6">
            <CardTitle className="text-base md:text-lg">Répartition de votre prévoyance</CardTitle>
            <CardDescription className="text-xs md:text-sm">Vue d'ensemble de vos revenus à la retraite (65 ans)</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="p-3 md:p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-1">1er Pilier AVS</p>
                <p className="text-lg md:text-2xl font-bold text-yellow-500">{formatCHF(avsTotalRent)}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">par an</p>
              </div>
              <div className="p-3 md:p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-1">2ème Pilier LPP</p>
                <p className="text-lg md:text-2xl font-bold text-orange-500">
                  {lppSummary ? formatCHF(lppSummary.total_annual_rent_65) : formatCHF(0)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">par an</p>
              </div>
              <div className="p-3 md:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-1">3ème Pilier</p>
                <p className="text-lg md:text-2xl font-bold text-emerald-500">
                  {thirdPillarSummary ? formatCHF(thirdPillarSummary.totalProjectedAnnualRent) : formatCHF(0)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">par an</p>
              </div>
              <div className="p-3 md:p-4 rounded-xl bg-primary/10 border border-primary/30 text-center col-span-2 md:col-span-1">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-lg md:text-2xl font-bold text-primary">{formatCHF(totalProjectedRent)}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">par an</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Prevoyance;
