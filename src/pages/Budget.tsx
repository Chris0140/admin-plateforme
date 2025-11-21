import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, LabelList, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, Calculator, AlertTriangle, Plus } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { calculateAllAVSPensions, formatCHF } from "@/lib/avsCalculations";
import FixedExpenseCard from "@/components/budget/FixedExpenseCard";
import FixedExpenseForm from "@/components/budget/FixedExpenseForm";

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
  const [avsYearsContributed, setAvsYearsContributed] = useState(44);
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
  
  // Date de naissance pour calculer l'âge
  const [dateNaissance, setDateNaissance] = useState<string>("");
  
  // Configuration prévoyance - nouveaux états
  const [prenom, setPrenom] = useState("");
  const [etatCivil, setEtatCivil] = useState("");
  const [nombreEnfants, setNombreEnfants] = useState("");

  // Collapsible states for mobile
  const [revenusOpen, setRevenusOpen] = useState(true);
  const [depensesOpen, setDepensesOpen] = useState(true);

  // Fixed expenses state
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Charger les données depuis Supabase
  useEffect(() => {
    if (user) {
      fetchBudgetData();
      fetchFixedExpenses();
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prevoyance_data',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Changement détecté dans prevoyance_data:', payload);
          // Mettre à jour les états locaux depuis prevoyance_data
          if (payload.new) {
            setEtatCivil(payload.new.etat_civil || "");
            setNombreEnfants(payload.new.nombre_enfants?.toString() || "0");
            setBesoinPourcentage(payload.new.besoin_pourcentage?.toString() || "80");
          }
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

      // Charger le profil pour obtenir la date de naissance et le prénom
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("date_naissance, prenom")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setDateNaissance(profileData.date_naissance || "");
        setPrenom(profileData.prenom || "");
      }

      if (prevoyanceData) {
        // Charger les données de configuration
        setBesoinPourcentage(prevoyanceData.besoin_pourcentage?.toString() || "80");
        setEtatCivil(prevoyanceData.etat_civil || "");
        setNombreEnfants(prevoyanceData.nombre_enfants?.toString() || "0");
        
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

  const fetchFixedExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("fixed_expenses")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFixedExpenses(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des dépenses fixes:", error);
    }
  };

  const handleSubmitExpense = async (data: any) => {
    if (!user) return;

    setIsSubmittingExpense(true);
    try {
      if (editingExpense?.id) {
        const { error } = await supabase
          .from("fixed_expenses")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingExpense.id);

        if (error) throw error;

        toast({
          title: "Dépense mise à jour",
          description: "La dépense a été modifiée avec succès",
        });
      } else {
        const { error } = await supabase
          .from("fixed_expenses")
          .insert({
            user_id: user.id,
            ...data,
          });

        if (error) throw error;

        toast({
          title: "Dépense ajoutée",
          description: "La dépense fixe a été créée avec succès",
        });
      }

      setShowExpenseForm(false);
      setEditingExpense(null);
      fetchFixedExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la dépense",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fixed_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Dépense supprimée",
        description: "La dépense a été supprimée avec succès",
      });

      fetchFixedExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense",
        variant: "destructive",
      });
    }
  };

  const handleAddNewExpense = () => {
    setEditingExpense({});
    setShowExpenseForm(true);
  };

  const handleCancelExpense = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
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

  const savePrevoyanceConfig = async () => {
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
      console.log('Sauvegarde prévoyance - état civil:', etatCivil, 'nombre enfants:', nombreEnfants);
      
      // Sauvegarder le revenu brut dans budget_data
      const revenuBrutNum = parseFloat(revenuBrut) || 0;
      const revenu_brut_mensuel = periodType === "mensuel" ? revenuBrutNum : Math.round(revenuBrutNum / 12);
      const revenu_brut_annuel = periodType === "annuel" ? revenuBrutNum : revenuBrutNum * 12;

      // Vérifier si budget_data existe
      const { data: existingBudget } = await supabase
        .from("budget_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingBudget) {
        await supabase
          .from("budget_data")
          .update({
            revenu_brut: revenuBrutNum,
            revenu_brut_mensuel,
            revenu_brut_annuel,
            period_type: periodType,
          })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("budget_data")
          .insert({
            user_id: user.id,
            revenu_brut: revenuBrutNum,
            revenu_brut_mensuel,
            revenu_brut_annuel,
            period_type: periodType,
          });
      }

      // Vérifier si prevoyance_data existe
      const { data: existingPrevoyance } = await supabase
        .from("prevoyance_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingPrevoyance) {
        const { error: prevoyanceError } = await supabase
          .from("prevoyance_data")
          .update({
            besoin_pourcentage: parseFloat(besoinPourcentage) || 80,
            revenu_brut_reference: revenuBrutNum,
            etat_civil: etatCivil || null,
            nombre_enfants: parseInt(nombreEnfants) || 0,
          })
          .eq("user_id", user.id);

        if (prevoyanceError) {
          console.error('Erreur prevoyance_data update:', prevoyanceError);
          throw prevoyanceError;
        }
        console.log('Prevoyance_data mis à jour');
      } else {
        const { error: prevoyanceError } = await supabase
          .from("prevoyance_data")
          .insert({
            user_id: user.id,
            besoin_pourcentage: parseFloat(besoinPourcentage) || 80,
            revenu_brut_reference: revenuBrutNum,
            etat_civil: etatCivil || null,
            nombre_enfants: parseInt(nombreEnfants) || 0,
            avs_1er_pilier: 0,
            lpp_2eme_pilier: 0,
            pilier_3a: 0,
            pilier_3b: 0,
          });

        if (prevoyanceError) {
          console.error('Erreur prevoyance_data insert:', prevoyanceError);
          throw prevoyanceError;
        }
        console.log('Prevoyance_data inséré');
      }

      // Synchroniser avec profiles (informations personnelles)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          etat_civil: etatCivil || null,
          nombre_enfants: parseInt(nombreEnfants) || 0,
        })
        .eq("user_id", user.id);

      if (profileError) {
        console.error('Erreur profiles update:', profileError);
        throw profileError;
      }
      console.log('Profiles mis à jour avec état civil et nombre enfants');

      // Mettre à jour tax_data si un enregistrement existe
      const { data: existingTaxData } = await supabase
        .from("tax_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingTaxData) {
        const { error: taxError } = await supabase
          .from("tax_data")
          .update({
            etat_civil: etatCivil || "",
            nombre_enfants: parseInt(nombreEnfants) || 0,
          })
          .eq("user_id", user.id);
        
        if (taxError) {
          console.error('Erreur tax_data:', taxError);
        } else {
          console.log('Tax_data mis à jour');
        }
      }

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres de prévoyance ont été mis à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder vos paramètres",
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
      const avsData = await calculateAllAVSPensions(revenuDeterminant, parseInt(nombreEnfants) || 0);
      
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
          
          <div className="w-full">
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

                {/* Dépenses fixes section */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Dépenses fixes</CardTitle>
                        <CardDescription>Gérez vos dépenses récurrentes par catégorie</CardDescription>
                      </div>
                      {!showExpenseForm && (
                        <Button onClick={handleAddNewExpense} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Ajouter une dépense
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showExpenseForm ? (
                      <FixedExpenseForm
                        expense={editingExpense}
                        onSubmit={handleSubmitExpense}
                        onCancel={handleCancelExpense}
                        isSubmitting={isSubmittingExpense}
                      />
                    ) : fixedExpenses.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          Aucune dépense fixe enregistrée
                        </p>
                        <Button onClick={handleAddNewExpense} variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Ajouter votre première dépense
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          {fixedExpenses.map((expense) => (
                            <FixedExpenseCard
                              key={expense.id}
                              expense={expense}
                              onEdit={handleEditExpense}
                              onDelete={handleDeleteExpense}
                            />
                          ))}
                        </div>
                        {fixedExpenses.length > 0 && (
                          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Total mensuel</p>
                                <p className="text-2xl font-bold text-primary">
                                  {formatCurrency(
                                    fixedExpenses.reduce((sum, exp) => 
                                      sum + (exp.frequency === 'mensuel' ? exp.amount : exp.amount / 12), 0
                                    )
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Total annuel</p>
                                <p className="text-2xl font-bold text-primary">
                                  {formatCurrency(
                                    fixedExpenses.reduce((sum, exp) => 
                                      sum + (exp.frequency === 'annuel' ? exp.amount : exp.amount * 12), 0
                                    )
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Budget;
