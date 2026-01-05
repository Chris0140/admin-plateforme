import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calculator, TrendingDown, Info, FileText, Save, ChevronDown, MapPin } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { calculateVaudIncomeTax, calculateVaudWealthTax } from "@/lib/vaudTaxCalculations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const formSchema = z.object({
  canton: z.string().min(1, "Veuillez sélectionner un canton"),
  commune: z.string().min(1, "Veuillez sélectionner une commune"),
  etatCivil: z.string().min(1, "Veuillez sélectionner votre état civil"),
  confession: z.string().optional(),
  revenuAnnuel: z.string().min(1, "Veuillez indiquer votre revenu"),
  fortune: z.string().optional(),
  nombreEnfants: z.string().optional(),
  deduction3emePilier: z.string().optional(),
  interetsHypothecaires: z.string().optional(),
  autresDeductions: z.string().optional(),
  chargesSociales: z.string().optional()
});

// Taux d'impôt ecclésiastique par canton
const tauxEcclesiastiqueParCanton: Record<string, Record<string, number>> = {
  ZH: { catholique: 0.10, protestant: 0.10, "catholique-chretien": 0.10 },
  BE: { catholique: 0.12, protestant: 0.12, "catholique-chretien": 0.12 },
  VD: { catholique: 0.08, protestant: 0.08 },
  GE: { catholique: 0.07, protestant: 0.07 },
  VS: { catholique: 0.09, protestant: 0.09 },
  FR: { catholique: 0.11, protestant: 0.11, "catholique-chretien": 0.11 },
  NE: { catholique: 0.10, protestant: 0.10, "catholique-chretien": 0.10 },
  JU: { catholique: 0.12, protestant: 0.12 },
  TI: { catholique: 0.08, protestant: 0.08 },
  GR: { catholique: 0.09, protestant: 0.09, "catholique-chretien": 0.09 }
};

// Cantons avec coefficients et méthode de calcul
const cantons = [
  { value: "GE", label: "Genève", tauxCantonal: 1.00, methode: "geneve" },
  { value: "VD", label: "Vaud", tauxCantonal: 1.55, methode: "vaud" },
  { value: "VS", label: "Valais", tauxCantonal: 1.00, methode: "standard" },
  { value: "FR", label: "Fribourg", tauxCantonal: 1.00, methode: "standard" },
  { value: "NE", label: "Neuchâtel", tauxCantonal: 1.20, methode: "standard" },
  { value: "JU", label: "Jura", tauxCantonal: 2.85, methode: "highcoeff" },
  { value: "BE", label: "Berne", tauxCantonal: 3.06, methode: "highcoeff" }
];

// Barèmes progressifs simplifiés
const taxScales: Record<string, Array<{ limit: number; rate: number; base: number }>> = {
  Standard_Single: [
    { limit: 15000, rate: 0, base: 0 },
    { limit: 25000, rate: 0.03, base: 0 },
    { limit: 40000, rate: 0.05, base: 300 },
    { limit: 70000, rate: 0.07, base: 1050 },
    { limit: 100000, rate: 0.09, base: 3150 },
    { limit: 200000, rate: 0.11, base: 5850 },
    { limit: 9999999, rate: 0.13, base: 16850 }
  ],
  HighCoeff_Single: [
    { limit: 10000, rate: 0, base: 0 },
    { limit: 30000, rate: 0.025, base: 0 },
    { limit: 60000, rate: 0.045, base: 500 },
    { limit: 100000, rate: 0.065, base: 1850 },
    { limit: 9999999, rate: 0.085, base: 4450 }
  ]
};

// Communes par canton avec coefficients multiplicateurs
const communesParCanton: Record<string, Array<{ value: string; label: string; coefficientCommunal: number }>> = {
  ZH: [
    { value: "zurich", label: "Zürich", coefficientCommunal: 1.19 },
    { value: "winterthur", label: "Winterthur", coefficientCommunal: 1.22 },
    { value: "uster", label: "Uster", coefficientCommunal: 1.09 },
    { value: "dubendorf", label: "Dübendorf", coefficientCommunal: 1.07 },
    { value: "dietikon", label: "Dietikon", coefficientCommunal: 1.15 }
  ],
  BE: [
    { value: "berne", label: "Berne", coefficientCommunal: 1.54 },
    { value: "biel", label: "Bienne", coefficientCommunal: 1.69 },
    { value: "thun", label: "Thoune", coefficientCommunal: 1.52 },
    { value: "koniz", label: "Köniz", coefficientCommunal: 1.50 },
    { value: "burgdorf", label: "Berthoud", coefficientCommunal: 1.58 },
    { value: "moutier", label: "Moutier", coefficientCommunal: 1.74 }
  ],
  VD: [
    { value: "aigle", label: "Aigle", coefficientCommunal: 0.66 },
    { value: "lausanne", label: "Lausanne", coefficientCommunal: 0.78 },
    { value: "yverdon-les-bains", label: "Yverdon-les-Bains", coefficientCommunal: 0.77 },
    { value: "montreux", label: "Montreux", coefficientCommunal: 0.66 },
    { value: "vevey", label: "Vevey", coefficientCommunal: 0.73 },
    { value: "nyon", label: "Nyon", coefficientCommunal: 0.61 },
    { value: "renens", label: "Renens", coefficientCommunal: 0.79 },
    { value: "pully", label: "Pully", coefficientCommunal: 0.67 },
    { value: "morges", label: "Morges", coefficientCommunal: 0.64 },
    { value: "prilly", label: "Prilly", coefficientCommunal: 0.77 },
    { value: "ecublens", label: "Ecublens", coefficientCommunal: 0.75 },
    { value: "gland", label: "Gland", coefficientCommunal: 0.64 },
    { value: "payerne", label: "Payerne", coefficientCommunal: 0.70 },
    { value: "lutry", label: "Lutry", coefficientCommunal: 0.72 },
    { value: "epalinges", label: "Epalinges", coefficientCommunal: 0.71 },
    { value: "rolle", label: "Rolle", coefficientCommunal: 0.69 },
    { value: "crissier", label: "Crissier", coefficientCommunal: 0.73 },
    { value: "bex", label: "Bex", coefficientCommunal: 0.71 },
    { value: "la-tour-de-peilz", label: "La Tour-de-Peilz", coefficientCommunal: 0.71 },
    { value: "cossonay", label: "Cossonay", coefficientCommunal: 0.76 }
  ],
  GE: [
    { value: "geneve", label: "Genève", coefficientCommunal: 0.455 },
    { value: "vernier", label: "Vernier", coefficientCommunal: 0.46 },
    { value: "lancy", label: "Lancy", coefficientCommunal: 0.45 },
    { value: "meyrin", label: "Meyrin", coefficientCommunal: 0.43 },
    { value: "carouge", label: "Carouge", coefficientCommunal: 0.455 },
    { value: "thonex", label: "Thônex", coefficientCommunal: 0.44 },
    { value: "versoix", label: "Versoix", coefficientCommunal: 0.41 },
    { value: "onex", label: "Onex", coefficientCommunal: 0.46 },
    { value: "chene-bougeries", label: "Chêne-Bougeries", coefficientCommunal: 0.39 },
    { value: "plan-les-ouates", label: "Plan-les-Ouates", coefficientCommunal: 0.42 },
    { value: "grand-saconnex", label: "Le Grand-Saconnex", coefficientCommunal: 0.42 },
    { value: "bernex", label: "Bernex", coefficientCommunal: 0.45 },
    { value: "chene-bourg", label: "Chêne-Bourg", coefficientCommunal: 0.44 },
    { value: "aniere", label: "Anières", coefficientCommunal: 0.37 },
    { value: "confignon", label: "Confignon", coefficientCommunal: 0.43 },
    { value: "pregny-chambesy", label: "Pregny-Chambésy", coefficientCommunal: 0.36 },
    { value: "bellevue", label: "Bellevue", coefficientCommunal: 0.38 },
    { value: "cologny", label: "Cologny", coefficientCommunal: 0.35 },
    { value: "veyrier", label: "Veyrier", coefficientCommunal: 0.42 },
    { value: "collonge-bellerive", label: "Collonge-Bellerive", coefficientCommunal: 0.38 },
    { value: "perly-certoux", label: "Perly-Certoux", coefficientCommunal: 0.43 },
    { value: "satigny", label: "Satigny", coefficientCommunal: 0.43 },
    { value: "vandoeuvres", label: "Vandœuvres", coefficientCommunal: 0.36 }
  ],
  VS: [
    { value: "sion", label: "Sion", coefficientCommunal: 1.10 },
    { value: "sierre", label: "Sierre", coefficientCommunal: 1.25 },
    { value: "martigny", label: "Martigny", coefficientCommunal: 1.10 },
    { value: "monthey", label: "Monthey", coefficientCommunal: 1.10 },
    { value: "brig", label: "Brigue-Glis", coefficientCommunal: 1.15 },
    { value: "naters", label: "Naters", coefficientCommunal: 1.18 },
    { value: "visp", label: "Viège", coefficientCommunal: 1.17 },
    { value: "conthey", label: "Conthey", coefficientCommunal: 1.23 },
    { value: "bagnes", label: "Bagnes", coefficientCommunal: 1.10 },
    { value: "crans-montana", label: "Crans-Montana", coefficientCommunal: 1.12 },
    { value: "fully", label: "Fully", coefficientCommunal: 1.22 }
  ],
  FR: [
    { value: "fribourg", label: "Fribourg", coefficientCommunal: 0.80 },
    { value: "bulle", label: "Bulle", coefficientCommunal: 0.78 },
    { value: "villars", label: "Villars-sur-Glâne", coefficientCommunal: 0.75 },
    { value: "marly", label: "Marly", coefficientCommunal: 1.10 },
    { value: "givisiez", label: "Givisiez", coefficientCommunal: 1.09 },
    { value: "granges-paccot", label: "Granges-Paccot", coefficientCommunal: 1.11 },
    { value: "estavayer-le-lac", label: "Estavayer-le-Lac", coefficientCommunal: 1.14 },
    { value: "murten", label: "Morat", coefficientCommunal: 1.13 },
    { value: "romont", label: "Romont", coefficientCommunal: 1.16 }
  ],
  NE: [
    { value: "neuchatel", label: "Neuchâtel", coefficientCommunal: 0.59 },
    { value: "chaux", label: "La Chaux-de-Fonds", coefficientCommunal: 0.62 },
    { value: "locle", label: "Le Locle", coefficientCommunal: 0.65 },
    { value: "val", label: "Val-de-Ruz", coefficientCommunal: 0.69 },
    { value: "boudry", label: "Boudry", coefficientCommunal: 0.71 },
    { value: "marin-epagnier", label: "Marin-Epagnier", coefficientCommunal: 0.68 },
    { value: "peseux", label: "Peseux", coefficientCommunal: 0.70 }
  ],
  JU: [
    { value: "delemont", label: "Delémont", coefficientCommunal: 1.90 },
    { value: "porrentruy", label: "Porrentruy", coefficientCommunal: 1.95 },
    { value: "courrendlin", label: "Courrendlin", coefficientCommunal: 1.70 },
    { value: "courfaivre", label: "Courfaivre", coefficientCommunal: 1.72 },
    { value: "alle", label: "Alle", coefficientCommunal: 1.73 }
  ],
  TI: [
    { value: "lugano", label: "Lugano", coefficientCommunal: 0.90 },
    { value: "bellinzona", label: "Bellinzone", coefficientCommunal: 0.95 },
    { value: "locarno", label: "Locarno", coefficientCommunal: 0.92 },
    { value: "mendrisio", label: "Mendrisio", coefficientCommunal: 0.88 },
    { value: "chiasso", label: "Chiasso", coefficientCommunal: 0.91 }
  ],
  GR: [
    { value: "chur", label: "Coire", coefficientCommunal: 1.05 },
    { value: "davos", label: "Davos", coefficientCommunal: 0.95 },
    { value: "stmoritz", label: "Saint-Moritz", coefficientCommunal: 0.80 },
    { value: "arosa", label: "Arosa", coefficientCommunal: 0.90 }
  ]
};

// Fonction d'interpolation pour barèmes
const getBaseTax = (income: number, scale: Array<{ limit: number; rate: number; base: number }>) => {
  for (let i = 0; i < scale.length; i++) {
    const bracket = scale[i];
    const prevLimit = i === 0 ? 0 : scale[i - 1].limit;
    
    if (income <= bracket.limit) {
      return bracket.base + (income - prevLimit) * bracket.rate;
    }
  }
  const last = scale[scale.length - 1];
  const prevLimit = scale[scale.length - 2].limit;
  return last.base + (income - prevLimit) * last.rate;
};

// Calcul Vaud avec Quotient Familial
const calculateVaudPrecise = (revenuImposable: number, fortuneImposable: number, etatCivil: string, enfants: number, coeffCommune: number) => {
  let qf = etatCivil === "marie" ? 1.8 : 1.0;
  if (etatCivil === "parent" && enfants > 0) qf = 1.3;
  qf += enfants * 0.5;

  const revenuDet = Math.floor((revenuImposable / qf) / 100) * 100;
  
  const impotRevenuBase = calculateVaudIncomeTax(revenuDet);
  const impotBaseRevenu = impotRevenuBase * qf;
  const impotBaseFortune = calculateVaudWealthTax(fortuneImposable);
  
  const impotBaseTotal = impotBaseRevenu + impotBaseFortune;

  return {
    cantonal: impotBaseTotal * 1.55,
    communal: impotBaseTotal * coeffCommune
  };
};

// Calcul Romandie Standard (VS, FR, NE)
const calculateRomandieStandard = (canton: string, revenu: number, fortune: number, etatCivil: string, enfants: number, coeffCanton: number, coeffCommune: number) => {
  let deductionEnfant = 6000;
  if (canton === "FR") deductionEnfant = 9000;
  if (canton === "VS") deductionEnfant = 7500;
  
  const revenuNet = Math.max(0, revenu - (enfants * deductionEnfant));

  let scale = taxScales.Standard_Single;
  if (canton === "BE" || canton === "JU") scale = taxScales.HighCoeff_Single;

  let impotSimple = getBaseTax(revenuNet, scale);

  if (etatCivil === "marie" || etatCivil === "parent") {
    impotSimple = impotSimple * 0.7;
  }

  const impotFortuneSimple = Math.max(0, fortune - 50000) * 0.0015;
  const totalSimple = impotSimple + impotFortuneSimple;

  return {
    cantonal: totalSimple * coeffCanton,
    communal: totalSimple * coeffCommune
  };
};

const SimulateurImpots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [revenusOpen, setRevenusOpen] = useState(true);
  const [deductionsOpen, setDeductionsOpen] = useState(true);
  const [communesDisponibles, setCommunesDisponibles] = useState<Array<{ value: string; label: string; coefficientCommunal: number }>>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      canton: "",
      commune: "",
      etatCivil: "",
      confession: "aucune",
      revenuAnnuel: "",
      fortune: "0",
      nombreEnfants: "0",
      deduction3emePilier: "0",
      interetsHypothecaires: "0",
      autresDeductions: "0",
      chargesSociales: "0"
    }
  });

  const selectedCanton = form.watch("canton");

  // Charger les données existantes
  useEffect(() => {
    const loadTaxData = async () => {
      if (!user) return;

      try {
        const { data: taxData, error: taxError } = await supabase
          .from("tax_data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (taxError) throw taxError;

        const { data: budgetData, error: budgetError } = await supabase
          .from("budget_data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (budgetError) throw budgetError;

        if (taxData) {
          const formValues = {
            canton: taxData.canton,
            commune: taxData.commune,
            etatCivil: taxData.etat_civil,
            confession: taxData.confession || "aucune",
            revenuAnnuel: taxData.revenu_annuel.toString(),
            fortune: (taxData.fortune || 0).toString(),
            nombreEnfants: (taxData.nombre_enfants || 0).toString(),
            deduction3emePilier: (taxData.deduction_3eme_pilier || 0).toString(),
            interetsHypothecaires: (taxData.interets_hypothecaires || 0).toString(),
            autresDeductions: (taxData.autres_deductions || 0).toString(),
            chargesSociales: (taxData.charges_sociales || 0).toString(),
          };
          
          form.reset(formValues);

          if (communesParCanton[taxData.canton]) {
            setCommunesDisponibles(communesParCanton[taxData.canton]);
          }

          setTimeout(() => {
            calculateTax(formValues);
          }, 100);
        } else if (budgetData) {
          const revenuAnnuel = budgetData.revenu_brut_annuel || 0;
          const chargesSociales = budgetData.charges_sociales_annuel || 0;

          form.reset({
            canton: "",
            commune: "",
            etatCivil: "",
            confession: "aucune",
            revenuAnnuel: revenuAnnuel.toString(),
            fortune: "0",
            nombreEnfants: "0",
            deduction3emePilier: "0",
            interetsHypothecaires: "0",
            autresDeductions: "0",
            chargesSociales: chargesSociales.toString(),
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    loadTaxData();
  }, [user]);

  const saveTaxData = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour sauvegarder vos données",
      });
      return;
    }

    if (!results) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez d'abord calculer vos impôts",
      });
      return;
    }

    setIsSaving(true);
    try {
      const formValues = form.getValues();
      const { data: existingData } = await supabase
        .from("tax_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const taxData = {
        user_id: user.id,
        canton: formValues.canton,
        commune: formValues.commune,
        etat_civil: formValues.etatCivil,
        confession: formValues.confession || null,
        revenu_annuel: parseFloat(formValues.revenuAnnuel) || 0,
        fortune: parseFloat(formValues.fortune || "0") || 0,
        nombre_enfants: parseInt(formValues.nombreEnfants || "0") || 0,
        deduction_3eme_pilier: parseFloat(formValues.deduction3emePilier || "0") || 0,
        interets_hypothecaires: parseFloat(formValues.interetsHypothecaires || "0") || 0,
        autres_deductions: parseFloat(formValues.autresDeductions || "0") || 0,
        charges_sociales: parseFloat(formValues.chargesSociales || "0") || 0,
        impot_federal: results.impotFederal || 0,
        impot_cantonal: results.impotCantonal || 0,
        impot_communal: results.impotCommunal || 0,
        impot_ecclesiastique: results.impotEcclesiastique || 0,
        impot_fortune: 0,
        total_impots: results.totalImpots || 0,
      };

      if (existingData) {
        const { error } = await supabase.from("tax_data").update(taxData).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tax_data").insert(taxData);
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Données fiscales sauvegardées dans votre profil",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder vos données",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Barème Genève 2024
  const baremeGeneve2024 = [
    { seuilMin: 0, seuilMax: 18479, taux: 0, impotCumul: 0 },
    { seuilMin: 18480, seuilMax: 22264, taux: 8.0, impotCumul: 0 },
    { seuilMin: 22265, seuilMax: 24491, taux: 9.0, impotCumul: 302.80 },
    { seuilMin: 24492, seuilMax: 26717, taux: 10.0, impotCumul: 503.25 },
    { seuilMin: 26718, seuilMax: 28943, taux: 11.0, impotCumul: 725.85 },
    { seuilMin: 28944, seuilMax: 34509, taux: 12.0, impotCumul: 970.70 },
    { seuilMin: 34510, seuilMax: 38962, taux: 13.0, impotCumul: 1638.60 },
    { seuilMin: 38963, seuilMax: 43416, taux: 14.0, impotCumul: 2217.50 },
    { seuilMin: 43417, seuilMax: 47868, taux: 14.5, impotCumul: 2841.05 },
    { seuilMin: 47869, seuilMax: 76811, taux: 15.0, impotCumul: 3486.60 },
    { seuilMin: 76812, seuilMax: 125793, taux: 15.5, impotCumul: 7828.05 },
    { seuilMin: 125794, seuilMax: 169208, taux: 16.0, impotCumul: 15420.25 },
    { seuilMin: 169209, seuilMax: 191473, taux: 16.5, impotCumul: 22366.65 },
    { seuilMin: 191474, seuilMax: 273850, taux: 17.0, impotCumul: 26040.40 },
    { seuilMin: 273851, seuilMax: 291661, taux: 17.5, impotCumul: 40044.50 },
    { seuilMin: 291662, seuilMax: 410775, taux: 18.0, impotCumul: 43161.45 },
    { seuilMin: 410776, seuilMax: 643435, taux: 18.5, impotCumul: 64601.95 },
    { seuilMin: 643436, seuilMax: Infinity, taux: 19.0, impotCumul: 107644.05 }
  ];

  const calculateGenevaTax = (revenuNet: number, etatCivil: string, coefficientCommunal: number, confession?: string) => {
    let splittingCoeff = 1.0;
    if (etatCivil === "marie") splittingCoeff = 0.5;
    else if (etatCivil === "parent") splittingCoeff = 0.5556;

    const revenuPourTaux = revenuNet * splittingCoeff;

    let trancheIndex = 0;
    for (let i = 0; i < baremeGeneve2024.length; i++) {
      if (revenuPourTaux <= baremeGeneve2024[i].seuilMax) {
        trancheIndex = i;
        break;
      }
    }
    const tranche = baremeGeneve2024[trancheIndex];

    let impotBase = 0;
    if (tranche.taux > 0) {
      const difference = revenuPourTaux - tranche.seuilMin;
      impotBase = tranche.impotCumul + (difference * tranche.taux) / 100;
    }

    if (splittingCoeff < 1.0 && revenuPourTaux > 0) {
      impotBase = (revenuNet / revenuPourTaux) * impotBase;
    }

    const centimesCantonal = impotBase * 0.475;
    const montantAvantReduction = impotBase + centimesCantonal;
    const montantApresReduction = montantAvantReduction * 0.88;
    const supplementAideDomicile = impotBase * 0.01;
    const impotCantonal = montantApresReduction + supplementAideDomicile;
    const impotCommunal = impotBase * coefficientCommunal;

    let impotEcclesiastique = 0;
    const tauxEcclesiastique = confession && tauxEcclesiastiqueParCanton.GE?.[confession];
    if (tauxEcclesiastique) {
      impotEcclesiastique = impotBase * tauxEcclesiastique;
    }

    return {
      impotBase,
      impotCantonal: Math.round(impotCantonal * 100) / 100,
      impotCommunal: Math.round(impotCommunal * 100) / 100,
      impotEcclesiastique: Math.round(impotEcclesiastique * 100) / 100,
    };
  };

  const calculateEcclesiasticalTax = (impotCantonal: number, canton: string, confession?: string): number => {
    if (!confession || confession === "aucune" || !tauxEcclesiastiqueParCanton[canton]) return 0;
    const tauxEcclesiastique = tauxEcclesiastiqueParCanton[canton][confession];
    if (!tauxEcclesiastique) return 0;
    return Math.round(impotCantonal * tauxEcclesiastique * 100) / 100;
  };

  const calculateFederalTax = (revenuImposable: number): number => {
    if (revenuImposable < 18500) return 0;

    const bareme = [
      { seuil: 18500, impot: 25.41, tauxPar100: 0 },
      { seuil: 19000, impot: 29.26, tauxPar100: 0.77 },
      { seuil: 26000, impot: 83.16, tauxPar100: 0.77 },
      { seuil: 38000, impot: 180.84, tauxPar100: 0.88 },
      { seuil: 50000, impot: 400.80, tauxPar100: 2.64 },
      { seuil: 80000, impot: 1192.80, tauxPar100: 2.64 },
      { seuil: 100000, impot: 2688.00, tauxPar100: 6.60 },
      { seuil: 138300, impot: 5864.80, tauxPar100: 11.00 },
      { seuil: 184900, impot: 10920.40, tauxPar100: 13.20 },
      { seuil: 500000, impot: 52513.60, tauxPar100: 13.20 },
      { seuil: 700000, impot: 78913.60, tauxPar100: 13.20 }
    ];

    let trancheApplicable = bareme[0];
    for (let i = bareme.length - 1; i >= 0; i--) {
      if (revenuImposable >= bareme[i].seuil) {
        trancheApplicable = bareme[i];
        break;
      }
    }

    const revenuExcedentaire = revenuImposable - trancheApplicable.seuil;
    const impotSurExcedent = revenuExcedentaire / 100 * trancheApplicable.tauxPar100;
    return trancheApplicable.impot + impotSurExcedent;
  };

  const calculateTax = (values: z.infer<typeof formSchema>) => {
    const revenu = parseFloat(values.revenuAnnuel) || 0;
    const fortune = parseFloat(values.fortune || "0") || 0;
    const enfants = parseInt(values.nombreEnfants || "0") || 0;
    const pilier3 = parseFloat(values.deduction3emePilier || "0") || 0;
    const interets = parseFloat(values.interetsHypothecaires || "0") || 0;
    const autresDeductions = parseFloat(values.autresDeductions || "0") || 0;
    const chargesSociales = parseFloat(values.chargesSociales || "0") || 0;

    const revenuNetAvantDeductions = Math.max(0, revenu - chargesSociales);
    const deductionsTotal = pilier3 + interets + autresDeductions;
    const deductionEnfants = enfants * 6500;
    const deductionCouple = values.etatCivil === "marie" ? 2600 : 0;
    const revenuImposable = Math.max(0, revenuNetAvantDeductions - deductionsTotal - deductionEnfants - deductionCouple);
    const fortuneImposable = Math.max(0, fortune - 100000);

    const impotFederal = calculateFederalTax(revenuImposable);
    const cantonData = cantons.find(c => c.value === values.canton);
    const communeData = communesDisponibles.find(c => c.value === values.commune);
    
    let impotCantonal = 0;
    let impotCommunal = 0;
    let impotEcclesiastique = 0;

    if (values.canton === "GE") {
      const genevaResult = calculateGenevaTax(revenuImposable, values.etatCivil, communeData?.coefficientCommunal || 0.455, values.confession);
      impotCantonal = genevaResult.impotCantonal;
      impotCommunal = genevaResult.impotCommunal;
      impotEcclesiastique = genevaResult.impotEcclesiastique;
    } else if (values.canton === "VD") {
      const vaudResult = calculateVaudPrecise(revenuImposable, fortuneImposable, values.etatCivil, enfants, communeData?.coefficientCommunal || 0.70);
      impotCantonal = vaudResult.cantonal;
      impotCommunal = vaudResult.communal;
      impotEcclesiastique = calculateEcclesiasticalTax(impotCantonal, values.canton, values.confession);
    } else if (["VS", "FR", "NE", "JU", "BE"].includes(values.canton)) {
      const result = calculateRomandieStandard(
        values.canton,
        revenuImposable,
        fortuneImposable,
        values.etatCivil,
        enfants,
        cantonData?.tauxCantonal || 1.0,
        communeData?.coefficientCommunal || 1.0
      );
      impotCantonal = result.cantonal;
      impotCommunal = result.communal;
      impotEcclesiastique = calculateEcclesiasticalTax(impotCantonal, values.canton, values.confession);
    } else {
      const impotCantonalBase = revenuImposable * 0.065 + fortuneImposable * 0.002;
      impotCantonal = impotCantonalBase * (cantonData?.tauxCantonal || 1.00);
      const impotCommunalBase = revenuImposable * 0.025 + fortuneImposable * 0.001;
      impotCommunal = impotCommunalBase * (communeData?.coefficientCommunal || 1.00);
      impotEcclesiastique = calculateEcclesiasticalTax(impotCantonal, values.canton, values.confession);
    }

    const totalImpots = impotFederal + impotCantonal + impotCommunal + impotEcclesiastique;
    const tauxEffectif = revenu > 0 ? totalImpots / revenu * 100 : 0;

    let economiePilier3 = 0;
    if (pilier3 > 0) {
      const revenuImposableSansPilier3 = Math.max(0, revenuNetAvantDeductions - (deductionsTotal - pilier3) - deductionEnfants - deductionCouple);
      const impotFederalSansPilier3 = calculateFederalTax(revenuImposableSansPilier3);
      
      let impotCantonalSansPilier3 = 0;
      let impotCommunalSansPilier3 = 0;
      let impotEcclesiastiqueSansPilier3 = 0;
      
      if (values.canton === "GE") {
        const genevaResult = calculateGenevaTax(revenuImposableSansPilier3, values.etatCivil, communeData?.coefficientCommunal || 0.455, values.confession);
        impotCantonalSansPilier3 = genevaResult.impotCantonal;
        impotCommunalSansPilier3 = genevaResult.impotCommunal;
        impotEcclesiastiqueSansPilier3 = genevaResult.impotEcclesiastique;
      } else if (values.canton === "VD") {
        const vaudResult = calculateVaudPrecise(revenuImposableSansPilier3, fortuneImposable, values.etatCivil, enfants, communeData?.coefficientCommunal || 0.70);
        impotCantonalSansPilier3 = vaudResult.cantonal;
        impotCommunalSansPilier3 = vaudResult.communal;
        impotEcclesiastiqueSansPilier3 = calculateEcclesiasticalTax(impotCantonalSansPilier3, values.canton, values.confession);
      } else if (["VS", "FR", "NE", "JU", "BE"].includes(values.canton)) {
        const result = calculateRomandieStandard(values.canton, revenuImposableSansPilier3, fortuneImposable, values.etatCivil, enfants, cantonData?.tauxCantonal || 1.0, communeData?.coefficientCommunal || 1.0);
        impotCantonalSansPilier3 = result.cantonal;
        impotCommunalSansPilier3 = result.communal;
        impotEcclesiastiqueSansPilier3 = calculateEcclesiasticalTax(impotCantonalSansPilier3, values.canton, values.confession);
      } else {
        const impotCantonalBase = revenuImposableSansPilier3 * 0.065 + fortuneImposable * 0.002;
        impotCantonalSansPilier3 = impotCantonalBase * (cantonData?.tauxCantonal || 1.00);
        const impotCommunalBase = revenuImposableSansPilier3 * 0.025 + fortuneImposable * 0.001;
        impotCommunalSansPilier3 = impotCommunalBase * (communeData?.coefficientCommunal || 1.00);
        impotEcclesiastiqueSansPilier3 = calculateEcclesiasticalTax(impotCantonalSansPilier3, values.canton, values.confession);
      }
      
      const totalImpotsSansPilier3 = impotFederalSansPilier3 + impotCantonalSansPilier3 + impotCommunalSansPilier3 + impotEcclesiastiqueSansPilier3;
      economiePilier3 = totalImpotsSansPilier3 - totalImpots;
    }

    setResults({
      revenuImposable,
      fortuneImposable,
      deductionsTotal: chargesSociales + deductionsTotal + deductionEnfants + deductionCouple,
      impotFederal,
      impotCantonal,
      impotCommunal,
      impotEcclesiastique,
      totalImpots,
      tauxEffectif,
      economiePilier3,
      canton: cantonData?.label || "",
      commune: communeData?.label || "",
      coefficientCommunal: communeData?.coefficientCommunal || 1.00
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    calculateTax(values);
  };

  return (
    <AppLayout title="Calculez vos impôts 2025" subtitle="Estimez précisément vos impôts fédéraux, cantonaux et communaux selon votre situation personnelle">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="md:col-span-2">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Vos informations
                </CardTitle>
                <CardDescription>
                  Remplissez les champs ci-dessous pour calculer vos impôts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Localisation */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Localisation
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="canton"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Canton</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  setCommunesDisponibles(communesParCanton[val] || []);
                                  form.setValue("commune", "");
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un canton" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {cantons.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="commune"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Commune</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCanton}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez une commune" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {communesDisponibles.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Situation Personnelle */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="etatCivil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>État civil</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="celibataire">Célibataire</SelectItem>
                                <SelectItem value="marie">Marié(e)</SelectItem>
                                <SelectItem value="parent">Famille monoparentale</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nombreEnfants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enfants à charge</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Revenus Collapsible */}
                    <Collapsible open={revenusOpen} onOpenChange={setRevenusOpen}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Revenus & Fortune</h3>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className={`h-4 w-4 transition-transform ${revenusOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="revenuAnnuel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Revenu Brut Annuel</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="80'000"
                                  value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/'/g, '');
                                    if (value === '' || /^\d+$/.test(value)) {
                                      value = value.replace(/^0+(?=\d)/, '');
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fortune"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fortune Nette</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/'/g, '');
                                    if (value === '' || /^\d+$/.test(value)) {
                                      value = value.replace(/^0+(?=\d)/, '');
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Déductions Collapsible */}
                    <Collapsible open={deductionsOpen} onOpenChange={setDeductionsOpen}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Déductions</h3>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className={`h-4 w-4 transition-transform ${deductionsOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="chargesSociales"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AVS/AI/LPP (Charges)</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/'/g, '');
                                    if (value === '' || /^\d+$/.test(value)) {
                                      value = value.replace(/^0+(?=\d)/, '');
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deduction3emePilier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>3ème Pilier A</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="7'258"
                                  value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/'/g, '');
                                    if (value === '' || /^\d+$/.test(value)) {
                                      value = value.replace(/^0+(?=\d)/, '');
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="interetsHypothecaires"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Intérêts Dette</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/'/g, '');
                                    if (value === '' || /^\d+$/.test(value)) {
                                      value = value.replace(/^0+(?=\d)/, '');
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="autresDeductions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Autres (Frais prof.)</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/'/g, '');
                                    if (value === '' || /^\d+$/.test(value)) {
                                      value = value.replace(/^0+(?=\d)/, '');
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    <Button type="submit" className="w-full" size="lg">
                      <Calculator className="mr-2 h-5 w-5" />
                      Calculer mes impôts
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Résultats */}
            {results && (
              <Card className="bg-card border-border shadow-lg mt-6">
                <CardHeader>
                  <CardTitle className="text-primary">Estimation {results.canton}</CardTitle>
                  <CardDescription>
                    {results.commune}
                    <span className="block text-xs mt-1">
                      Taux communal: {results.coefficientCommunal}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Résumé Chiffré */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Revenu Imposable</p>
                      <p className="text-lg font-bold">{Math.round(results.revenuImposable).toLocaleString()} CHF</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Taux Global</p>
                      <p className="text-lg font-bold text-accent">{results.tauxEffectif.toFixed(2)}%</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Détail Impôts */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impôt Fédéral Direct</span>
                      <span className="font-medium">{Math.round(results.impotFederal).toLocaleString()} CHF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impôt Cantonal</span>
                      <span className="font-medium">{Math.round(results.impotCantonal).toLocaleString()} CHF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impôt Communal</span>
                      <span className="font-medium">{Math.round(results.impotCommunal).toLocaleString()} CHF</span>
                    </div>
                    {results.impotEcclesiastique > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Impôt Eglise</span>
                        <span className="font-medium">{Math.round(results.impotEcclesiastique).toLocaleString()} CHF</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center">
                    <span className="font-semibold">Total à payer</span>
                    <span className="text-2xl font-bold text-primary">{Math.round(results.totalImpots).toLocaleString()} CHF</span>
                  </div>

                  {results.economiePilier3 > 0 && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-primary/20">
                      <span className="text-muted-foreground">Économie grâce au 3ème pilier</span>
                      <span className="font-semibold text-green-500">- CHF {results.economiePilier3.toLocaleString()}</span>
                    </div>
                  )}

                  {user && (
                    <Button onClick={saveTaxData} disabled={isSaving} className="w-full mt-4" size="lg">
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Enregistrement..." : "Sauvegarder simulation"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne Info */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingDown className="h-5 w-5" />
                  Spécificités Cantonales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Vaud:</strong> Utilise le "Quotient Familial" (splitting) qui divise le revenu par le nombre de parts (ex: 1.8 pour un couple).
                </p>
                <Separator className="bg-border/50" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Genève:</strong> Barème progressif unique, avec un système complexe de centimes additionnels et rabais.
                </p>
                <Separator className="bg-border/50" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Valais/Fribourg/Autres:</strong> Calculent un "Impôt Simple" multiplié par un coefficient cantonal et communal.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Info className="h-5 w-5" />
                  Conseils d'optimisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">3ème pilier A</h4>
                    <p className="text-sm text-muted-foreground">
                      Cotisez jusqu'à CHF 7'258 par an pour réduire votre revenu imposable
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Frais professionnels</h4>
                    <p className="text-sm text-muted-foreground">
                      Déduisez vos frais de transport, repas et formation continue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Avertissement :</strong> Cette simulation est indicative et ne remplace pas un conseil fiscal professionnel.
                  Les calculs sont simplifiés et peuvent varier selon votre situation spécifique.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SimulateurImpots;
