import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { saveLPPAccount } from "@/lib/lppCalculations";
import type { Database } from "@/integrations/supabase/types";

type LPPAccount = Database['public']['Tables']['lpp_accounts']['Row'];
type LPPAccountInsert = Database['public']['Tables']['lpp_accounts']['Insert'];

interface LPPAccountFormProps {
  profileId: string;
  account: LPPAccount | null;
  open: boolean;
  onClose: () => void;
}

export function LPPAccountForm({ profileId, account, open, onClose }: LPPAccountFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<LPPAccountInsert>>({
    profile_id: profileId,
    provider_name: "",
    contract_number: "",
    plan_name: "",
    current_retirement_savings: 0,
    projected_savings_at_65: 0,
    projected_retirement_rent_at_65: 0,
    disability_rent_annual: 0,
    child_disability_rent_annual: 0,
    widow_rent_annual: 0,
    orphan_rent_annual: 0,
    death_capital: 0,
    additional_death_capital: 0,
    is_active: true
  });

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.provider_name) {
      toast({
        title: "Erreur",
        description: "Le nom de la caisse de pension est obligatoire",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await saveLPPAccount(formData as LPPAccountInsert);
      
      toast({
        title: "Succès",
        description: account ? "Compte LPP mis à jour" : "Compte LPP ajouté"
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le compte",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof LPPAccountInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {account ? "Modifier le compte LPP" : "Ajouter un compte LPP"}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de votre certificat de prévoyance professionnelle
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Base</TabsTrigger>
              <TabsTrigger value="retirement">Retraite</TabsTrigger>
              <TabsTrigger value="disability">Invalidité</TabsTrigger>
              <TabsTrigger value="death">Décès</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="provider_name">Caisse de pension *</Label>
                <Input
                  id="provider_name"
                  value={formData.provider_name || ""}
                  onChange={(e) => updateField('provider_name', e.target.value)}
                  placeholder="Ex: Caisse de pension XYZ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_number">N° de contrat</Label>
                  <Input
                    id="contract_number"
                    value={formData.contract_number || ""}
                    onChange={(e) => updateField('contract_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="plan_name">Nom du plan</Label>
                  <Input
                    id="plan_name"
                    value={formData.plan_name || ""}
                    onChange={(e) => updateField('plan_name', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="last_certificate_date">Date du dernier certificat</Label>
                <Input
                  id="last_certificate_date"
                  type="date"
                  value={formData.last_certificate_date || ""}
                  onChange={(e) => updateField('last_certificate_date', e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Retirement */}
            <TabsContent value="retirement" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_retirement_savings">Avoir de vieillesse actuel (CHF)</Label>
                  <Input
                    id="current_retirement_savings"
                    type="number"
                    value={formData.current_retirement_savings || 0}
                    onChange={(e) => updateField('current_retirement_savings', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="projected_savings_at_65">Avoir projeté à 65 ans (CHF)</Label>
                  <Input
                    id="projected_savings_at_65"
                    type="number"
                    value={formData.projected_savings_at_65 || 0}
                    onChange={(e) => updateField('projected_savings_at_65', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="projected_retirement_rent_at_65">Rente annuelle projetée à 65 ans (CHF)</Label>
                <Input
                  id="projected_retirement_rent_at_65"
                  type="number"
                  value={formData.projected_retirement_rent_at_65 || 0}
                  onChange={(e) => updateField('projected_retirement_rent_at_65', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Rente mensuelle : {((formData.projected_retirement_rent_at_65 || 0) / 12).toFixed(2)} CHF
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="conversion_rate_at_65">Taux de conversion à 65 ans (%)</Label>
                  <Input
                    id="conversion_rate_at_65"
                    type="number"
                    step="0.01"
                    value={formData.conversion_rate_at_65 || 0}
                    onChange={(e) => updateField('conversion_rate_at_65', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="interest_rate">Taux d'intérêt (%)</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate || 0}
                    onChange={(e) => updateField('interest_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Disability */}
            <TabsContent value="disability" className="space-y-4">
              <div>
                <Label htmlFor="disability_rent_annual">Rente d'invalidité annuelle (CHF)</Label>
                <Input
                  id="disability_rent_annual"
                  type="number"
                  value={formData.disability_rent_annual || 0}
                  onChange={(e) => updateField('disability_rent_annual', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Rente mensuelle : {((formData.disability_rent_annual || 0) / 12).toFixed(2)} CHF
                </p>
              </div>

              <div>
                <Label htmlFor="child_disability_rent_annual">Rente enfant d'invalide annuelle (CHF)</Label>
                <Input
                  id="child_disability_rent_annual"
                  type="number"
                  value={formData.child_disability_rent_annual || 0}
                  onChange={(e) => updateField('child_disability_rent_annual', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Par enfant, rente mensuelle : {((formData.child_disability_rent_annual || 0) / 12).toFixed(2)} CHF
                </p>
              </div>

              <div>
                <Label htmlFor="waiting_period_days">Délai d'attente (jours)</Label>
                <Input
                  id="waiting_period_days"
                  type="number"
                  value={formData.waiting_period_days || 0}
                  onChange={(e) => updateField('waiting_period_days', parseInt(e.target.value) || 0)}
                />
              </div>
            </TabsContent>

            {/* Death */}
            <TabsContent value="death" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="death_capital">Capital décès (CHF)</Label>
                  <Input
                    id="death_capital"
                    type="number"
                    value={formData.death_capital || 0}
                    onChange={(e) => updateField('death_capital', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="additional_death_capital">Capital décès complémentaire (CHF)</Label>
                  <Input
                    id="additional_death_capital"
                    type="number"
                    value={formData.additional_death_capital || 0}
                    onChange={(e) => updateField('additional_death_capital', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="widow_rent_annual">Rente de veuve/veuf annuelle (CHF)</Label>
                <Input
                  id="widow_rent_annual"
                  type="number"
                  value={formData.widow_rent_annual || 0}
                  onChange={(e) => updateField('widow_rent_annual', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Rente mensuelle : {((formData.widow_rent_annual || 0) / 12).toFixed(2)} CHF
                </p>
              </div>

              <div>
                <Label htmlFor="orphan_rent_annual">Rente d'orphelin annuelle (CHF)</Label>
                <Input
                  id="orphan_rent_annual"
                  type="number"
                  value={formData.orphan_rent_annual || 0}
                  onChange={(e) => updateField('orphan_rent_annual', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Par enfant, rente mensuelle : {((formData.orphan_rent_annual || 0) / 12).toFixed(2)} CHF
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : account ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
