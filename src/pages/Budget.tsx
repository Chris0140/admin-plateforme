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
import { Save } from "lucide-react";

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
        setPeriodType(data.period_type as "mensuel" | "annuel");
        setRevenuBrut(data.revenu_brut?.toString() || "");
        
        // Si charges_sociales > 0, on utilise la valeur du profil
        // Sinon, on laisse le calcul automatique s'appliquer
        if (data.charges_sociales && data.charges_sociales > 0) {
          setChargesSociales(data.charges_sociales.toString());
          setChargesSocialesManuallyEdited(true);
        } else {
          setChargesSociales("");
          setChargesSocialesManuallyEdited(false);
        }
        
        setDepensesLogement(data.depenses_logement?.toString() || "");
        setDepensesTransport(data.depenses_transport?.toString() || "");
        setDepensesAlimentation(data.depenses_alimentation?.toString() || "");
        setAutresDepenses(data.autres_depenses?.toString() || "");
        setAvs1erPilier(data.avs_1er_pilier?.toString() || "");
        setLpp2emePilier(data.lpp_2eme_pilier?.toString() || "");
        setPilier3a(data.pilier_3a?.toString() || "");
        setPilier3b(data.pilier_3b?.toString() || "");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  const saveRevenusData = async () => {
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

      const revenusData = {
        user_id: user.id,
        period_type: periodType,
        revenu_brut: parseFloat(revenuBrut) || 0,
        charges_sociales: parseFloat(chargesSociales) || 0,
      };

      if (existingData) {
        const { error } = await supabase
          .from("budget_data")
          .update(revenusData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget_data")
          .insert(revenusData);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Revenus sauvegardés dans votre profil",
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

  const saveDepensesData = async () => {
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

      const depensesData = {
        user_id: user.id,
        period_type: periodType,
        depenses_logement: parseFloat(depensesLogement) || 0,
        depenses_transport: parseFloat(depensesTransport) || 0,
        depenses_alimentation: parseFloat(depensesAlimentation) || 0,
        autres_depenses: parseFloat(autresDepenses) || 0,
      };

      if (existingData) {
        const { error } = await supabase
          .from("budget_data")
          .update(depensesData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget_data")
          .insert(depensesData);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Dépenses sauvegardées dans votre profil",
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

  const savePrevoyanceData = async () => {
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

      const prevoyanceData = {
        user_id: user.id,
        period_type: periodType,
        avs_1er_pilier: parseFloat(avs1erPilier) || 0,
        lpp_2eme_pilier: parseFloat(lpp2emePilier) || 0,
        pilier_3a: parseFloat(pilier3a) || 0,
        pilier_3b: parseFloat(pilier3b) || 0,
      };

      if (existingData) {
        const { error } = await supabase
          .from("budget_data")
          .update(prevoyanceData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget_data")
          .insert(prevoyanceData);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Prévoyance sauvegardée dans votre profil",
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

  // Calcul automatique des charges sociales à 6,8% du salaire brut
  useEffect(() => {
    if (revenuBrut && (!chargesSocialesManuallyEdited || !chargesSociales)) {
      const brut = parseFloat(revenuBrut);
      if (!isNaN(brut)) {
        const chargesAuto = (brut * 0.068).toFixed(0);
        setChargesSociales(chargesAuto);
      }
    }
  }, [revenuBrut, chargesSocialesManuallyEdited, chargesSociales]);

  // Ajustement automatique des valeurs lors du changement de période
  useEffect(() => {
    const prevPeriod = localStorage.getItem('budgetPeriodType') || 'mensuel';
    
    if (prevPeriod !== periodType) {
      const multiplier = periodType === 'annuel' ? 12 : 1/12;
      
      if (revenuBrut) setRevenuBrut((parseFloat(revenuBrut) * multiplier).toFixed(0));
      if (chargesSociales) {
        setChargesSociales((parseFloat(chargesSociales) * multiplier).toFixed(0));
        setChargesSocialesManuallyEdited(true);
      }
      if (depensesLogement) setDepensesLogement((parseFloat(depensesLogement) * multiplier).toFixed(0));
      if (depensesTransport) setDepensesTransport((parseFloat(depensesTransport) * multiplier).toFixed(0));
      if (depensesAlimentation) setDepensesAlimentation((parseFloat(depensesAlimentation) * multiplier).toFixed(0));
      if (autresDepenses) setAutresDepenses((parseFloat(autresDepenses) * multiplier).toFixed(0));
      
      localStorage.setItem('budgetPeriodType', periodType);
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
                <Card>
                  <CardHeader>
                    <CardTitle>Revenus</CardTitle>
                    <CardDescription>Vos revenus {periodType === "mensuel" ? "mensuels" : "annuels"}</CardDescription>
                  </CardHeader>
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
                    {user && (
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={saveRevenusData} 
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Save className="h-3 w-3" />
                          Mettre à jour le profil
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dépenses Fixes</CardTitle>
                    <CardDescription>Vos dépenses mensuelles</CardDescription>
                  </CardHeader>
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
                    {user && (
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={saveDepensesData} 
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Save className="h-3 w-3" />
                          Mettre à jour le profil
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={savePrevoyanceData} 
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Save className="h-3 w-3" />
                          Mettre à jour le profil
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
