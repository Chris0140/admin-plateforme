import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, Calculator, AlertTriangle } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { calculateAllAVSPensions, formatCHF } from "@/lib/avsCalculations";

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
  const [besoinPourcentage, setBesoinPourcentage] = useState("80");
  
  // 1er Pilier AVS States
  const [avsRevenuDeterminant, setAvsRevenuDeterminant] = useState("");
  const [avsRenteMensuelle, setAvsRenteMensuelle] = useState("");
  const [avsRenteAnnuelle, setAvsRenteAnnuelle] = useState("");
  const [avsInvaliditeMensuelle, setAvsInvaliditeMensuelle] = useState("");
  const [avsInvaliditeAnnuelle, setAvsInvaliditeAnnuelle] = useState("");
  const [isCalculatingAVS, setIsCalculatingAVS] = useState(false);
  
  // 2ème Pilier LPP States
  const [lppAvoirVieillesse, setLppAvoirVieillesse] = useState("");
  const [lppDerniereMaj, setLppDerniereMaj] = useState("");
  const [lppCapitalProjete65, setLppCapitalProjete65] = useState("");
  const [lppRenteMensuelleProjetee, setLppRenteMensuelleProjetee] = useState("");
  const [lppRenteAnnuelleProjetee, setLppRenteAnnuelleProjetee] = useState("");
  const [lppRenteInvaliditeMensuelle, setLppRenteInvaliditeMensuelle] = useState("");
  const [lppRenteInvaliditeAnnuelle, setLppRenteInvaliditeAnnuelle] = useState("");
  const [lppCapitalInvalidite, setLppCapitalInvalidite] = useState("");
  const [lppRenteEnfantInvalide, setLppRenteEnfantInvalide] = useState("");
  const [lppRenteConjointSurvivant, setLppRenteConjointSurvivant] = useState("");
  const [lppRenteOrphelins, setLppRenteOrphelins] = useState("");
  const [lppCapitalDeces, setLppCapitalDeces] = useState("");
  
  // 3ème Pilier States
  const [pilier3a, setPilier3a] = useState("");
  const [pilier3b, setPilier3b] = useState("");
  const [graphDisplayMode, setGraphDisplayMode] = useState<"mensuel" | "annuel">("mensuel");

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
      }

      // Charger les données de prévoyance depuis prevoyance_data
      const { data: prevoyanceData, error: prevoyanceError } = await supabase
        .from("prevoyance_data")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (prevoyanceError) throw prevoyanceError;

      if (prevoyanceData) {
        // Charger les données AVS
        setAvsRevenuDeterminant(prevoyanceData.revenu_annuel_determinant?.toString() || "");
        setAvsRenteMensuelle(prevoyanceData.rente_vieillesse_mensuelle?.toString() || "");
        setAvsRenteAnnuelle(prevoyanceData.rente_vieillesse_annuelle?.toString() || "");
        setAvsInvaliditeMensuelle(prevoyanceData.rente_invalidite_mensuelle?.toString() || "");
        setAvsInvaliditeAnnuelle(prevoyanceData.rente_invalidite_annuelle?.toString() || "");
        
        // Charger les données LPP
        setLppAvoirVieillesse(prevoyanceData.lpp_avoir_vieillesse?.toString() || "");
        setLppDerniereMaj(prevoyanceData.lpp_derniere_maj || "");
        setLppCapitalProjete65(prevoyanceData.lpp_capital_projete_65?.toString() || "");
        setLppRenteMensuelleProjetee(prevoyanceData.lpp_rente_mensuelle_projetee?.toString() || "");
        setLppRenteAnnuelleProjetee(prevoyanceData.lpp_rente_annuelle_projetee?.toString() || "");
        setLppRenteInvaliditeMensuelle(prevoyanceData.lpp_rente_invalidite_mensuelle?.toString() || "");
        setLppRenteInvaliditeAnnuelle(prevoyanceData.lpp_rente_invalidite_annuelle?.toString() || "");
        setLppCapitalInvalidite(prevoyanceData.lpp_capital_invalidite?.toString() || "");
        setLppRenteEnfantInvalide(prevoyanceData.lpp_rente_enfant_invalide?.toString() || "");
        setLppRenteConjointSurvivant(prevoyanceData.lpp_rente_conjoint_survivant?.toString() || "");
        setLppRenteOrphelins(prevoyanceData.lpp_rente_orphelins?.toString() || "");
        setLppCapitalDeces(prevoyanceData.lpp_capital_deces?.toString() || "");
        
        // Charger les données 3ème pilier
        setPilier3a(prevoyanceData.pilier_3a?.toString() || "");
        setPilier3b(prevoyanceData.pilier_3b?.toString() || "");
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

      // Sauvegarder les données de prévoyance dans prevoyance_data (source unique de vérité)
      const { data: existingPrevoyance } = await supabase
        .from("prevoyance_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const prevoyanceDataToSave = {
        user_id: user.id,
        // AVS 1er Pilier
        revenu_annuel_determinant: parseFloat(avsRevenuDeterminant) || 0,
        rente_vieillesse_mensuelle: parseFloat(avsRenteMensuelle) || 0,
        rente_vieillesse_annuelle: parseFloat(avsRenteAnnuelle) || 0,
        rente_invalidite_mensuelle: parseFloat(avsInvaliditeMensuelle) || 0,
        rente_invalidite_annuelle: parseFloat(avsInvaliditeAnnuelle) || 0,
        // LPP 2ème Pilier
        lpp_avoir_vieillesse: parseFloat(lppAvoirVieillesse) || 0,
        lpp_derniere_maj: lppDerniereMaj || null,
        lpp_capital_projete_65: parseFloat(lppCapitalProjete65) || 0,
        lpp_rente_mensuelle_projetee: parseFloat(lppRenteMensuelleProjetee) || 0,
        lpp_rente_annuelle_projetee: parseFloat(lppRenteAnnuelleProjetee) || 0,
        lpp_rente_invalidite_mensuelle: parseFloat(lppRenteInvaliditeMensuelle) || 0,
        lpp_rente_invalidite_annuelle: parseFloat(lppRenteInvaliditeAnnuelle) || 0,
        lpp_capital_invalidite: parseFloat(lppCapitalInvalidite) || 0,
        lpp_rente_enfant_invalide: parseFloat(lppRenteEnfantInvalide) || 0,
        lpp_rente_conjoint_survivant: parseFloat(lppRenteConjointSurvivant) || 0,
        lpp_rente_orphelins: parseFloat(lppRenteOrphelins) || 0,
        lpp_capital_deces: parseFloat(lppCapitalDeces) || 0,
        // 3ème Pilier
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

  const handleCalculateAVS = async () => {
    const revenuDeterminant = parseFloat(avsRevenuDeterminant) || 0;

    if (revenuDeterminant <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un revenu déterminant valide",
      });
      return;
    }

    setIsCalculatingAVS(true);

    try {
      const avsData = calculateAllAVSPensions(revenuDeterminant);
      
      setAvsRenteMensuelle(avsData.rente_vieillesse_mensuelle.toString());
      setAvsRenteAnnuelle(avsData.rente_vieillesse_annuelle.toString());
      setAvsInvaliditeMensuelle(avsData.rente_invalidite_mensuelle.toString());
      setAvsInvaliditeAnnuelle(avsData.rente_invalidite_annuelle.toString());

      toast({
        title: "Calcul AVS effectué",
        description: `Rente AVS calculée selon l'Echelle 44 2025: ${formatCHF(avsData.rente_vieillesse_mensuelle)}/mois`,
      });

    } catch (error) {
      console.error("Erreur lors du calcul AVS:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors du calcul AVS",
      });
    } finally {
      setIsCalculatingAVS(false);
    }
  };

  const handleImportLppData = async () => {
    if (!user) return;

    try {
      const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", "assurance")
        .eq("subcategory", "lpp")
        .eq("extraction_status", "completed")
        .order("uploaded_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!documents || documents.length === 0) {
        toast({
          variant: "destructive",
          title: "Aucun certificat LPP",
          description: "Veuillez d'abord uploader et analyser un certificat LPP",
        });
        return;
      }

      const lppData = documents[0].extracted_data as any;
      
      if (lppData) {
        setLppAvoirVieillesse(lppData.avoir_vieillesse?.toString() || "");
        setLppDerniereMaj(lppData.date_derniere_maj || "");
        setLppCapitalProjete65(lppData.capital_projete_65?.toString() || "");
        setLppRenteMensuelleProjetee(lppData.rente_mensuelle_projetee?.toString() || "");
        setLppRenteAnnuelleProjetee(lppData.rente_annuelle_projetee?.toString() || "");
        setLppRenteInvaliditeMensuelle(lppData.rente_invalidite_mensuelle?.toString() || "");
        setLppRenteInvaliditeAnnuelle(lppData.rente_invalidite_annuelle?.toString() || "");
        setLppCapitalInvalidite(lppData.capital_invalidite?.toString() || "");
        setLppRenteEnfantInvalide(lppData.rente_enfant_invalide?.toString() || "");
        setLppRenteConjointSurvivant(lppData.rente_conjoint_survivant?.toString() || "");
        setLppRenteOrphelins(lppData.rente_orphelins?.toString() || "");
        setLppCapitalDeces(lppData.capital_deces?.toString() || "");

        toast({
          title: "Données LPP importées",
          description: "Les données du certificat LPP ont été importées avec succès",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'import LPP:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'import des données LPP",
      });
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

  // Calculs Prévoyance Retraite - Revenus annuels à la retraite
  const avsRenteRetraite = parseFloat(avsRenteAnnuelle || "0");
  const lppRenteRetraite = parseFloat(lppRenteAnnuelleProjetee || "0");
  const pilier3TotalCapital = parseFloat(pilier3a || "0") + parseFloat(pilier3b || "0");
  const pilier3RenteAnnuelle = pilier3TotalCapital / 20; // Divisé par 20 ans
  const totalRevenuRetraiteAnnuel = avsRenteRetraite + lppRenteRetraite + pilier3RenteAnnuelle;

  // Variables pour compatibilité avec les autres graphiques
  const total1erPilier = avsRenteRetraite;
  const total2emePilier = parseFloat(lppAvoirVieillesse || "0");
  const total3emePilier = pilier3TotalCapital;
  const totalPrevoyance = total1erPilier + total2emePilier + total3emePilier;

  // Calcul du besoin selon le mode d'affichage
  const revenuBrutValue = parseFloat(revenuBrut) || 0;
  const besoinValue = graphDisplayMode === "mensuel" 
    ? (periodType === "mensuel" ? revenuBrutValue : revenuBrutValue / 12) * (parseFloat(besoinPourcentage) / 100)
    : (periodType === "annuel" ? revenuBrutValue : revenuBrutValue * 12) * (parseFloat(besoinPourcentage) / 100);

  // Calcul du revenu actuel et de retraite
  const revenuActuel = graphDisplayMode === "mensuel" 
    ? (periodType === "mensuel" ? revenuBrutValue : revenuBrutValue / 12)
    : (periodType === "annuel" ? revenuBrutValue : revenuBrutValue * 12);

  const avsValue = graphDisplayMode === "mensuel" ? Math.round(avsRenteRetraite / 12) : Math.round(avsRenteRetraite);
  const lppValue = graphDisplayMode === "mensuel" ? Math.round(lppRenteRetraite / 12) : Math.round(lppRenteRetraite);
  const pilier3Value = graphDisplayMode === "mensuel" ? Math.round(pilier3RenteAnnuelle / 12) : Math.round(pilier3RenteAnnuelle);
  
  const totalRetraite = avsValue + lppValue + pilier3Value;
  const lacune = Math.max(0, besoinValue - totalRetraite);

  // Données pour le graphique de comparaison (Actuel vs Retraite)
  const dataComparaison = [
    {
      periode: "Revenu actuel",
      revenu: revenuActuel,
      avs: 0,
      lpp: 0,
      pilier3: 0,
      lacune: 0,
    },
    {
      periode: "À la retraite (65 ans)",
      revenu: 0,
      avs: avsValue,
      lpp: lppValue,
      pilier3: pilier3Value,
      lacune: lacune,
    }
  ];

  // Données pour les graphiques de prévoyance (montants capitaux)
  const dataRetraite = [
    { name: "1er Pilier (AVS)", montant: avsRenteRetraite },
    { name: "2ème Pilier (LPP)", montant: parseFloat(lppAvoirVieillesse || "0") },
    { name: "3ème Pilier", montant: pilier3TotalCapital },
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
                {/* Vue d'ensemble */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vue d'ensemble de la Prévoyance</CardTitle>
                    <CardDescription>Vos besoins et votre couverture retraite</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Revenu brut actuel</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(parseFloat(revenuBrut) || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{periodType}</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Besoin retraite ({besoinPourcentage}%)</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency((parseFloat(revenuBrut) || 0) * (parseFloat(besoinPourcentage) || 0) / 100)}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={besoinPourcentage}
                            onChange={(e) => setBesoinPourcentage(e.target.value.replace(/^0+(?=\d)/, ''))}
                            className="w-16 h-7 text-xs"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Prévoyance</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrevoyance)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 1er Pilier AVS */}
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="text-left">
                          <CardTitle className="flex items-center gap-2">
                            💰 1er Pilier - AVS
                            <span className="text-lg font-normal text-muted-foreground">
                              {parseFloat(avsRenteAnnuelle) > 0 && `${formatCurrency(parseFloat(avsRenteAnnuelle))} / an`}
                            </span>
                          </CardTitle>
                          <CardDescription>Assurance Vieillesse et Survivants</CardDescription>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="avsRevenuDeterminant">Revenu annuel déterminant (CHF)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="avsRevenuDeterminant"
                              type="number"
                              step="1"
                              placeholder="96000"
                              value={avsRevenuDeterminant}
                              onChange={(e) => setAvsRevenuDeterminant(e.target.value.replace(/^0+(?=\d)/, ''))}
                            />
                            <Button 
                              onClick={handleCalculateAVS} 
                              disabled={isCalculatingAVS}
                              variant="outline"
                              className="gap-2"
                            >
                              <Calculator className="h-4 w-4" />
                              Calculer
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Selon l'Echelle 44 2025</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <Label className="text-xs text-muted-foreground">Rente vieillesse mensuelle</Label>
                            <Input
                              type="number"
                              value={avsRenteMensuelle}
                              onChange={(e) => setAvsRenteMensuelle(e.target.value.replace(/^0+(?=\d)/, ''))}
                              placeholder="2390"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Rente vieillesse annuelle</Label>
                            <Input
                              type="number"
                              value={avsRenteAnnuelle}
                              onChange={(e) => setAvsRenteAnnuelle(e.target.value.replace(/^0+(?=\d)/, ''))}
                              placeholder="28680"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Rente invalidité mensuelle</Label>
                            <Input
                              type="number"
                              value={avsInvaliditeMensuelle}
                              onChange={(e) => setAvsInvaliditeMensuelle(e.target.value.replace(/^0+(?=\d)/, ''))}
                              placeholder="2390"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Rente invalidité annuelle</Label>
                            <Input
                              type="number"
                              value={avsInvaliditeAnnuelle}
                              onChange={(e) => setAvsInvaliditeAnnuelle(e.target.value.replace(/^0+(?=\d)/, ''))}
                              placeholder="28680"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* 2ème Pilier LPP */}
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="text-left">
                          <CardTitle className="flex items-center gap-2">
                            🏦 2ème Pilier - LPP
                            <span className="text-lg font-normal text-muted-foreground">
                              {parseFloat(lppAvoirVieillesse) > 0 && `${formatCurrency(parseFloat(lppAvoirVieillesse))}`}
                            </span>
                          </CardTitle>
                          <CardDescription>Prévoyance Professionnelle</CardDescription>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <Tabs defaultValue="avoir" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="avoir">Avoir actuel</TabsTrigger>
                            <TabsTrigger value="vieillesse">Vieillesse</TabsTrigger>
                            <TabsTrigger value="invalidite">Invalidité</TabsTrigger>
                            <TabsTrigger value="deces">Décès</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="avoir" className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="lppAvoirVieillesse">Avoir de vieillesse (CHF)</Label>
                              <Input
                                id="lppAvoirVieillesse"
                                type="number"
                                value={lppAvoirVieillesse}
                                onChange={(e) => setLppAvoirVieillesse(e.target.value.replace(/^0+(?=\d)/, ''))}
                                placeholder="350000"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lppDerniereMaj">Dernière mise à jour</Label>
                              <Input
                                id="lppDerniereMaj"
                                type="date"
                                value={lppDerniereMaj}
                                onChange={(e) => setLppDerniereMaj(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <Button onClick={handleImportLppData} variant="outline" className="w-full gap-2">
                              📄 Importer depuis certificat LPP
                            </Button>
                          </TabsContent>

                          <TabsContent value="vieillesse" className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="lppCapitalProjete65">Capital projeté à 65 ans (CHF)</Label>
                              <Input
                                id="lppCapitalProjete65"
                                type="number"
                                value={lppCapitalProjete65}
                                onChange={(e) => setLppCapitalProjete65(e.target.value.replace(/^0+(?=\d)/, ''))}
                                placeholder="580000"
                                className="mt-1"
                              />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="lppRenteMensuelleProjetee">Rente mensuelle projetée (CHF)</Label>
                                <Input
                                  id="lppRenteMensuelleProjetee"
                                  type="number"
                                  value={lppRenteMensuelleProjetee}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                                    setLppRenteMensuelleProjetee(val);
                                    setLppRenteAnnuelleProjetee(val ? (parseFloat(val) * 12).toString() : '');
                                  }}
                                  placeholder="3250"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="lppRenteAnnuelleProjetee">Rente annuelle projetée (CHF)</Label>
                                <Input
                                  id="lppRenteAnnuelleProjetee"
                                  type="number"
                                  value={lppRenteAnnuelleProjetee}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                                    setLppRenteAnnuelleProjetee(val);
                                    setLppRenteMensuelleProjetee(val ? (parseFloat(val) / 12).toFixed(0) : '');
                                  }}
                                  placeholder="39000"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="invalidite" className="space-y-4 mt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="lppRenteInvaliditeMensuelle">Rente invalidité mensuelle (CHF)</Label>
                                <Input
                                  id="lppRenteInvaliditeMensuelle"
                                  type="number"
                                  value={lppRenteInvaliditeMensuelle}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                                    setLppRenteInvaliditeMensuelle(val);
                                    setLppRenteInvaliditeAnnuelle(val ? (parseFloat(val) * 12).toString() : '');
                                  }}
                                  placeholder="2800"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="lppRenteInvaliditeAnnuelle">Rente invalidité annuelle (CHF)</Label>
                                <Input
                                  id="lppRenteInvaliditeAnnuelle"
                                  type="number"
                                  value={lppRenteInvaliditeAnnuelle}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                                    setLppRenteInvaliditeAnnuelle(val);
                                    setLppRenteInvaliditeMensuelle(val ? (parseFloat(val) / 12).toFixed(0) : '');
                                  }}
                                  placeholder="33600"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="lppCapitalInvalidite">Capital invalidité (CHF)</Label>
                              <Input
                                id="lppCapitalInvalidite"
                                type="number"
                                value={lppCapitalInvalidite}
                                onChange={(e) => setLppCapitalInvalidite(e.target.value.replace(/^0+(?=\d)/, ''))}
                                placeholder="180000"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lppRenteEnfantInvalide">Rente d'enfant d'invalide (CHF/mois)</Label>
                              <Input
                                id="lppRenteEnfantInvalide"
                                type="number"
                                value={lppRenteEnfantInvalide}
                                onChange={(e) => setLppRenteEnfantInvalide(e.target.value.replace(/^0+(?=\d)/, ''))}
                                placeholder="700"
                                className="mt-1"
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="deces" className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="lppRenteConjointSurvivant">Rente conjoint survivant (CHF/mois)</Label>
                              <Input
                                id="lppRenteConjointSurvivant"
                                type="number"
                                value={lppRenteConjointSurvivant}
                                onChange={(e) => setLppRenteConjointSurvivant(e.target.value.replace(/^0+(?=\d)/, ''))}
                                placeholder="2100"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lppRenteOrphelins">Rente orphelins (CHF/mois)</Label>
                              <Input
                                id="lppRenteOrphelins"
                                type="number"
                                value={lppRenteOrphelins}
                                onChange={(e) => setLppRenteOrphelins(e.target.value.replace(/^0+(?=\d)/, ''))}
                                placeholder="700"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lppCapitalDeces">Capital décès (CHF)</Label>
                              <Input
                                id="lppCapitalDeces"
                                type="number"
                                value={lppCapitalDeces}
                                onChange={(e) => setLppCapitalDeces(e.target.value.replace(/^0+(?=\d)/, ''))}
                                placeholder="100000"
                                className="mt-1"
                              />
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* 3ème Pilier */}
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="text-left">
                          <CardTitle className="flex items-center gap-2">
                            🎯 3ème Pilier - Prévoyance Individuelle
                            <span className="text-lg font-normal text-muted-foreground">
                              {(parseFloat(pilier3a) + parseFloat(pilier3b)) > 0 && 
                                `${formatCurrency((parseFloat(pilier3a) || 0) + (parseFloat(pilier3b) || 0))}`
                              }
                            </span>
                          </CardTitle>
                          <CardDescription>Prévoyance liée et libre</CardDescription>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="pilier3a">Pilier 3a - Prévoyance liée (CHF)</Label>
                          <Input
                            id="pilier3a"
                            type="number"
                            value={pilier3a}
                            onChange={(e) => setPilier3a(e.target.value.replace(/^0+(?=\d)/, ''))}
                            placeholder="50000"
                            className="mt-1"
                          />
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-900 dark:text-blue-100">
                            💡 Limite de cotisation 2025: CHF 7'056 (employé) / CHF 35'280 (indépendant)
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="pilier3b">Pilier 3b - Prévoyance libre (CHF)</Label>
                          <Input
                            id="pilier3b"
                            type="number"
                            value={pilier3b}
                            onChange={(e) => setPilier3b(e.target.value.replace(/^0+(?=\d)/, ''))}
                            placeholder="25000"
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {user && (
                  <div className="flex justify-center">
                    <Button 
                      onClick={saveAllData} 
                      disabled={isLoading}
                      className="gap-2"
                      size="lg"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer toutes les données
                    </Button>
                  </div>
                )}

                {/* Graphique Projection Retraite 65-85 ans */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>Revenus à la Retraite (65-85 ans)</CardTitle>
                        <CardDescription>Projection des revenus de prévoyance sur 20 ans</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={graphDisplayMode === "mensuel" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGraphDisplayMode("mensuel")}
                        >
                          Mensuel
                        </Button>
                        <Button
                          variant={graphDisplayMode === "annuel" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGraphDisplayMode("annuel")}
                        >
                          Annuel
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Badge d'alerte si lacune existe */}
            {totalRetraite < besoinValue && (
              <div className="mb-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Attention : Lacune de prévoyance détectée</span>
                </div>
                <p className="text-sm text-destructive/90 mt-2">
                  Vos revenus de retraite projetés ne couvrent pas vos besoins ({besoinPourcentage}% du revenu actuel). 
                  Perte estimée: CHF {Math.round(lacune).toLocaleString('fr-CH')} {graphDisplayMode === "mensuel" ? "par mois" : "par an"}.
                </p>
              </div>
            )}
                    
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={dataComparaison}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `${value.toLocaleString('fr-CH')}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="periode"
                    width={140}
                  />
                  <Tooltip 
                    formatter={(value: number) => `CHF ${value.toLocaleString('fr-CH')}`}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  
                  <Bar 
                    dataKey="revenu" 
                    stackId="a" 
                    fill="hsl(200 70% 50%)" 
                    name="Revenu actuel"
                  />
                  <Bar 
                    dataKey="avs" 
                    stackId="a" 
                    fill="hsl(142 76% 36%)" 
                    name="1er Pilier AVS"
                  />
                  <Bar 
                    dataKey="lpp" 
                    stackId="a" 
                    fill="hsl(221 83% 53%)" 
                    name="2ème Pilier LPP"
                  />
                  <Bar 
                    dataKey="pilier3" 
                    stackId="a" 
                    fill="hsl(262 83% 58%)" 
                    name="3ème Pilier"
                  />
                  <Bar 
                    dataKey="lacune" 
                    stackId="a" 
                    fill="hsl(0 84% 60%)" 
                    name="Perte / Lacune"
                    opacity={0.7}
                  />
                  <ReferenceLine 
                    x={besoinValue} 
                    stroke="hsl(0 84% 60%)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Besoin (${besoinPourcentage}%)`, 
                      position: 'top',
                      fill: 'hsl(0 84% 60%)',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
                    
                    {/* Légende avec montants */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(200, 70%, 50%)' }} />
                          <span className="text-sm font-medium">Revenu actuel</span>
                        </div>
                        <span className="text-lg font-bold">
                          CHF {Math.round(revenuActuel).toLocaleString('fr-CH')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {graphDisplayMode === "mensuel" ? "par mois" : "par an"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
                          <span className="text-sm font-medium">1er Pilier AVS</span>
                        </div>
                        <span className="text-lg font-bold">
                          CHF {Math.round(avsValue).toLocaleString('fr-CH')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {graphDisplayMode === "mensuel" ? "par mois" : "par an"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(221, 83%, 53%)' }} />
                          <span className="text-sm font-medium">2ème Pilier LPP</span>
                        </div>
                        <span className="text-lg font-bold">
                          CHF {Math.round(lppValue).toLocaleString('fr-CH')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {graphDisplayMode === "mensuel" ? "par mois" : "par an"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(262, 83%, 58%)' }} />
                          <span className="text-sm font-medium">3ème Pilier (÷20)</span>
                        </div>
                        <span className="text-lg font-bold">
                          CHF {Math.round(pilier3Value).toLocaleString('fr-CH')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {graphDisplayMode === "mensuel" ? "par mois" : "par an"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
                          <span className="text-sm font-medium">Perte / Lacune</span>
                        </div>
                        <span className="text-lg font-bold text-destructive">
                          CHF {Math.round(lacune).toLocaleString('fr-CH')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {graphDisplayMode === "mensuel" ? "par mois" : "par an"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-muted-foreground">Besoin à la retraite ({besoinPourcentage}% du revenu)</span>
                          <span className="text-2xl font-bold text-primary">
                            CHF {Math.round(besoinValue).toLocaleString('fr-CH')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {graphDisplayMode === "mensuel" ? "par mois" : "par an"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-muted-foreground">Total revenus retraite</span>
                          <span className="text-2xl font-bold text-primary">
                            CHF {Math.round(totalRetraite).toLocaleString('fr-CH')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {graphDisplayMode === "mensuel" ? "par mois" : "par an"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      * Comparaison entre le revenu actuel et les revenus projetés à la retraite (65 ans). 
                      Le 3ème pilier est divisé par 20 ans pour calculer le revenu annuel disponible.
                    </p>
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
