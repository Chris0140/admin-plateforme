import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const Budget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Budget Personnel State
  const [periodType, setPeriodType] = useState<"mensuel" | "annuel">("mensuel");
  const [revenuBrut, setRevenuBrut] = useState("");
  const [chargesSociales, setChargesSociales] = useState("");
  const [chargesSocialesManuallyEdited, setChargesSocialesManuallyEdited] = useState(false);
  const [depensesLogement, setDepensesLogement] = useState("");
  const [depensesTransport, setDepensesTransport] = useState("");
  const [depensesAlimentation, setDepensesAlimentation] = useState("");
  const [autresDepenses, setAutresDepenses] = useState("");

  // Prévoyance Retraite State
  const [avs1erPilier, setAvs1erPilier] = useState("");
  const [lpp2emePilier, setLpp2emePilier] = useState("");
  const [pilier3a, setPilier3a] = useState("");
  const [pilier3b, setPilier3b] = useState("");
  const [besoinPourcentage, setBesoinPourcentage] = useState("80");

  // Collapsible states for mobile
  const [revenusOpen, setRevenusOpen] = useState(true);
  const [depensesOpen, setDepensesOpen] = useState(true);

  // Charger les données depuis Supabase
  useEffect(() => {
    if (user) {
      fetchBudgetData();
    }
  }, [user]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('budget-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'budget_data',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchBudgetData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchBudgetData = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_data")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Charger les valeurs selon le periodType sélectionné
        const loadValues = (currentPeriodType: "mensuel" | "annuel") => {
          if (currentPeriodType === "mensuel") {
            setRevenuBrut(data.revenu_brut_mensuel?.toString() || "");
            if (data.charges_sociales_mensuel && data.charges_sociales_mensuel > 0) {
              setChargesSociales(data.charges_sociales_mensuel.toString());
              setChargesSocialesManuallyEdited(true);
            } else {
              setChargesSociales("");
              setChargesSocialesManuallyEdited(false);
            }
            setDepensesLogement(data.depenses_logement_mensuel?.toString() || "");
            setDepensesTransport(data.depenses_transport_mensuel?.toString() || "");
            setDepensesAlimentation(data.depenses_alimentation_mensuel?.toString() || "");
            setAutresDepenses(data.autres_depenses_mensuel?.toString() || "");
          } else {
            setRevenuBrut(data.revenu_brut_annuel?.toString() || "");
            if (data.charges_sociales_annuel && data.charges_sociales_annuel > 0) {
              setChargesSociales(data.charges_sociales_annuel.toString());
              setChargesSocialesManuallyEdited(true);
            } else {
              setChargesSociales("");
              setChargesSocialesManuallyEdited(false);
            }
            setDepensesLogement(data.depenses_logement_annuel?.toString() || "");
            setDepensesTransport(data.depenses_transport_annuel?.toString() || "");
            setDepensesAlimentation(data.depenses_alimentation_annuel?.toString() || "");
            setAutresDepenses(data.autres_depenses_annuel?.toString() || "");
          }
        };
        
        loadValues(periodType);
        
        setAvs1erPilier(data.avs_1er_pilier?.toString() || "");
        setLpp2emePilier(data.lpp_2eme_pilier?.toString() || "");
        setPilier3a(data.pilier_3a?.toString() || "");
        setPilier3b(data.pilier_3b?.toString() || "");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  const saveAllData = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour sauvegarder vos données",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: existingData } = await supabase
        .from("budget_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Conversion des valeurs
      const revenuBrutNum = parseFloat(revenuBrut) || 0;
      const chargesSocialesNum = parseFloat(chargesSociales) || 0;
      const depensesLogementNum = parseFloat(depensesLogement) || 0;
      const depensesTransportNum = parseFloat(depensesTransport) || 0;
      const depensesAlimentationNum = parseFloat(depensesAlimentation) || 0;
      const autresDepensesNum = parseFloat(autresDepenses) || 0;

      // Calculer les versions mensuelle et annuelle pour tous les champs
      const revenu_brut_mensuel = periodType === "mensuel" ? revenuBrutNum : Math.round(revenuBrutNum / 12);
      const revenu_brut_annuel = periodType === "annuel" ? revenuBrutNum : revenuBrutNum * 12;
      const charges_sociales_mensuel = periodType === "mensuel" ? chargesSocialesNum : Math.round(chargesSocialesNum / 12);
      const charges_sociales_annuel = periodType === "annuel" ? chargesSocialesNum : chargesSocialesNum * 12;
      const depenses_logement_mensuel = periodType === "mensuel" ? depensesLogementNum : Math.round(depensesLogementNum / 12);
      const depenses_logement_annuel = periodType === "annuel" ? depensesLogementNum : depensesLogementNum * 12;
      const depenses_transport_mensuel = periodType === "mensuel" ? depensesTransportNum : Math.round(depensesTransportNum / 12);
      const depenses_transport_annuel = periodType === "annuel" ? depensesTransportNum : depensesTransportNum * 12;
      const depenses_alimentation_mensuel = periodType === "mensuel" ? depensesAlimentationNum : Math.round(depensesAlimentationNum / 12);
      const depenses_alimentation_annuel = periodType === "annuel" ? depensesAlimentationNum : depensesAlimentationNum * 12;
      const autres_depenses_mensuel = periodType === "mensuel" ? autresDepensesNum : Math.round(autresDepensesNum / 12);
      const autres_depenses_annuel = periodType === "annuel" ? autresDepensesNum : autresDepensesNum * 12;

      const allData = {
        user_id: user.id,
        period_type: periodType,
        revenu_brut: revenuBrutNum,
        charges_sociales: chargesSocialesNum,
        depenses_logement: depensesLogementNum,
        depenses_transport: depensesTransportNum,
        depenses_alimentation: depensesAlimentationNum,
        autres_depenses: autresDepensesNum,
        revenu_brut_mensuel,
        revenu_brut_annuel,
        charges_sociales_mensuel,
        charges_sociales_annuel,
        depenses_logement_mensuel,
        depenses_logement_annuel,
        depenses_transport_mensuel,
        depenses_transport_annuel,
        depenses_alimentation_mensuel,
        depenses_alimentation_annuel,
        autres_depenses_mensuel,
        autres_depenses_annuel,
        avs_1er_pilier: parseFloat(avs1erPilier) || 0,
        lpp_2eme_pilier: parseFloat(lpp2emePilier) || 0,
        pilier_3a: parseFloat(pilier3a) || 0,
        pilier_3b: parseFloat(pilier3b) || 0,
      };

      if (existingData) {
        const { error } = await supabase
          .from("budget_data")
          .update(allData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget_data")
          .insert(allData);

        if (error) throw error;
      }

      // Synchroniser les données de prévoyance vers prevoyance_data
      const { data: existingPrevoyance } = await supabase
        .from("prevoyance_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const prevoyanceDataToSave = {
        user_id: user.id,
        avs_1er_pilier: parseFloat(avs1erPilier) || 0,
        lpp_2eme_pilier: parseFloat(lpp2emePilier) || 0,
        pilier_3a: parseFloat(pilier3a) || 0,
        pilier_3b: parseFloat(pilier3b) || 0,
      };

      if (existingPrevoyance) {
        await supabase
          .from("prevoyance_data")
          .update(prevoyanceDataToSave)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("prevoyance_data")
          .insert(prevoyanceDataToSave);
      }

      toast({
        title: "Succès",
        description: "Budget sauvegardé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder vos données",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Recharger les données lors du changement de période
  useEffect(() => {
    if (user) {
      fetchBudgetData();
    }
  }, [periodType]);

  // Calculs Budget Personnel
  const multiplier = 1;
  const revenuNet = parseFloat(revenuBrut || "0") - parseFloat(chargesSociales || "0");
  const totalDepenses = 
    parseFloat(depensesLogement || "0") +
    parseFloat(depensesTransport || "0") +
    parseFloat(depensesAlimentation || "0") +
    parseFloat(autresDepenses || "0");
  const solde = revenuNet - totalDepenses;
  
  // Montants affichés (déjà dans la bonne unité)
  const revenuNetAffiche = revenuNet;
  const totalDepensesAffiche = totalDepenses;
  const soldeAffiche = solde;

  // Calculs Prévoyance Retraite
  const total1erPilier = parseFloat(avs1erPilier || "0");
  const total2emePilier = parseFloat(lpp2emePilier || "0");
  const total3emePilier = parseFloat(pilier3a || "0") + parseFloat(pilier3b || "0");
  const totalPrevoyance = total1erPilier + total2emePilier + total3emePilier;

  // Données pour les graphiques de prévoyance
  const dataRetraite = [
    { name: "1er Pilier (AVS)", montant: total1erPilier },
    { name: "2ème Pilier (LPP)", montant: total2emePilier },
    { name: "3ème Pilier", montant: total3emePilier },
  ];

  // Estimations pour invalidité et décès (pourcentages typiques)
  const dataInvalidite = [
    { name: "1er Pilier", montant: total1erPilier * 0.6 },
    { name: "2ème Pilier", montant: total2emePilier * 0.6 },
    { name: "3ème Pilier", montant: total3emePilier * 0.5 },
  ];

  const dataDeces = [
    { name: "1er Pilier", montant: total1erPilier * 0.4 },
    { name: "2ème Pilier", montant: total2emePilier * 0.5 },
    { name: "3ème Pilier", montant: total3emePilier },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Gestion de Budget</h1>
          
          <Tabs defaultValue="personnel" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="personnel">Budget Personnel</TabsTrigger>
              <TabsTrigger value="prevoyance">Prévoyance Retraite</TabsTrigger>
            </TabsList>

            {/* Budget Personnel */}
            <TabsContent value="personnel">
              <div className="mb-6 flex flex-col items-center gap-4">
                <ToggleGroup 
                  type="single" 
                  value={periodType}
                  onValueChange={(value) => value && setPeriodType(value as "mensuel" | "annuel")}
                  className="bg-muted rounded-lg p-1"
                >
                  <ToggleGroupItem value="mensuel" className="px-6">
                    Mensuel
                  </ToggleGroupItem>
                  <ToggleGroupItem value="annuel" className="px-6">
                    Annuel
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Section Revenus - Collapsible sur mobile */}
                <Collapsible open={revenusOpen} onOpenChange={setRevenusOpen} className="md:contents">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Revenus</CardTitle>
                          <CardDescription>Vos revenus {periodType === "mensuel" ? "mensuels" : "annuels"}</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="md:hidden">
                            <ChevronDown className={`h-4 w-4 transition-transform ${revenusOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="revenuBrut">Revenu brut (CHF)</Label>
                          <Input
                            id="revenuBrut"
                            type="number"
                            step="1"
                            placeholder="8'000"
                            value={revenuBrut}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setRevenuBrut(value);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="chargesSociales">Charges sociales (CHF)</Label>
                          <Input
                            id="chargesSociales"
                            type="number"
                            step="1"
                            placeholder="1'200"
                            value={chargesSociales}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setChargesSociales(value);
                              setChargesSocialesManuallyEdited(true);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Proposition: 6,8% du salaire brut</p>
                        </div>
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground">Revenu net</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(revenuNet)}</p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Section Dépenses Fixes - Collapsible sur mobile */}
                <Collapsible open={depensesOpen} onOpenChange={setDepensesOpen} className="md:contents">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Dépenses Fixes</CardTitle>
                          <CardDescription>Vos dépenses {periodType === "mensuel" ? "mensuelles" : "annuelles"}</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="md:hidden">
                            <ChevronDown className={`h-4 w-4 transition-transform ${depensesOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="depensesLogement">Logement (CHF)</Label>
                          <Input
                            id="depensesLogement"
                            type="number"
                            step="1"
                            placeholder="1'500"
                            value={depensesLogement}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setDepensesLogement(value);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="depensesTransport">Assurances (CHF)</Label>
                          <Input
                            id="depensesTransport"
                            type="number"
                            step="1"
                            placeholder="300"
                            value={depensesTransport}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setDepensesTransport(value);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="depensesAlimentation">Alimentation (CHF)</Label>
                          <Input
                            id="depensesAlimentation"
                            type="number"
                            step="1"
                            placeholder="600"
                            value={depensesAlimentation}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setDepensesAlimentation(value);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="autresDepenses">Autres dépenses (CHF)</Label>
                          <Input
                            id="autresDepenses"
                            type="number"
                            step="1"
                            placeholder="400"
                            value={autresDepenses}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setAutresDepenses(value);
                          }}
                        />
                      </div>
                    </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {user && (
                  <div className="flex justify-center mb-6 md:col-span-2">
                    <Button 
                      onClick={saveAllData} 
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer le budget
                    </Button>
                  </div>
                )}

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Résumé {periodType === "mensuel" ? "Mensuel" : "Annuel"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Revenu Net</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(revenuNetAffiche)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Total Dépenses</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalDepensesAffiche)}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Solde</p>
                        <p className={`text-2xl font-bold ${soldeAffiche >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(soldeAffiche)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Prévoyance Retraite */}
            <TabsContent value="prevoyance">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Avoirs de Prévoyance</CardTitle>
                    <CardDescription>Cumulez vos avoirs des trois piliers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Revenu Net et Besoin */}
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Revenu net {periodType === "mensuel" ? "mensuel" : "annuel"}</p>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(revenuNet)}</p>
                        </div>
                        <div>
                          <Label htmlFor="besoinPourcentage">Besoin en retraite (% du revenu net)</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="besoinPourcentage"
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              placeholder="80"
                              value={besoinPourcentage}
                              onChange={(e) => {
                                let value = e.target.value;
                                value = value.replace(/^0+(?=\d)/, '');
                                setBesoinPourcentage(value);
                              }}
                              className="w-24"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                          <p className="text-sm font-semibold text-primary mt-2">
                            = {formatCurrency(revenuNet * (parseFloat(besoinPourcentage) || 0) / 100)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Montant estimé nécessaire à la retraite</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="avs1erPilier">1er Pilier - AVS (rente annuelle CHF)</Label>
                          <Input
                            id="avs1erPilier"
                            type="number"
                            step="1"
                            placeholder="28'680"
                            value={avs1erPilier}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setAvs1erPilier(value);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Rente AVS estimée</p>
                        </div>
                        <div>
                          <Label htmlFor="lpp2emePilier">2ème Pilier - LPP (avoir total CHF)</Label>
                          <Input
                            id="lpp2emePilier"
                            type="number"
                            step="1"
                            placeholder="350'000"
                            value={lpp2emePilier}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setLpp2emePilier(value);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Capital accumulé dans la LPP</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="pilier3a">3ème Pilier A (avoir CHF)</Label>
                          <Input
                            id="pilier3a"
                            type="number"
                            step="1"
                            placeholder="50'000"
                            value={pilier3a}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setPilier3a(value);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Prévoyance liée</p>
                        </div>
                        <div>
                          <Label htmlFor="pilier3b">3ème Pilier B (avoir CHF)</Label>
                          <Input
                            id="pilier3b"
                            type="number"
                            step="1"
                            placeholder="25'000"
                            value={pilier3b}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/^0+(?=\d)/, '');
                              setPilier3b(value);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Prévoyance libre</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Total Prévoyance</p>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(totalPrevoyance)}</p>
                    </div>
                    {user && (
                      <div className="flex justify-end mt-6">
                        <Button 
                          onClick={saveAllData} 
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Enregistrer le budget
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Graphique Retraite */}
                <Card>
                  <CardHeader>
                    <CardTitle>Situation à la Retraite</CardTitle>
                    <CardDescription>Répartition de vos avoirs de prévoyance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataRetraite}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="montant" fill="hsl(var(--primary))" name="Montant (CHF)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Graphique Invalidité */}
                <Card>
                  <CardHeader>
                    <CardTitle>Situation en cas d'Invalidité</CardTitle>
                    <CardDescription>Prestations estimées en cas d'invalidité</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataInvalidite}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="montant" fill="hsl(var(--secondary))" name="Rente annuelle (CHF)" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground mt-4">
                      * Estimation basée sur 60% des avoirs (1er et 2ème pilier) et 50% du 3ème pilier
                    </p>
                  </CardContent>
                </Card>

                {/* Graphique Décès */}
                <Card>
                  <CardHeader>
                    <CardTitle>Situation en cas de Décès</CardTitle>
                    <CardDescription>Prestations pour les survivants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataDeces}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="montant" fill="hsl(var(--accent))" name="Capital versé (CHF)" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground mt-4">
                      * Estimation basée sur 40% (1er pilier), 50% (2ème pilier) et 100% (3ème pilier)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Budget;
