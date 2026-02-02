import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { calculateAllAVSPensionsStructured } from "@/lib/avsCalculations";
import { calculateLPPAnalysis } from "@/lib/lppCalculations";
import { calculateThirdPillarAnalysis } from "@/lib/thirdPillarCalculations";
import RetirementChart from "@/components/prevoyance/RetirementChart";

type ViewType = 'retraite' | 'invalidite' | 'deces';

interface AVSAccount {
  id: string;
  owner_name?: string;
  avs_number?: string;
  marital_status?: string;
  average_annual_income_determinant?: number;
  years_contributed?: number;
  is_active?: boolean;
  number_of_children?: number;
}

const PILLARS = [
  { id: '1er', label: '1er pilier', path: '/prevoyance/avs' },
  { id: '2eme', label: '2ème pilier', path: '/prevoyance/lpp' },
  { id: '3eme', label: '3ème pilier', path: '/prevoyance/3e-pilier' },
];

const VIEWS: { id: ViewType; label: string }[] = [
  { id: 'retraite', label: 'Ma retraite' },
  { id: 'invalidite', label: 'Invalidité' },
  { id: 'deces', label: 'Décès' },
];

const Prevoyance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<ViewType>('retraite');

  // Profile data
  const [currentAge, setCurrentAge] = useState<number>(40);
  const [numberOfChildren, setNumberOfChildren] = useState<number>(0);

  // AVS States
  const [avsAccounts, setAvsAccounts] = useState<AVSAccount[]>([]);
  const [avsTotalRent, setAvsTotalRent] = useState(0);
  const [avsChildRent, setAvsChildRent] = useState(0);

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
        .select('id, date_naissance, nombre_enfants')
        .eq('user_id', currentUser.id)
        .single();

      if (!profile) return;

      // Calculate current age
      if (profile.date_naissance) {
        const birthDate = new Date(profile.date_naissance);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        setCurrentAge(age);
      }

      // Set number of children
      setNumberOfChildren(profile.nombre_enfants || 0);

      // Load AVS accounts  
      const { data: avsAccountsData } = await supabase
        .from('avs_profiles')
        .select('id, owner_name, avs_number, marital_status, average_annual_income_determinant, years_contributed, is_active, number_of_children')
        .eq('profile_id', profile.id)
        .eq('is_active', true);

      if (avsAccountsData && avsAccountsData.length > 0) {
        setAvsAccounts(avsAccountsData as AVSAccount[]);

        let totalRent = 0;
        let totalChildRent = 0;
        for (const account of avsAccountsData) {
          if (account.average_annual_income_determinant) {
            const results = await calculateAllAVSPensionsStructured(
              account.average_annual_income_determinant,
              account.years_contributed || 44
            );
            totalRent += results.oldAge.fullRent.annual;
            // Child rent per child
            totalChildRent = results.child.annual;
          }
        }
        setAvsTotalRent(totalRent);
        setAvsChildRent(totalChildRent);
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

  // Get data based on selected view for each pillar
  const getPillarData = (pillarId: string) => {
    switch (selectedView) {
      case 'retraite':
        if (pillarId === '1er') return { value: avsTotalRent, label: 'Rente annuelle' };
        if (pillarId === '2eme') return { value: lppSummary?.total_annual_rent_65 || 0, label: 'Rente projetée' };
        if (pillarId === '3eme') return { value: thirdPillarSummary?.totalProjectedAnnualRent || 0, label: 'Rente projetée' };
        break;
      case 'invalidite':
        if (pillarId === '1er') return { value: 0, label: 'Rente invalidité' }; // AVS disability would need calculation
        if (pillarId === '2eme') return { value: lppSummary?.total_disability_rent || 0, label: 'Rente invalidité' };
        if (pillarId === '3eme') return { value: thirdPillarSummary?.totalDisabilityRent || 0, label: 'Rente invalidité' };
        break;
      case 'deces':
        if (pillarId === '1er') return { value: 0, label: 'Rente survivants' }; // AVS survivor rent would need calculation
        if (pillarId === '2eme') return { value: lppSummary?.total_death_capital || 0, label: 'Capital décès' };
        if (pillarId === '3eme') return { value: thirdPillarSummary?.totalDeathCapital || 0, label: 'Capital décès' };
        break;
    }
    return { value: 0, label: '' };
  };

  const hasData = avsAccounts.length > 0 || lppSummary || thirdPillarSummary;

  return (
    <AppLayout 
      title="Prévoyance" 
      subtitle="Vue d'ensemble de votre prévoyance suisse"
    >
      <div className="space-y-8">
        {/* 3 Pillar Cubes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PILLARS.map((pillar) => {
            const data = getPillarData(pillar.id);
            return (
              <button
                key={pillar.id}
                onClick={() => navigate(pillar.path)}
                className={cn(
                  "bg-muted/80 hover:bg-muted",
                  "rounded-2xl",
                  "h-40 md:h-48",
                  "flex flex-col items-center justify-center gap-3",
                  "transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  "cursor-pointer",
                  "border border-border/50"
                )}
              >
                <span className="text-lg md:text-xl font-semibold text-foreground">
                  {pillar.label}
                </span>
                {hasData && data.value > 0 && (
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      {formatCHF(data.value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.label}
                    </p>
                  </div>
                )}
                {(!hasData || data.value === 0) && (
                  <p className="text-sm text-muted-foreground">Configurer →</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Bar */}
        <div className="flex justify-center">
          <div className={cn(
            "bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30",
            "rounded-full",
            "p-2",
            "flex items-center justify-center gap-2 md:gap-4",
            "w-full max-w-lg"
          )}>
            {VIEWS.map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={cn(
                  "rounded-full",
                  "px-4 md:px-8 py-2 md:py-3",
                  "text-sm md:text-base font-medium",
                  "transition-all duration-200",
                  "flex-1",
                  selectedView === view.id
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Total Summary Card */}
        {hasData && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {selectedView === 'retraite' && 'Total des rentes annuelles à la retraite'}
              {selectedView === 'invalidite' && 'Total des rentes annuelles en cas d\'invalidité'}
              {selectedView === 'deces' && 'Total des capitaux décès'}
            </p>
            <p className="text-3xl md:text-4xl font-bold text-primary">
              {formatCHF(
                getPillarData('1er').value +
                getPillarData('2eme').value +
                getPillarData('3eme').value
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedView === 'retraite' && 'par an (estimation)'}
              {selectedView === 'invalidite' && 'par an (estimation)'}
              {selectedView === 'deces' && '(estimation)'}
            </p>
          </div>
        )}

        {/* Retirement Chart - Only show in "Ma retraite" view */}
        {selectedView === 'retraite' && hasData && (
          <RetirementChart
            currentAge={currentAge}
            avsAnnualRent={avsTotalRent}
            lppAnnualRent={lppSummary?.total_annual_rent_65 || 0}
            thirdPillarAnnualRent={thirdPillarSummary?.totalProjectedAnnualRent || 0}
            childRentAnnual={avsChildRent}
            numberOfChildren={numberOfChildren}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Prevoyance;
