import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calculator, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateAllAVSPensions, saveAVSProfile, loadAVSProfile } from "@/lib/avsCalculations";

const AVS = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [avsNumber, setAvsNumber] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [annualGrossIncome, setAnnualGrossIncome] = useState("");
  const [yearsContributed, setYearsContributed] = useState(44);
  const [avsResults, setAvsResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        .select('id, etat_civil')
        .eq('user_id', currentUser.id)
        .single();

      if (!profile) return;

      setProfileId(profile.id);
      
      // Load existing marital status from profile if not in AVS profile
      if (profile.etat_civil) {
        setMaritalStatus(profile.etat_civil);
      }

      // Load AVS data
      const avsProfile = await loadAVSProfile(profile.id);
      if (avsProfile) {
        setAvsNumber(avsProfile.avs_number || "");
        setMaritalStatus(avsProfile.marital_status || profile.etat_civil || "");
        setAnnualGrossIncome(avsProfile.average_annual_income_determinant?.toString() || "");
        setYearsContributed(avsProfile.years_contributed || 44);

        // If we have saved data, calculate results
        if (avsProfile.average_annual_income_determinant) {
          const results = await calculateAllAVSPensions(
            avsProfile.average_annual_income_determinant,
            avsProfile.years_contributed || 44
          );
          setAvsResults(results);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCalculate = async () => {
    const income = parseFloat(annualGrossIncome);
    
    if (isNaN(income) || income <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un revenu valide",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      const results = await calculateAllAVSPensions(income, yearsContributed);
      setAvsResults(results);

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
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    const income = parseFloat(annualGrossIncome);
    
    if (!profileId) {
      toast({
        title: "Erreur",
        description: "Profil non trouvé",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(income) || income <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un revenu valide",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save AVS profile with new fields
      await saveAVSProfile(profileId, income, yearsContributed);

      // Update AVS number and marital status
      const { error: updateError } = await supabase
        .from('avs_profiles')
        .update({
          avs_number: avsNumber || null,
          marital_status: maritalStatus || null,
        })
        .eq('profile_id', profileId);

      if (updateError) throw updateError;

      toast({
        title: "Données sauvegardées",
        description: "Vos informations AVS ont été enregistrées avec succès",
      });
    } catch (error) {
      console.error('Error saving AVS data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les données",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

  const yearsMissing = 44 - yearsContributed;
  const rentCoefficient = Math.round((yearsContributed / 44) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/prevoyance')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à Prévoyance
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">1er Pilier - AVS</h1>
            <p className="text-muted-foreground">Assurance Vieillesse et Survivants</p>
          </div>

          <div className="space-y-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Vos données AVS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="avsNumber">Numéro AVS (optionnel)</Label>
                  <Input
                    id="avsNumber"
                    placeholder="756.XXXX.XXXX.XX"
                    value={avsNumber}
                    onChange={(e) => setAvsNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: 756.XXXX.XXXX.XX
                  </p>
                </div>

                <div>
                  <Label htmlFor="maritalStatus">État civil</Label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                    <SelectTrigger id="maritalStatus" className="mt-1">
                      <SelectValue placeholder="Sélectionnez votre état civil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="célibataire">Célibataire</SelectItem>
                      <SelectItem value="marié">Marié(e)</SelectItem>
                      <SelectItem value="divorcé">Divorcé(e)</SelectItem>
                      <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                      <SelectItem value="partenariat_enregistré">Partenariat enregistré</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Historique de cotisation */}
            <Card>
              <CardHeader>
                <CardTitle>Historique de cotisation</CardTitle>
                <CardDescription>Vos années de cotisation AVS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="yearsContributed">Années cotisées</Label>
                    <Input
                      id="yearsContributed"
                      type="number"
                      min="0"
                      max="44"
                      value={yearsContributed}
                      onChange={(e) => setYearsContributed(Number(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum : 44 ans (entre 21 et 65 ans)
                    </p>
                  </div>
                  <div>
                    <Label>Années manquantes</Label>
                    <Input
                      type="number"
                      value={yearsMissing}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Coefficient de rente</Label>
                    <Input
                      value={`${rentCoefficient}%`}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                </div>

                {yearsMissing > 0 && (
                  <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">
                      Attention : Vous avez {yearsMissing} années de lacunes.
                      Vos rentes AVS seront réduites proportionnellement.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calcul des rentes */}
            <Card>
              <CardHeader>
                <CardTitle>Calcul des rentes</CardTitle>
                <CardDescription>Estimation de vos rentes AVS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="annualGrossIncome">Revenu brut annuel (CHF)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="annualGrossIncome"
                      type="number"
                      step="1"
                      placeholder="96000"
                      value={annualGrossIncome}
                      onChange={(e) => setAnnualGrossIncome(e.target.value.replace(/^0+(?=\d)/, ''))}
                    />
                    <Button 
                      onClick={handleCalculate} 
                      disabled={isCalculating}
                      className="gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Calculer
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Selon l'Échelle 44 2025</p>
                </div>

                {/* Résultats */}
                {avsResults && (
                  <div className="grid md:grid-cols-3 gap-4 pt-4">
                    <Card className="border-2 border-primary/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Rente vieillesse</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">
                          {formatCHF(avsResults.oldAge.fullRent.annual)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCHF(avsResults.oldAge.fullRent.monthly)} / mois
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-primary/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Rente invalidité</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">
                          {formatCHF(avsResults.disability.fullRent.annual)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCHF(avsResults.disability.fullRent.monthly)} / mois
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-primary/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Rente veuve/veuf</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">
                          {formatCHF(avsResults.widow.fullRent.annual)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCHF(avsResults.widow.fullRent.monthly)} / mois
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                size="lg"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AVS;
