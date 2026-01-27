import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateInsuranceAnalysis, InsuranceAnalysis, InsuranceContract } from "@/lib/insuranceCalculations";
import InsuranceDetailPanel from "@/components/insurance/InsuranceDetailPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Heart, Home, Car, Shield, Upload, Info, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CategoryConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  types: InsuranceContract['insurance_type'][];
}

const CATEGORIES: CategoryConfig[] = [
  { 
    id: 'maladie', 
    name: 'Assurance Maladie', 
    icon: Heart, 
    color: 'text-red-500',
    types: ['health_basic', 'health_complementary']
  },
  { 
    id: 'menage', 
    name: 'Ménage & RC', 
    icon: Home, 
    color: 'text-blue-500',
    types: ['household', 'liability']
  },
  { 
    id: 'auto', 
    name: 'Véhicules', 
    icon: Car, 
    color: 'text-orange-500',
    types: ['vehicle']
  },
  { 
    id: 'vie', 
    name: 'Prévoyance / Vie', 
    icon: Shield, 
    color: 'text-purple-500',
    types: ['life', 'disability', 'loss_of_earnings', 'legal_protection']
  },
];

const Insurance = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [analysis, setAnalysis] = useState<InsuranceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    contract_number: '',
    monthly_premium: '',
    end_date: '',
    notes: ''
  });

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

  const handleBack = () => {
    setActiveCategory(null);
    setSelectedContractId(null);
  };

  const handleContractSelect = (contractId: string) => {
    setSelectedContractId(contractId);
  };

  const getCategoryStats = useMemo(() => {
    if (!analysis) return {};
    
    const stats: Record<string, { count: number; premium: number }> = {};
    
    for (const cat of CATEGORIES) {
      const contracts = analysis.contracts.filter(c => 
        cat.types.includes(c.insurance_type)
      );
      stats[cat.id] = {
        count: contracts.length,
        premium: contracts.reduce((sum, c) => sum + c.annual_premium, 0),
      };
    }
    
    return stats;
  }, [analysis]);

  const selectedCategory = CATEGORIES.find(c => c.id === activeCategory);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      setUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleFormSubmit = async () => {
    // TODO: Implement contract creation with file upload
    toast({
      title: "Contrat enregistré",
      description: "Le contrat a été ajouté avec succès.",
    });
    setShowAddDialog(false);
    setUploadedFile(null);
    setFormData({
      company_name: '',
      contract_number: '',
      monthly_premium: '',
      end_date: '',
      notes: ''
    });
    loadData();
  };

  const resetDialog = () => {
    setShowAddDialog(false);
    setUploadedFile(null);
    setFormData({
      company_name: '',
      contract_number: '',
      monthly_premium: '',
      end_date: '',
      notes: ''
    });
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
    <AppLayout title="Ma Bibliothèque d'Assurances" subtitle="Centralisez et pilotez tous vos contrats au même endroit.">
      <div className="flex flex-col gap-6">
        
        {/* Grid of category cubes */}
        {!activeCategory && (
          <>
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {CATEGORIES.map((cat) => {
                const stats = getCategoryStats[cat.id] || { count: 0, premium: 0 };
                const IconComponent = cat.icon;
                
                return (
                  <Card
                    key={cat.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 relative",
                      "bg-card"
                    )}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6 min-h-[160px]">
                      <IconComponent className={cn("h-12 w-12 mb-3", cat.color)} />
                      <span className="text-sm font-medium text-center">{cat.name}</span>
                      {stats.count > 0 && (
                        <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {stats.count}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Bottom totals */}
            {analysis && (
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
          </>
        )}

        {/* Detail view when category is selected */}
        {activeCategory && selectedCategory && (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {(() => {
                  const IconComponent = selectedCategory.icon;
                  return <IconComponent className={cn("h-5 w-5", selectedCategory.color)} />;
                })()}
                Contrats : {selectedCategory.name}
              </h3>
            </div>

            {/* Add contract button with dialog */}
            <Dialog open={showAddDialog} onOpenChange={(open) => !open ? resetDialog() : setShowAddDialog(open)}>
              <DialogTrigger asChild>
                <Button variant="default" className="w-fit">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau contrat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un contrat</DialogTitle>
                </DialogHeader>
                
                {/* Two column layout */}
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  
                  {/* Left column: PDF Upload */}
                  <div className="space-y-4">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                        isDragging 
                          ? "border-primary bg-primary/5" 
                          : "border-muted-foreground/25 hover:border-primary/50",
                        uploadedFile && "border-green-500 bg-green-500/5"
                      )}
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      {uploadedFile ? (
                        <div className="space-y-2">
                          <FileText className="h-10 w-10 mx-auto text-green-500" />
                          <p className="text-sm font-medium text-green-600">{uploadedFile.name}</p>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFile(null);
                            }}
                          >
                            Supprimer
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Glissez votre document PDF ici
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            ou cliquez pour sélectionner un fichier
                          </p>
                        </>
                      )}
                    </div>

                    {/* AI extraction info */}
                    <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        L'IA extraira bientôt les données automatiquement.
                      </p>
                    </div>

                    {/* Vault security info */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-help">
                          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            Vos documents sont chiffrés et stockés en toute confidentialité dans votre Admin Vault en Suisse.
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Stockage sécurisé et conforme aux normes suisses</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Right column: Manual form */}
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez compléter ou modifier les données manuellement.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Compagnie d'assurance</Label>
                        <Input
                          id="company"
                          placeholder="Ex: Groupe Mutuel, CSS, Helvetia..."
                          value={formData.company_name}
                          onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="police">N° de police / Contrat</Label>
                        <Input
                          id="police"
                          placeholder="Ex: POL-2024-123456"
                          value={formData.contract_number}
                          onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="premium">Prime mensuelle (CHF)</Label>
                          <Input
                            id="premium"
                            type="number"
                            placeholder="0.00"
                            value={formData.monthly_premium}
                            onChange={(e) => setFormData({...formData, monthly_premium: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Échéance du contrat</Label>
                          <Input
                            id="expiry"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Couvertures & Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Informations complémentaires..."
                          className="min-h-[100px]"
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full py-6 text-lg font-bold"
                      onClick={handleFormSubmit}
                    >
                      Enregistrer le contrat
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contract list / Detail panel */}
            <InsuranceDetailPanel
              selectedType={activeCategory}
              subTypes={selectedCategory.types}
              typeLabel={selectedCategory.name}
              contracts={analysis?.contracts || []}
              onClose={handleBack}
              onRefresh={loadData}
              onContractSelect={handleContractSelect}
              selectedContractId={selectedContractId}
            />

            {/* Empty state if no contracts */}
            {analysis && analysis.contracts.filter(c => selectedCategory.types.includes(c.insurance_type)).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText size={64} className="mb-4 opacity-20" />
                <p>Aucun contrat enregistré dans cette catégorie pour le moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Insurance;
