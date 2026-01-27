import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateInsuranceAnalysis, InsuranceAnalysis, InsuranceContract } from "@/lib/insuranceCalculations";
import InsuranceTypeCube from "@/components/insurance/InsuranceTypeCube";
import InsuranceDetailPanel from "@/components/insurance/InsuranceDetailPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InsuranceContractForm from "@/components/insurance/InsuranceContractForm";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Heart,
  HeartPulse,
  Home,
  Scale,
  Car,
  Gavel,
  Users,
  Accessibility,
  TrendingDown,
  LucideIcon,
} from "lucide-react";

interface InsuranceTypeConfig {
  type: string;
  subTypes?: InsuranceContract['insurance_type'][];
  label: string;
  icon: LucideIcon;
}

const INSURANCE_TYPES: InsuranceTypeConfig[] = [
  { type: 'health_basic', label: 'LAMal', icon: Heart },
  { type: 'health_complementary', label: 'Complémentaire', icon: HeartPulse },
  { type: 'household', label: 'Ménage', icon: Home },
  { type: 'liability', label: 'RC', icon: Scale },
  { type: 'vehicle', label: 'Véhicule', icon: Car },
  { type: 'legal_protection', label: 'Juridique', icon: Gavel },
  { type: 'life', label: 'Vie', icon: Users },
  { type: 'disability', label: 'Invalidité', icon: Accessibility },
  { type: 'loss_of_earnings', label: 'Perte de gain', icon: TrendingDown },
];

const Insurance = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [analysis, setAnalysis] = useState<InsuranceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

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
    setShowAddDialog(false);
    loadData();
  };

  const handleBack = () => {
    setSelectedType(null);
    setSelectedContractId(null);
  };

  const handleContractSelect = (contractId: string) => {
    setSelectedContractId(contractId);
  };

  const getTypeStats = useMemo(() => {
    if (!analysis) return {};
    
    const stats: Record<string, { count: number; premium: number }> = {};
    
    for (const config of INSURANCE_TYPES) {
      const typesToMatch = config.subTypes || [config.type];
      const contracts = analysis.contracts.filter(c => 
        typesToMatch.includes(c.insurance_type)
      );
      stats[config.type] = {
        count: contracts.length,
        premium: contracts.reduce((sum, c) => sum + c.annual_premium, 0),
      };
    }
    
    return stats;
  }, [analysis]);

  const selectedConfig = INSURANCE_TYPES.find(t => t.type === selectedType);
  const selectedTypeLabel = selectedConfig?.label || '';

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
      <div className="flex flex-col h-full gap-6">
        {/* Main layout */}
        {!selectedType ? (
          /* Grid of cubes when no type selected */
          <div className="flex-1 flex flex-col">
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'}`}>
              {INSURANCE_TYPES.map((config) => {
                const stats = getTypeStats[config.type] || { count: 0, premium: 0 };
                return (
                  <InsuranceTypeCube
                    key={config.type}
                    type={config.type}
                    label={config.label}
                    icon={config.icon}
                    contractCount={stats.count}
                    totalPremium={stats.premium}
                    isSelected={false}
                    onClick={() => setSelectedType(config.type)}
                  />
                );
              })}
            </div>

            {/* Add button centered at bottom */}
            <div className="flex justify-center mt-8">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button variant="default" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Ajouter une assurance
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nouveau contrat d'assurance</DialogTitle>
                  </DialogHeader>
                  <InsuranceContractForm
                    onSuccess={handleFormSuccess}
                    onCancel={() => setShowAddDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          /* Detail panel when type is selected */
          <div className="flex-1">
            <InsuranceDetailPanel
              selectedType={selectedType}
              subTypes={selectedConfig?.subTypes}
              typeLabel={selectedTypeLabel}
              contracts={analysis?.contracts || []}
              onClose={handleBack}
              onRefresh={loadData}
              onContractSelect={handleContractSelect}
              selectedContractId={selectedContractId}
            />
          </div>
        )}

        {/* Bottom - Discreet Totals */}
        {analysis && !selectedType && (
          <div className="border-t pt-4 bg-background">
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <div>
                Prime totale:{" "}
                <span className="font-medium text-foreground">
                  {analysis.totalAnnualPremium.toLocaleString('fr-CH')} CHF/an
                </span>
              </div>
              <div>
                Contrats actifs:{" "}
                <span className="font-medium text-foreground">
                  {analysis.contracts.length}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default Insurance;
