import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Wallet, Calculator, FileText, Loader2, Edit, Save, X, ChevronDown, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { calculateAllAVSPensions, formatCHF } from "@/lib/avsCalculations";

interface Profile {
  nom: string;
  prenom: string;
  email: string;
  appellation: string;
  date_naissance: string;
  localite: string;
  adresse: string | null;
  telephone: string | null;
}

interface Document {
  id: string;
  file_name: string;
  category: string;
  subcategory: string | null;
  file_size: number;
  uploaded_at: string;
}

interface BudgetData {
  period_type: "mensuel" | "annuel";
  revenu_brut: number;
  charges_sociales: number;
  depenses_logement: number;
  depenses_transport: number;
  depenses_alimentation: number;
  autres_depenses: number;
}

interface PrevoyanceData {
  avs_1er_pilier: number;
  lpp_2eme_pilier: number;
  pilier_3a: number;
  pilier_3b: number;
  rente_vieillesse_mensuelle?: number;
  rente_vieillesse_annuelle?: number;
  rente_invalidite_mensuelle?: number;
  rente_invalidite_annuelle?: number;
  revenu_annuel_determinant?: number;
  // Nouveaux champs LPP depuis certificat
  lpp_avoir_vieillesse?: number;
  lpp_capital_projete_65?: number;
  lpp_rente_mensuelle_projetee?: number;
  lpp_rente_annuelle_projetee?: number;
  lpp_rente_invalidite_mensuelle?: number;
  lpp_rente_invalidite_annuelle?: number;
  lpp_capital_invalidite?: number;
  lpp_rente_conjoint_survivant?: number;
  lpp_rente_orphelins?: number;
  lpp_capital_deces?: number;
  lpp_derniere_maj?: string;
  // Configuration prévoyance
  etat_civil?: string;
  nombre_enfants?: number;
}

interface TaxData {
  id: string;
  canton: string;
  commune: string;
  etat_civil: string;
  confession: string | null;
  revenu_annuel: number;
  fortune: number;
  nombre_enfants: number;
  deduction_3eme_pilier: number;
  interets_hypothecaires: number;
  autres_deductions: number;
  charges_sociales: number;
  impot_federal: number;
  impot_cantonal: number;
  impot_communal: number;
  impot_ecclesiastique: number;
  impot_fortune: number;
  total_impots: number;
  created_at: string;
  updated_at: string;
}

const profileSchema = z.object({
  appellation: z.string().min(1, "L'appellation est requise"),
  nom: z.string().trim().min(1, "Le nom est requis").max(100, "Le nom doit faire moins de 100 caractères"),
  prenom: z.string().trim().min(1, "Le prénom est requis").max(100, "Le prénom doit faire moins de 100 caractères"),
  email: z.string().trim().email("Email invalide").max(255, "L'email doit faire moins de 255 caractères"),
  date_naissance: z.string().min(1, "La date de naissance est requise"),
  localite: z.string().trim().min(1, "La localité est requise").max(100, "La localité doit faire moins de 100 caractères"),
  adresse: z.string().trim().max(255, "L'adresse doit faire moins de 255 caractères").optional(),
  telephone: z.string().trim().max(20, "Le téléphone doit faire moins de 20 caractères").optional(),
});

const budgetSchema = z.object({
  period_type: z.enum(["mensuel", "annuel"]),
  revenu_brut: z.number().min(0, "Le montant doit être positif"),
  charges_sociales: z.number().min(0, "Le montant doit être positif"),
  depenses_logement: z.number().min(0, "Le montant doit être positif"),
  depenses_transport: z.number().min(0, "Le montant doit être positif"),
  depenses_alimentation: z.number().min(0, "Le montant doit être positif"),
  autres_depenses: z.number().min(0, "Le montant doit être positif"),
});

const prevoyanceSchema = z.object({
  avs_1er_pilier: z.number().min(0, "Le montant doit être positif"),
  lpp_2eme_pilier: z.number().min(0, "Le montant doit être positif"),
  pilier_3a: z.number().min(0, "Le montant doit être positif"),
  pilier_3b: z.number().min(0, "Le montant doit être positif"),
  rente_vieillesse_mensuelle: z.number().min(0).optional(),
  rente_vieillesse_annuelle: z.number().min(0).optional(),
  rente_invalidite_mensuelle: z.number().min(0).optional(),
  rente_invalidite_annuelle: z.number().min(0).optional(),
  revenu_annuel_determinant: z.number().min(0).optional(),
  // Nouveaux champs LPP depuis certificat
  lpp_avoir_vieillesse: z.number().min(0).optional(),
  lpp_capital_projete_65: z.number().min(0).optional(),
  lpp_rente_mensuelle_projetee: z.number().min(0).optional(),
  lpp_rente_annuelle_projetee: z.number().min(0).optional(),
  lpp_rente_invalidite_mensuelle: z.number().min(0).optional(),
  lpp_rente_invalidite_annuelle: z.number().min(0).optional(),
  lpp_capital_invalidite: z.number().min(0).optional(),
  lpp_rente_conjoint_survivant: z.number().min(0).optional(),
  lpp_rente_orphelins: z.number().min(0).optional(),
  lpp_capital_deces: z.number().min(0).optional(),
  lpp_derniere_maj: z.string().optional(),
});

const taxSchema = z.object({
  canton: z.string().min(1, "Le canton est requis"),
  commune: z.string().min(1, "La commune est requise"),
  etat_civil: z.string().min(1, "L'état civil est requis"),
  confession: z.string().optional(),
  revenu_annuel: z.number().min(0, "Le montant doit être positif"),
  fortune: z.number().min(0, "Le montant doit être positif"),
  nombre_enfants: z.number().min(0, "Le nombre doit être positif"),
  deduction_3eme_pilier: z.number().min(0, "Le montant doit être positif"),
  interets_hypothecaires: z.number().min(0, "Le montant doit être positif"),
  autres_deductions: z.number().min(0, "Le montant doit être positif"),
  charges_sociales: z.number().min(0, "Le montant doit être positif"),
});

// Cantons disponibles avec leurs taux
const cantons = [
  { value: "GE", label: "Genève", tauxCantonal: 1.00, coefficientCantonal: 45.50 },
  { value: "VD", label: "Vaud", tauxCantonal: 1.00, coefficientCantonal: 1.00 }
];

// Communes par canton avec leurs coefficients
const communesParCanton: Record<string, Array<{ value: string; label: string; coefficientCommunal: number }>> = {
  VD: [
    { value: "aigle", label: "Aigle", coefficientCommunal: 0.66 },
    { value: "lausanne", label: "Lausanne", coefficientCommunal: 0.76 },
    { value: "yverdon-les-bains", label: "Yverdon-les-Bains", coefficientCommunal: 0.78 },
    { value: "montreux", label: "Montreux", coefficientCommunal: 0.68 },
    { value: "vevey", label: "Vevey", coefficientCommunal: 0.73 },
    { value: "nyon", label: "Nyon", coefficientCommunal: 0.66 },
    { value: "renens", label: "Renens", coefficientCommunal: 0.79 },
    { value: "pully", label: "Pully", coefficientCommunal: 0.67 },
    { value: "morges", label: "Morges", coefficientCommunal: 0.72 },
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
    { value: "carouge", label: "Carouge", coefficientCommunal: 0.44 },
    { value: "onex", label: "Onex", coefficientCommunal: 0.46 },
    { value: "thonex", label: "Thônex", coefficientCommunal: 0.42 },
    { value: "versoix", label: "Versoix", coefficientCommunal: 0.41 },
    { value: "grand-saconnex", label: "Le Grand-Saconnex", coefficientCommunal: 0.40 },
    { value: "plan-les-ouates", label: "Plan-les-Ouates", coefficientCommunal: 0.39 },
    { value: "chene-bougeries", label: "Chêne-Bougeries", coefficientCommunal: 0.36 },
    { value: "cologny", label: "Cologny", coefficientCommunal: 0.35 },
    { value: "veyrier", label: "Veyrier", coefficientCommunal: 0.42 }
  ]
};

const UserProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editingPrevoyance, setEditingPrevoyance] = useState(false);
  const [editingTax, setEditingTax] = useState(false);
  const [displayPeriodType, setDisplayPeriodType] = useState<"mensuel" | "annuel">("mensuel");
  const [communesDisponibles, setCommunesDisponibles] = useState<Array<{ value: string; label: string; coefficientCommunal: number }>>([]);
  const [openPrevoyanceCategories, setOpenPrevoyanceCategories] = useState<Record<string, boolean>>({
    "1er_pilier": true,
    "2eme_pilier": true,
    "3eme_pilier": true,
  });
  const [editingPrevoyanceCategory, setEditingPrevoyanceCategory] = useState<string | null>(null);
  
  // Collapsible states
  const [revenusOpen, setRevenusOpen] = useState(true);
  const [depensesOpen, setDepensesOpen] = useState(true);
  
  // Mobile sections states
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [mobileBudgetOpen, setMobileBudgetOpen] = useState(false);
  const [mobilePrevoyanceOpen, setMobilePrevoyanceOpen] = useState(false);
  const [mobileImpotsOpen, setMobileImpotsOpen] = useState(false);
  const [mobileAssurancesOpen, setMobileAssurancesOpen] = useState(false);
  const [mobileDocumentsOpen, setMobileDocumentsOpen] = useState(false);
  
  const [budgetData, setBudgetData] = useState<BudgetData>({
    period_type: "mensuel",
    revenu_brut: 0,
    charges_sociales: 0,
    depenses_logement: 0,
    depenses_transport: 0,
    depenses_alimentation: 0,
    autres_depenses: 0,
  });

  const [prevoyanceData, setPrevoyanceData] = useState<PrevoyanceData>({
    avs_1er_pilier: 0,
    lpp_2eme_pilier: 0,
    pilier_3a: 0,
    pilier_3b: 0,
    rente_vieillesse_mensuelle: 0,
    rente_vieillesse_annuelle: 0,
    rente_invalidite_mensuelle: 0,
    rente_invalidite_annuelle: 0,
    revenu_annuel_determinant: 0,
    etat_civil: "",
    nombre_enfants: 0,
  });
  const [isCalculatingAVS, setIsCalculatingAVS] = useState(false);
  const [lppCertificate, setLppCertificate] = useState<any | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      appellation: "",
      nom: "",
      prenom: "",
      email: "",
      date_naissance: "",
      localite: "",
      adresse: "",
      telephone: "",
    },
  });

  const budgetForm = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budgetData,
  });

  const prevoyanceForm = useForm<z.infer<typeof prevoyanceSchema>>({
    resolver: zodResolver(prevoyanceSchema),
    defaultValues: prevoyanceData,
  });

  const taxForm = useForm<z.infer<typeof taxSchema>>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      canton: "",
      commune: "",
      etat_civil: "",
      confession: "aucune",
      revenu_annuel: 0,
      fortune: 0,
      nombre_enfants: 0,
      deduction_3eme_pilier: 0,
      interets_hypothecaires: 0,
      autres_deductions: 0,
      charges_sociales: 0,
    },
  });

  const selectedCanton = taxForm.watch("canton");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchLppCertificate();
    }
  }, [user]);

  // Écouter les changements en temps réel sur prevoyance_data
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('prevoyance-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prevoyance_data',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Changement détecté dans prevoyance_data:', payload);
          // Recharger les données de prévoyance
          if (payload.new) {
            const updatedPrevoyance: PrevoyanceData = {
              avs_1er_pilier: Number(payload.new.avs_1er_pilier),
              lpp_2eme_pilier: Number(payload.new.lpp_2eme_pilier),
              pilier_3a: Number(payload.new.pilier_3a),
              pilier_3b: Number(payload.new.pilier_3b),
              rente_vieillesse_mensuelle: Number(payload.new.rente_vieillesse_mensuelle || 0),
              rente_vieillesse_annuelle: Number(payload.new.rente_vieillesse_annuelle || 0),
              rente_invalidite_mensuelle: Number(payload.new.rente_invalidite_mensuelle || 0),
              rente_invalidite_annuelle: Number(payload.new.rente_invalidite_annuelle || 0),
              revenu_annuel_determinant: Number(payload.new.revenu_annuel_determinant || 0),
              etat_civil: payload.new.etat_civil || "",
              nombre_enfants: Number(payload.new.nombre_enfants || 0),
            };
            setPrevoyanceData(updatedPrevoyance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoadingData(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile(profileData);
        profileForm.reset({
          appellation: profileData.appellation,
          nom: profileData.nom,
          prenom: profileData.prenom,
          email: profileData.email,
          date_naissance: profileData.date_naissance,
          localite: profileData.localite,
          adresse: profileData.adresse || "",
          telephone: profileData.telephone || "",
        });
      }

      const { data: budgetDataResult, error: budgetError } = await supabase
        .from("budget_data")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;

      if (budgetDataResult) {
        const budget: BudgetData = {
          period_type: (budgetDataResult.period_type as "mensuel" | "annuel"),
          revenu_brut: Number(budgetDataResult.revenu_brut),
          charges_sociales: Number(budgetDataResult.charges_sociales),
          depenses_logement: Number(budgetDataResult.depenses_logement),
          depenses_transport: Number(budgetDataResult.depenses_transport),
          depenses_alimentation: Number(budgetDataResult.depenses_alimentation),
          autres_depenses: Number(budgetDataResult.autres_depenses),
        };
        setBudgetData(budget);
        setDisplayPeriodType(budget.period_type);
        budgetForm.reset(budget);
      }

      const { data: prevoyanceDataResult, error: prevoyanceError } = await supabase
        .from("prevoyance_data")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (prevoyanceError && prevoyanceError.code !== 'PGRST116') throw prevoyanceError;

      if (prevoyanceDataResult) {
        const prevoyance: PrevoyanceData = {
          avs_1er_pilier: Number(prevoyanceDataResult.avs_1er_pilier),
          lpp_2eme_pilier: Number(prevoyanceDataResult.lpp_2eme_pilier),
          pilier_3a: Number(prevoyanceDataResult.pilier_3a),
          pilier_3b: Number(prevoyanceDataResult.pilier_3b),
          rente_vieillesse_mensuelle: Number(prevoyanceDataResult.rente_vieillesse_mensuelle || 0),
          rente_vieillesse_annuelle: Number(prevoyanceDataResult.rente_vieillesse_annuelle || 0),
          rente_invalidite_mensuelle: Number(prevoyanceDataResult.rente_invalidite_mensuelle || 0),
          rente_invalidite_annuelle: Number(prevoyanceDataResult.rente_invalidite_annuelle || 0),
          revenu_annuel_determinant: Number(prevoyanceDataResult.revenu_annuel_determinant || 0),
          etat_civil: prevoyanceDataResult.etat_civil || "",
          nombre_enfants: Number(prevoyanceDataResult.nombre_enfants || 0),
        };
        setPrevoyanceData(prevoyance);
        prevoyanceForm.reset(prevoyance);
      }

      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user?.id)
        .order("uploaded_at", { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

      const { data: taxDataResult, error: taxError } = await supabase
        .from("tax_data")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (taxError && taxError.code !== 'PGRST116') throw taxError;

      if (taxDataResult) {
        setTaxData(taxDataResult as TaxData);
        taxForm.reset({
          canton: taxDataResult.canton,
          commune: taxDataResult.commune,
          etat_civil: taxDataResult.etat_civil,
          confession: taxDataResult.confession || "aucune",
          revenu_annuel: Number(taxDataResult.revenu_annuel),
          fortune: Number(taxDataResult.fortune),
          nombre_enfants: Number(taxDataResult.nombre_enfants),
          deduction_3eme_pilier: Number(taxDataResult.deduction_3eme_pilier),
          interets_hypothecaires: Number(taxDataResult.interets_hypothecaires),
          autres_deductions: Number(taxDataResult.autres_deductions),
          charges_sociales: Number(taxDataResult.charges_sociales),
        });

        // Charger les communes pour le canton sélectionné
        if (taxDataResult.canton && communesParCanton[taxDataResult.canton]) {
          setCommunesDisponibles(communesParCanton[taxDataResult.canton]);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos données",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchLppCertificate = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'prevoyance_retraite')
        .eq('subcategory', '2eme_pilier_lpp')
        .eq('extraction_status', 'completed')
        .not('extracted_data', 'is', null)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setLppCertificate(data);
      }
    } catch (error) {
      console.error('Error fetching LPP certificate:', error);
    }
  };

  const handleImportLppData = () => {
    if (!lppCertificate?.extracted_data) return;

    const data = lppCertificate.extracted_data;
    
    // Pre-fill form with extracted data
    prevoyanceForm.setValue('lpp_avoir_vieillesse', data.avoir_vieillesse || 0);
    prevoyanceForm.setValue('lpp_capital_projete_65', data.capital_projete_65 || 0);
    prevoyanceForm.setValue('lpp_rente_mensuelle_projetee', data.rente_mensuelle_projetee || 0);
    prevoyanceForm.setValue('lpp_rente_annuelle_projetee', data.rente_annuelle_projetee || 0);
    prevoyanceForm.setValue('lpp_rente_invalidite_mensuelle', data.rente_invalidite_mensuelle || 0);
    prevoyanceForm.setValue('lpp_rente_invalidite_annuelle', data.rente_invalidite_annuelle || 0);
    prevoyanceForm.setValue('lpp_capital_invalidite', data.capital_invalidite || 0);
    prevoyanceForm.setValue('lpp_rente_conjoint_survivant', data.rente_conjoint_survivant || 0);
    prevoyanceForm.setValue('lpp_rente_orphelins', data.rente_orphelins || 0);
    prevoyanceForm.setValue('lpp_capital_deces', data.capital_deces || 0);
    prevoyanceForm.setValue('lpp_derniere_maj', data.date_certificat || new Date().toISOString().split('T')[0]);

    setEditingPrevoyanceCategory("2eme_pilier");
    setShowImportConfirm(false);
    
    toast({
      title: "Données importées !",
      description: "Les données du certificat LPP ont été pré-remplies. Vérifiez et sauvegardez.",
    });
  };

  const onSubmitProfile = async (values: z.infer<typeof profileSchema>) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          appellation: values.appellation,
          nom: values.nom,
          prenom: values.prenom,
          email: values.email,
          date_naissance: values.date_naissance,
          localite: values.localite,
          adresse: values.adresse || null,
          telephone: values.telephone || null,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès",
      });

      setEditingProfile(false);
      fetchUserData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
      });
    }
  };

  const onSubmitBudget = async (values: z.infer<typeof budgetSchema>) => {
    try {
      const { data: existingBudget } = await supabase
        .from("budget_data")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      // Les valeurs dans le formulaire sont dans la période sélectionnée
      // On calcule directement les deux versions (mensuelle et annuelle)
      const revenu_brut_mensuel = values.period_type === "mensuel" ? values.revenu_brut : Math.round(values.revenu_brut / 12);
      const revenu_brut_annuel = values.period_type === "annuel" ? values.revenu_brut : values.revenu_brut * 12;
      const charges_sociales_mensuel = values.period_type === "mensuel" ? values.charges_sociales : Math.round(values.charges_sociales / 12);
      const charges_sociales_annuel = values.period_type === "annuel" ? values.charges_sociales : values.charges_sociales * 12;
      const depenses_logement_mensuel = values.period_type === "mensuel" ? values.depenses_logement : Math.round(values.depenses_logement / 12);
      const depenses_logement_annuel = values.period_type === "annuel" ? values.depenses_logement : values.depenses_logement * 12;
      const depenses_transport_mensuel = values.period_type === "mensuel" ? values.depenses_transport : Math.round(values.depenses_transport / 12);
      const depenses_transport_annuel = values.period_type === "annuel" ? values.depenses_transport : values.depenses_transport * 12;
      const depenses_alimentation_mensuel = values.period_type === "mensuel" ? values.depenses_alimentation : Math.round(values.depenses_alimentation / 12);
      const depenses_alimentation_annuel = values.period_type === "annuel" ? values.depenses_alimentation : values.depenses_alimentation * 12;
      const autres_depenses_mensuel = values.period_type === "mensuel" ? values.autres_depenses : Math.round(values.autres_depenses / 12);
      const autres_depenses_annuel = values.period_type === "annuel" ? values.autres_depenses : values.autres_depenses * 12;

      const dataToSave = {
        period_type: values.period_type,
        revenu_brut: values.revenu_brut,
        charges_sociales: values.charges_sociales,
        depenses_logement: values.depenses_logement,
        depenses_transport: values.depenses_transport,
        depenses_alimentation: values.depenses_alimentation,
        autres_depenses: values.autres_depenses,
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

      if (existingBudget) {
        const { error } = await supabase
          .from("budget_data")
          .update(dataToSave)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget_data")
          .insert({
            user_id: user.id,
            ...dataToSave,
          });

        if (error) throw error;
      }

      // Synchroniser les données de prévoyance depuis budget_data vers prevoyance_data
      const { data: budgetWithPrevoyance } = await supabase
        .from("budget_data")
        .select("avs_1er_pilier, lpp_2eme_pilier, pilier_3a, pilier_3b")
        .eq("user_id", user.id)
        .single();


      toast({
        title: "Budget mis à jour",
        description: "Vos données budgétaires ont été enregistrées",
      });

      setEditingBudget(false);
      fetchUserData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le budget",
      });
    }
  };

  const onSubmitPrevoyance = async (values: z.infer<typeof prevoyanceSchema>) => {
    try {
      const { data: existingPrevoyance } = await supabase
        .from("prevoyance_data")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      const dataToSave = {
        user_id: user?.id,
        avs_1er_pilier: values.avs_1er_pilier,
        lpp_2eme_pilier: values.lpp_2eme_pilier,
        pilier_3a: values.pilier_3a,
        pilier_3b: values.pilier_3b,
        rente_vieillesse_mensuelle: values.rente_vieillesse_mensuelle || 0,
        rente_vieillesse_annuelle: values.rente_vieillesse_annuelle || 0,
        rente_invalidite_mensuelle: values.rente_invalidite_mensuelle || 0,
        rente_invalidite_annuelle: values.rente_invalidite_annuelle || 0,
        revenu_annuel_determinant: values.revenu_annuel_determinant || 0,
      };

      if (existingPrevoyance) {
        const { error } = await supabase
          .from("prevoyance_data")
          .update(dataToSave)
          .eq("user_id", user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("prevoyance_data")
          .insert(dataToSave);

        if (error) throw error;
      }


      toast({
        title: "Prévoyance mise à jour",
        description: "Vos informations de prévoyance ont été enregistrées avec succès",
      });

      setEditingPrevoyanceCategory(null);
      setPrevoyanceData(values as PrevoyanceData);
      fetchUserData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour les données de prévoyance",
      });
    }
  };

  const handleCalculateAVS = async () => {
    try {
      setIsCalculatingAVS(true);

      // 1. Récupérer le revenu annuel de budget_data
      const { data: budgetData, error: budgetError } = await supabase
        .from("budget_data")
        .select("revenu_brut_annuel")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (budgetError) throw budgetError;

      if (!budgetData?.revenu_brut_annuel || budgetData.revenu_brut_annuel <= 0) {
        toast({
          variant: "destructive",
          title: "Revenu manquant",
          description: "Veuillez d'abord renseigner votre revenu annuel dans la section Budget",
        });
        setIsCalculatingAVS(false);
        return;
      }

      // 2. Calculer les rentes avec la fonction utilitaire
      const calculatedPensions = calculateAllAVSPensions(budgetData.revenu_brut_annuel);

      // 3. Vérifier si des données de prévoyance existent déjà
      const { data: existingPrevoyance } = await supabase
        .from("prevoyance_data")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      // 4. Sauvegarder dans prevoyance_data
      const dataToSave = {
        user_id: user?.id,
        ...calculatedPensions,
        avs_1er_pilier: prevoyanceData.avs_1er_pilier, // Conserver la cotisation existante
        lpp_2eme_pilier: prevoyanceData.lpp_2eme_pilier,
        pilier_3a: prevoyanceData.pilier_3a,
        pilier_3b: prevoyanceData.pilier_3b,
      };

      if (existingPrevoyance) {
        const { error } = await supabase
          .from("prevoyance_data")
          .update(dataToSave)
          .eq("user_id", user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("prevoyance_data")
          .insert(dataToSave);

        if (error) throw error;
      }

      toast({
        title: "Rentes AVS calculées",
        description: "Vos rentes de vieillesse et d'invalidité ont été calculées selon l'Échelle 44 2025",
      });

      // Rafraîchir les données
      await fetchUserData();
    } catch (error) {
      console.error("Error calculating AVS:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de calculer les rentes AVS",
      });
    } finally {
      setIsCalculatingAVS(false);
    }
  };

  const onSubmitTax = async (values: z.infer<typeof taxSchema>) => {
    try {
      const { data: existingTax } = await supabase
        .from("tax_data")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      const taxDataToSave = {
        user_id: user?.id,
        canton: values.canton,
        commune: values.commune,
        etat_civil: values.etat_civil,
        confession: values.confession || null,
        revenu_annuel: values.revenu_annuel,
        fortune: values.fortune,
        nombre_enfants: values.nombre_enfants,
        deduction_3eme_pilier: values.deduction_3eme_pilier,
        interets_hypothecaires: values.interets_hypothecaires,
        autres_deductions: values.autres_deductions,
        charges_sociales: values.charges_sociales,
      };

      if (existingTax) {
        const { error } = await supabase
          .from("tax_data")
          .update(taxDataToSave)
          .eq("user_id", user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tax_data")
          .insert(taxDataToSave);

        if (error) throw error;
      }

      toast({
        title: "Données fiscales mises à jour",
        description: "Vos informations fiscales ont été enregistrées",
      });

      setEditingTax(false);
      fetchUserData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour les données fiscales",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const convertValue = (value: number) => {
    if (budgetData.period_type === displayPeriodType) {
      return value;
    }
    
    if (budgetData.period_type === "mensuel" && displayPeriodType === "annuel") {
      return value * 12;
    }
    
    if (budgetData.period_type === "annuel" && displayPeriodType === "mensuel") {
      return Math.round(value / 12);
    }
    
    return value;
  };

  const getDisplayData = () => {
    return {
      revenu_brut: convertValue(budgetData.revenu_brut),
      charges_sociales: convertValue(budgetData.charges_sociales),
      depenses_logement: convertValue(budgetData.depenses_logement),
      depenses_transport: convertValue(budgetData.depenses_transport),
      depenses_alimentation: convertValue(budgetData.depenses_alimentation),
      autres_depenses: convertValue(budgetData.autres_depenses),
    };
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayData = getDisplayData();
  const revenuNet = displayData.revenu_brut - displayData.charges_sociales;
  const totalDepenses =
    displayData.depenses_logement +
    displayData.depenses_transport +
    displayData.depenses_alimentation +
    displayData.autres_depenses;
  const soldeBudget = revenuNet - totalDepenses;

  const totalPrevoyance =
    prevoyanceData.avs_1er_pilier +
    prevoyanceData.lpp_2eme_pilier +
    prevoyanceData.pilier_3a +
    prevoyanceData.pilier_3b;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Profil utilisateur</h1>
            <p className="text-muted-foreground">
              Retrouvez et modifiez toutes vos informations personnelles
            </p>
          </div>

          {/* Version Mobile - Liste rétractable */}
          <div className="md:hidden space-y-3">
            <Collapsible open={mobileInfoOpen} onOpenChange={setMobileInfoOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Informations</CardTitle>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${mobileInfoOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      {!editingProfile ? (
                        <Button onClick={() => setEditingProfile(true)} variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      ) : (
                        <Button onClick={() => setEditingProfile(false)} variant="outline" size="sm" className="w-full">
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      )}
                    </div>
                    {editingProfile ? (
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="appellation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Appellation</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Monsieur">Monsieur</SelectItem>
                                    <SelectItem value="Madame">Madame</SelectItem>
                                    <SelectItem value="Autre">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="nom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="prenom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="date_naissance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date de naissance</FormLabel>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="localite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Localité</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="adresse"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adresse (optionnel)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="telephone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Téléphone (optionnel)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="tel" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer
                          </Button>
                        </form>
                      </Form>
                    ) : (
                      <div className="space-y-4">
                        {profile && (
                          <>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Appellation</h3>
                              <p className="text-foreground">{profile.appellation}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Nom</h3>
                              <p className="text-foreground">{profile.nom}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Prénom</h3>
                              <p className="text-foreground">{profile.prenom}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                              <p className="text-foreground">{profile.email}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</h3>
                              <p className="text-foreground">{formatDate(profile.date_naissance)}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Localité</h3>
                              <p className="text-foreground">{profile.localite}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Adresse</h3>
                              <p className="text-foreground">{profile.adresse || "Non renseignée"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Téléphone</h3>
                              <p className="text-foreground">{profile.telephone || "Non renseigné"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">État civil</h3>
                              <p className="text-foreground">
                                {prevoyanceData.etat_civil 
                                  ? prevoyanceData.etat_civil === "celibataire" ? "Célibataire"
                                    : prevoyanceData.etat_civil === "marie" ? "Marié(e)"
                                    : prevoyanceData.etat_civil === "divorce" ? "Divorcé(e)"
                                    : prevoyanceData.etat_civil === "veuf" ? "Veuf/Veuve"
                                    : prevoyanceData.etat_civil
                                  : "Non renseigné"}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Nombre d'enfants</h3>
                              <p className="text-foreground">{prevoyanceData.nombre_enfants || 0}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={mobileBudgetOpen} onOpenChange={setMobileBudgetOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Budget</CardTitle>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${mobileBudgetOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      {!editingBudget ? (
                        <Button onClick={() => {
                          setEditingBudget(true);
                          const formValues = {
                            ...budgetData,
                            period_type: displayPeriodType,
                            revenu_brut: convertValue(budgetData.revenu_brut),
                            charges_sociales: convertValue(budgetData.charges_sociales),
                            depenses_logement: convertValue(budgetData.depenses_logement),
                            depenses_transport: convertValue(budgetData.depenses_transport),
                            depenses_alimentation: convertValue(budgetData.depenses_alimentation),
                            autres_depenses: convertValue(budgetData.autres_depenses),
                          };
                          budgetForm.reset(formValues);
                        }} variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      ) : (
                        <Button onClick={() => {
                          setEditingBudget(false);
                          budgetForm.reset(budgetData);
                        }} variant="outline" size="sm" className="w-full">
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Données en {budgetData.period_type}
                    </p>
                    {!editingBudget ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-base">Revenus</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Revenu brut</span>
                              <span className="text-sm font-medium">{formatCurrency(convertValue(budgetData.revenu_brut))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Charges sociales</span>
                              <span className="text-sm font-medium text-destructive">-{formatCurrency(convertValue(budgetData.charges_sociales))}</span>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="font-semibold text-base">Dépenses</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Logement</span>
                              <span className="text-sm font-medium">{formatCurrency(convertValue(budgetData.depenses_logement))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Transport</span>
                              <span className="text-sm font-medium">{formatCurrency(convertValue(budgetData.depenses_transport))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Alimentation</span>
                              <span className="text-sm font-medium">{formatCurrency(convertValue(budgetData.depenses_alimentation))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Autres</span>
                              <span className="text-sm font-medium">{formatCurrency(convertValue(budgetData.autres_depenses))}</span>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-semibold">Solde</span>
                          <span className={`font-bold text-lg ${soldeBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(convertValue(soldeBudget))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={() => navigate("/budget")} variant="outline" size="sm" className="w-full">
                        Ouvrir l'éditeur de budget
                      </Button>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Prévoyance & Retraite Mobile */}
            <Collapsible open={mobilePrevoyanceOpen} onOpenChange={setMobilePrevoyanceOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Prévoyance & Retraite</CardTitle>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${mobilePrevoyanceOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">AVS (1er pilier)</p>
                          <p className="text-lg font-semibold">{formatCurrency(prevoyanceData.avs_1er_pilier)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">LPP (2ème pilier)</p>
                          <p className="text-lg font-semibold">{formatCurrency(prevoyanceData.lpp_2eme_pilier)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">3ème Pilier A</p>
                          <p className="text-lg font-semibold">{formatCurrency(prevoyanceData.pilier_3a)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">3ème Pilier B</p>
                          <p className="text-lg font-semibold">{formatCurrency(prevoyanceData.pilier_3b)}</p>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total prévoyance</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrevoyance)}</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={mobileImpotsOpen} onOpenChange={setMobileImpotsOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Impôts</CardTitle>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${mobileImpotsOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    {taxData ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Canton</span>
                            <span className="text-sm font-medium">{cantons.find(c => c.value === taxData.canton)?.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Commune</span>
                            <span className="text-sm font-medium capitalize">{taxData.commune}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">État civil</span>
                            <span className="text-sm font-medium capitalize">{taxData.etat_civil}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Revenu annuel</span>
                            <span className="text-sm font-medium">{formatCurrency(taxData.revenu_annuel)}</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm">Impôts calculés</h3>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Impôt fédéral</span>
                            <span className="text-sm font-medium">{formatCurrency(taxData.impot_federal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Impôt cantonal</span>
                            <span className="text-sm font-medium">{formatCurrency(taxData.impot_cantonal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Impôt communal</span>
                            <span className="text-sm font-medium">{formatCurrency(taxData.impot_communal)}</span>
                          </div>
                          {taxData.impot_ecclesiastique > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Impôt ecclésiastique</span>
                              <span className="text-sm font-medium">{formatCurrency(taxData.impot_ecclesiastique)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between items-center pt-2">
                            <span className="font-semibold">Total annuel</span>
                            <span className="font-bold text-lg text-primary">{formatCurrency(taxData.total_impots)}</span>
                          </div>
                        </div>
                        <Button onClick={() => navigate("/simulateur-impots")} variant="outline" size="sm" className="w-full mt-4">
                          Modifier la simulation
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Calculator className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">Aucune simulation d'impôts</p>
                        <Button onClick={() => navigate("/simulateur-impots")} size="sm" className="w-full">
                          Lancer une simulation
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={mobileAssurancesOpen} onOpenChange={setMobileAssurancesOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Assurances</CardTitle>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${mobileAssurancesOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Aucune assurance enregistrée</p>
                    <Button onClick={() => navigate("/comparateur")} className="mt-4 w-full" size="sm">
                      Comparer les assurances
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={mobileDocumentsOpen} onOpenChange={setMobileDocumentsOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Documents</CardTitle>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${mobileDocumentsOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-start gap-3 p-3 rounded-lg border"
                          >
                            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.file_name}</p>
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
                                <span className="capitalize">{doc.category}</span>
                                {doc.subcategory && <span>{doc.subcategory}</span>}
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>{formatDate(doc.uploaded_at)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucun document</p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Version Desktop - Tabs */}
          <Tabs defaultValue="informations" className="hidden md:block space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="informations">
                <User className="h-4 w-4 mr-2" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="budget">
                <Wallet className="h-4 w-4 mr-2" />
                Budget
              </TabsTrigger>
              <TabsTrigger value="prevoyance">
                <Wallet className="h-4 w-4 mr-2" />
                Prévoyance & Retraite
              </TabsTrigger>
              <TabsTrigger value="impots">
                <Calculator className="h-4 w-4 mr-2" />
                Impôts
              </TabsTrigger>
              <TabsTrigger value="assurances">
                <Shield className="h-4 w-4 mr-2" />
                Assurances
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Informations personnelles */}
            <TabsContent value="informations">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Informations personnelles</CardTitle>
                    <CardDescription>
                      Vos données d'identification et coordonnées
                    </CardDescription>
                  </div>
                  {!editingProfile ? (
                    <Button onClick={() => setEditingProfile(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  ) : (
                    <Button onClick={() => setEditingProfile(false)} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {editingProfile ? (
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="appellation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Appellation</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Monsieur">Monsieur</SelectItem>
                                    <SelectItem value="Madame">Madame</SelectItem>
                                    <SelectItem value="Autre">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="nom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="prenom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="date_naissance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date de naissance</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="localite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Localité</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="adresse"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adresse</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="telephone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Téléphone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" className="w-full md:w-auto">
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profile && (
                        <>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Appellation</h3>
                            <p className="text-foreground">{profile.appellation}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Nom</h3>
                            <p className="text-foreground">{profile.nom}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Prénom</h3>
                            <p className="text-foreground">{profile.prenom}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                            <p className="text-foreground">{profile.email}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</h3>
                            <p className="text-foreground">{formatDate(profile.date_naissance)}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Localité</h3>
                            <p className="text-foreground">{profile.localite}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Adresse</h3>
                            <p className="text-foreground">{profile.adresse || "Non renseignée"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Téléphone</h3>
                            <p className="text-foreground">{profile.telephone || "Non renseigné"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">État civil</h3>
                            <p className="text-foreground">
                              {prevoyanceData.etat_civil 
                                ? prevoyanceData.etat_civil === "celibataire" ? "Célibataire"
                                  : prevoyanceData.etat_civil === "marie" ? "Marié(e)"
                                  : prevoyanceData.etat_civil === "divorce" ? "Divorcé(e)"
                                  : prevoyanceData.etat_civil === "veuf" ? "Veuf/Veuve"
                                  : prevoyanceData.etat_civil
                                : "Non renseigné"}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Nombre d'enfants</h3>
                            <p className="text-foreground">{prevoyanceData.nombre_enfants || 0}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget */}
            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Budget personnel</CardTitle>
                    <CardDescription>
                      Données enregistrées en {budgetData.period_type}
                    </CardDescription>
                  </div>
                  {!editingBudget ? (
                    <Button onClick={() => {
                      setEditingBudget(true);
                      // Réinitialiser avec les valeurs converties selon displayPeriodType
                      const formValues = {
                        ...budgetData,
                        period_type: displayPeriodType,
                        revenu_brut: convertValue(budgetData.revenu_brut),
                        charges_sociales: convertValue(budgetData.charges_sociales),
                        depenses_logement: convertValue(budgetData.depenses_logement),
                        depenses_transport: convertValue(budgetData.depenses_transport),
                        depenses_alimentation: convertValue(budgetData.depenses_alimentation),
                        autres_depenses: convertValue(budgetData.autres_depenses),
                      };
                      budgetForm.reset(formValues);
                    }} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  ) : (
                    <Button onClick={() => {
                      setEditingBudget(false);
                      budgetForm.reset(budgetData);
                    }} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {editingBudget ? (
                    <Form {...budgetForm}>
                      <form onSubmit={budgetForm.handleSubmit(onSubmitBudget)} className="space-y-6">
                        <FormField
                          control={budgetForm.control}
                          name="period_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Période</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  const currentValues = budgetForm.getValues();
                                  const oldPeriodType = field.value;
                                  const newPeriodType = value as "mensuel" | "annuel";
                                  
                                  // Convertir les valeurs si la période change
                                  if (oldPeriodType !== newPeriodType) {
                                    const convertFormValue = (val: number) => {
                                      if (oldPeriodType === "mensuel" && newPeriodType === "annuel") {
                                        return val * 12;
                                      }
                                      if (oldPeriodType === "annuel" && newPeriodType === "mensuel") {
                                        return Math.round(val / 12);
                                      }
                                      return val;
                                    };
                                    
                                    budgetForm.setValue("revenu_brut", convertFormValue(currentValues.revenu_brut));
                                    budgetForm.setValue("charges_sociales", convertFormValue(currentValues.charges_sociales));
                                    budgetForm.setValue("depenses_logement", convertFormValue(currentValues.depenses_logement));
                                    budgetForm.setValue("depenses_transport", convertFormValue(currentValues.depenses_transport));
                                    budgetForm.setValue("depenses_alimentation", convertFormValue(currentValues.depenses_alimentation));
                                    budgetForm.setValue("autres_depenses", convertFormValue(currentValues.autres_depenses));
                                  }
                                  
                                  field.onChange(value);
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mensuel">Mensuel</SelectItem>
                                  <SelectItem value="annuel">Annuel</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Collapsible open={revenusOpen} onOpenChange={setRevenusOpen}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Revenus</h3>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className={`h-4 w-4 transition-transform ${revenusOpen ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={budgetForm.control}
                              name="revenu_brut"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Revenu brut</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={budgetForm.control}
                              name="charges_sociales"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Charges sociales</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          </CollapsibleContent>
                        </Collapsible>

                        <Separator />

                        <Collapsible open={depensesOpen} onOpenChange={setDepensesOpen}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Dépenses</h3>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className={`h-4 w-4 transition-transform ${depensesOpen ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={budgetForm.control}
                              name="depenses_logement"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Logement</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={budgetForm.control}
                              name="depenses_transport"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Transport</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={budgetForm.control}
                              name="depenses_alimentation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Alimentation</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={budgetForm.control}
                              name="autres_depenses"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Autres</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          </CollapsibleContent>
                        </Collapsible>

                        <div className="flex gap-2 mt-6">
                          <Button
                            onClick={() => setEditingBudget(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={budgetForm.formState.isSubmitting}
                          >
                            {budgetForm.formState.isSubmitting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Enregistrer
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Revenu brut</span>
                        <span className="font-medium">{formatCurrency(convertValue(budgetData.revenu_brut))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Charges sociales</span>
                        <span className="font-medium">- {formatCurrency(convertValue(budgetData.charges_sociales))}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Revenu net</span>
                        <span className="font-semibold text-amber-700">{formatCurrency(convertValue(revenuNet))}</span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Dépenses</h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Logement</span>
                          <span>{formatCurrency(convertValue(budgetData.depenses_logement))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Transport</span>
                          <span>{formatCurrency(convertValue(budgetData.depenses_transport))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Alimentation</span>
                          <span>{formatCurrency(convertValue(budgetData.depenses_alimentation))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Autres</span>
                          <span>{formatCurrency(convertValue(budgetData.autres_depenses))}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-semibold">Solde</span>
                        <span className={`font-bold text-lg ${soldeBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(convertValue(soldeBudget))}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prévoyance & Retraite */}
            <TabsContent value="prevoyance">
              <div className="space-y-4">
                {/* 1er Pilier AVS-AI */}
                <Card>
                  <Collapsible
                    open={openPrevoyanceCategories["1er_pilier"]}
                    onOpenChange={(open) =>
                      setOpenPrevoyanceCategories((prev) => ({ ...prev, "1er_pilier": open }))
                    }
                  >
                    <CardHeader>
                      <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`h-5 w-5 transition-transform ${
                              openPrevoyanceCategories["1er_pilier"] ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                          <div className="text-left">
                            <CardTitle>1er pilier AVS-AI</CardTitle>
                            <CardDescription>Assurance-vieillesse et survivants - Rentes calculées</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {editingPrevoyanceCategory !== "1er_pilier" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPrevoyanceCategory("1er_pilier");
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Modifier
                            </Button>
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        {editingPrevoyanceCategory === "1er_pilier" ? (
                          <Form {...prevoyanceForm}>
                            <form onSubmit={prevoyanceForm.handleSubmit(onSubmitPrevoyance)} className="space-y-6">
                              <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-sm">Revenu annuel déterminant</h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Utilisé pour le calcul des rentes AVS (Échelle 44 2025)
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold">
                                        {prevoyanceData.revenu_annuel_determinant
                                          ? formatCHF(prevoyanceData.revenu_annuel_determinant)
                                          : "Non calculé"}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={handleCalculateAVS}
                                    disabled={isCalculatingAVS}
                                    variant="secondary"
                                    className="w-full"
                                  >
                                    {isCalculatingAVS ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Calcul en cours...
                                      </>
                                    ) : (
                                      <>
                                        <Calculator className="mr-2 h-4 w-4" />
                                        Calculer mes rentes AVS
                                      </>
                                    )}
                                  </Button>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                  <h4 className="font-semibold">Rentes calculées</h4>
                                  
                                  <div className="grid gap-4">
                                    <div className="space-y-2">
                                      <h5 className="text-sm font-medium text-muted-foreground">Rente de vieillesse</h5>
                                      <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                          control={prevoyanceForm.control}
                                          name="rente_vieillesse_mensuelle"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">Mensuelle</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  step="1"
                                                  placeholder="0"
                                                  {...field}
                                                  value={field.value || 0}
                                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                  onFocus={(e) => e.target.select()}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={prevoyanceForm.control}
                                          name="rente_vieillesse_annuelle"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">Annuelle</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  step="1"
                                                  placeholder="0"
                                                  {...field}
                                                  value={field.value || 0}
                                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                  onFocus={(e) => e.target.select()}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <h5 className="text-sm font-medium text-muted-foreground">Rente d'invalidité</h5>
                                      <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                          control={prevoyanceForm.control}
                                          name="rente_invalidite_mensuelle"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">Mensuelle</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  step="1"
                                                  placeholder="0"
                                                  {...field}
                                                  value={field.value || 0}
                                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                  onFocus={(e) => e.target.select()}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={prevoyanceForm.control}
                                          name="rente_invalidite_annuelle"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">Annuelle</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  step="1"
                                                  placeholder="0"
                                                  {...field}
                                                  value={field.value || 0}
                                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                  onFocus={(e) => e.target.select()}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <p className="text-xs text-muted-foreground">
                                    💡 Ces montants sont calculés automatiquement selon l'Échelle 44 2025. 
                                    Vous pouvez les modifier manuellement si nécessaire.
                                  </p>
                                </div>

                                <Separator />

                                <FormField
                                  control={prevoyanceForm.control}
                                  name="avs_1er_pilier"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Cotisation AVS annuelle</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          placeholder="0"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setEditingPrevoyanceCategory(null);
                                    prevoyanceForm.reset(prevoyanceData);
                                  }}
                                  variant="outline"
                                  className="flex-1"
                                  type="button"
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="submit"
                                  className="flex-1"
                                  disabled={prevoyanceForm.formState.isSubmitting}
                                >
                                  {prevoyanceForm.formState.isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Enregistrer
                                </Button>
                              </div>
                            </form>
                          </Form>
                        ) : (
                          <div className="space-y-6">
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="font-semibold text-sm">Revenu annuel déterminant</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Base de calcul (Échelle 44 2025)
                                  </p>
                                </div>
                                <p className="text-lg font-bold">
                                  {prevoyanceData.revenu_annuel_determinant
                                    ? formatCHF(prevoyanceData.revenu_annuel_determinant)
                                    : "—"}
                                </p>
                              </div>
                              {!prevoyanceData.revenu_annuel_determinant && (
                                <Button
                                  type="button"
                                  onClick={handleCalculateAVS}
                                  disabled={isCalculatingAVS}
                                  variant="secondary"
                                  size="sm"
                                  className="w-full"
                                >
                                  {isCalculatingAVS ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Calcul en cours...
                                    </>
                                  ) : (
                                    <>
                                      <Calculator className="mr-2 h-4 w-4" />
                                      Calculer mes rentes AVS
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>

                            <div className="grid gap-6">
                              <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                  Rente de vieillesse
                                  {prevoyanceData.rente_vieillesse_mensuelle && prevoyanceData.rente_vieillesse_mensuelle > 0 ? (
                                    <span className="text-xs text-muted-foreground font-normal">(à l'âge de la retraite)</span>
                                  ) : null}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-background border rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Mensuelle</p>
                                    <p className="text-xl font-bold">
                                      {prevoyanceData.rente_vieillesse_mensuelle
                                        ? formatCHF(prevoyanceData.rente_vieillesse_mensuelle)
                                        : "—"}
                                    </p>
                                  </div>
                                  <div className="p-3 bg-background border rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Annuelle</p>
                                    <p className="text-xl font-bold">
                                      {prevoyanceData.rente_vieillesse_annuelle
                                        ? formatCHF(prevoyanceData.rente_vieillesse_annuelle)
                                        : "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                  Rente d'invalidité
                                  {prevoyanceData.rente_invalidite_mensuelle && prevoyanceData.rente_invalidite_mensuelle > 0 ? (
                                    <span className="text-xs text-muted-foreground font-normal">(en cas d'invalidité)</span>
                                  ) : null}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-background border rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Mensuelle</p>
                                    <p className="text-xl font-bold">
                                      {prevoyanceData.rente_invalidite_mensuelle
                                        ? formatCHF(prevoyanceData.rente_invalidite_mensuelle)
                                        : "—"}
                                    </p>
                                  </div>
                                  <div className="p-3 bg-background border rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Annuelle</p>
                                    <p className="text-xl font-bold">
                                      {prevoyanceData.rente_invalidite_annuelle
                                        ? formatCHF(prevoyanceData.rente_invalidite_annuelle)
                                        : "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Cotisation AVS annuelle</p>
                              <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.avs_1er_pilier)}</p>
                            </div>

                            {prevoyanceData.rente_vieillesse_mensuelle && prevoyanceData.rente_vieillesse_mensuelle > 0 && (
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                  💡 Les rentes sont calculées selon l'Échelle 44 2025 pour une carrière complète. 
                                  Les montants réels peuvent varier selon vos années de cotisation, splitting, etc.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* 2ème Pilier LPP */}
                <Card>
                  <Collapsible
                    open={openPrevoyanceCategories["2eme_pilier"]}
                    onOpenChange={(open) =>
                      setOpenPrevoyanceCategories((prev) => ({ ...prev, "2eme_pilier": open }))
                    }
                  >
                    <CardHeader>
                      <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`h-5 w-5 transition-transform ${
                              openPrevoyanceCategories["2eme_pilier"] ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                          <div className="text-left">
                            <CardTitle>2ème pilier LPP</CardTitle>
                            <CardDescription>Prévoyance professionnelle - Certificat de caisse de pension</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {editingPrevoyanceCategory !== "2eme_pilier" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPrevoyanceCategory("2eme_pilier");
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Modifier
                            </Button>
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        {/* LPP Certificate Import Banner */}
                        {lppCertificate && lppCertificate.extracted_data && editingPrevoyanceCategory !== "2eme_pilier" && (
                          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <FileText className="h-5 w-5 text-primary mt-0.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm mb-1">💡 Certificat LPP détecté !</p>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Un certificat de prévoyance a été analysé dans vos documents ({lppCertificate.file_name} du{" "}
                                  {new Date(lppCertificate.uploaded_at).toLocaleDateString("fr-FR")}).
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => setShowImportConfirm(true)}
                                    size="sm"
                                    variant="default"
                                  >
                                    📋 Importer ces données
                                  </Button>
                                  <Button
                                    onClick={() => navigate('/documents')}
                                    size="sm"
                                    variant="outline"
                                  >
                                    👁️ Voir le certificat
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {editingPrevoyanceCategory === "2eme_pilier" ? (
                          <Form {...prevoyanceForm}>
                            <form onSubmit={prevoyanceForm.handleSubmit(onSubmitPrevoyance)} className="space-y-6">
                              {/* Avoir actuel */}
                              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                  📄 Avoir de vieillesse actuel
                                </h3>
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_avoir_vieillesse"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Avoir de vieillesse (CHF)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_derniere_maj"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Date de dernière mise à jour</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Prestations vieillesse projetées */}
                              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                  👴 Prestations de vieillesse projetées
                                </h3>
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_capital_projete_65"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Capital projeté à 65 ans (CHF)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_rente_mensuelle_projetee"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rente mensuelle projetée (CHF/mois)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            field.onChange(value);
                                            // Auto-calculer l'annuelle
                                            prevoyanceForm.setValue("lpp_rente_annuelle_projetee", value * 12);
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_rente_annuelle_projetee"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rente annuelle projetée (CHF/an)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            field.onChange(value);
                                            // Auto-calculer la mensuelle
                                            prevoyanceForm.setValue("lpp_rente_mensuelle_projetee", value / 12);
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Prestations invalidité */}
                              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                  🏥 Prestations d'invalidité
                                </h3>
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_rente_invalidite_mensuelle"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rente mensuelle (CHF/mois)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            field.onChange(value);
                                            // Auto-calculer l'annuelle
                                            prevoyanceForm.setValue("lpp_rente_invalidite_annuelle", value * 12);
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_rente_invalidite_annuelle"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rente annuelle (CHF/an)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            field.onChange(value);
                                            // Auto-calculer la mensuelle
                                            prevoyanceForm.setValue("lpp_rente_invalidite_mensuelle", value / 12);
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_capital_invalidite"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Capital invalidité (CHF)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Prestations décès */}
                              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                  💔 Prestations en cas de décès
                                </h3>
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_rente_conjoint_survivant"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rente conjoint survivant (CHF/mois)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_rente_orphelins"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rente orphelins (CHF/mois)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_capital_deces"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Capital décès (CHF)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Cotisation annuelle (champ existant) */}
                              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                                <h3 className="font-semibold text-sm">💰 Cotisation annuelle</h3>
                                <FormField
                                  control={prevoyanceForm.control}
                                  name="lpp_2eme_pilier"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Cotisation LPP annuelle (CHF)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button
                                  onClick={() => {
                                    setEditingPrevoyanceCategory(null);
                                    prevoyanceForm.reset(prevoyanceData);
                                  }}
                                  variant="outline"
                                  className="flex-1"
                                  type="button"
                                >
                                  Annuler
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loadingData}>
                                  {loadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sauvegarder"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        ) : (
                          <div className="space-y-6">
                            {/* Avoir actuel */}
                            {(prevoyanceData.lpp_avoir_vieillesse || prevoyanceData.lpp_derniere_maj) && (
                              <div className="p-4 rounded-lg bg-muted/30">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                  📄 Avoir de vieillesse actuel
                                </h3>
                                {prevoyanceData.lpp_avoir_vieillesse && (
                                  <p className="text-2xl font-bold mb-2">{formatCurrency(prevoyanceData.lpp_avoir_vieillesse)}</p>
                                )}
                                {prevoyanceData.lpp_derniere_maj && (
                                  <p className="text-sm text-muted-foreground">
                                    Dernière mise à jour: {new Date(prevoyanceData.lpp_derniere_maj).toLocaleDateString('fr-CH')}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Prestations vieillesse */}
                            {(prevoyanceData.lpp_capital_projete_65 || prevoyanceData.lpp_rente_mensuelle_projetee) && (
                              <div className="p-4 rounded-lg bg-muted/30">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                  👴 Prestations de vieillesse projetées
                                </h3>
                                {prevoyanceData.lpp_capital_projete_65 && (
                                  <div className="mb-2">
                                    <p className="text-sm text-muted-foreground">Capital projeté à 65 ans</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_capital_projete_65)}</p>
                                  </div>
                                )}
                                {prevoyanceData.lpp_rente_mensuelle_projetee && (
                                  <div className="mb-2">
                                    <p className="text-sm text-muted-foreground">Rente mensuelle projetée</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_rente_mensuelle_projetee)}/mois</p>
                                  </div>
                                )}
                                {prevoyanceData.lpp_rente_annuelle_projetee && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Rente annuelle projetée</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_rente_annuelle_projetee)}/an</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Prestations invalidité */}
                            {(prevoyanceData.lpp_rente_invalidite_mensuelle || prevoyanceData.lpp_capital_invalidite) && (
                              <div className="p-4 rounded-lg bg-muted/30">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                  🏥 Prestations d'invalidité
                                </h3>
                                {prevoyanceData.lpp_rente_invalidite_mensuelle && (
                                  <div className="mb-2">
                                    <p className="text-sm text-muted-foreground">Rente mensuelle</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_rente_invalidite_mensuelle)}/mois</p>
                                  </div>
                                )}
                                {prevoyanceData.lpp_rente_invalidite_annuelle && (
                                  <div className="mb-2">
                                    <p className="text-sm text-muted-foreground">Rente annuelle</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_rente_invalidite_annuelle)}/an</p>
                                  </div>
                                )}
                                {prevoyanceData.lpp_capital_invalidite && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Capital</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_capital_invalidite)}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Prestations décès */}
                            {(prevoyanceData.lpp_rente_conjoint_survivant || prevoyanceData.lpp_capital_deces) && (
                              <div className="p-4 rounded-lg bg-muted/30">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                  💔 Prestations en cas de décès
                                </h3>
                                {prevoyanceData.lpp_rente_conjoint_survivant && (
                                  <div className="mb-2">
                                    <p className="text-sm text-muted-foreground">Rente conjoint survivant</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_rente_conjoint_survivant)}/mois</p>
                                  </div>
                                )}
                                {prevoyanceData.lpp_rente_orphelins && (
                                  <div className="mb-2">
                                    <p className="text-sm text-muted-foreground">Rente orphelins</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_rente_orphelins)}/mois</p>
                                  </div>
                                )}
                                {prevoyanceData.lpp_capital_deces && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Capital décès</p>
                                    <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_capital_deces)}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Cotisation annuelle */}
                            {prevoyanceData.lpp_2eme_pilier > 0 && (
                              <div className="p-4 rounded-lg bg-muted/30">
                                <h3 className="font-semibold text-sm mb-2">💰 Cotisation annuelle</h3>
                                <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.lpp_2eme_pilier)}/an</p>
                              </div>
                            )}

                            {/* Message si aucune donnée */}
                            {!prevoyanceData.lpp_avoir_vieillesse && 
                             !prevoyanceData.lpp_capital_projete_65 && 
                             !prevoyanceData.lpp_rente_invalidite_mensuelle && 
                             !prevoyanceData.lpp_rente_conjoint_survivant && 
                             prevoyanceData.lpp_2eme_pilier === 0 && (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                  💡 Retrouvez ces informations sur votre certificat de caisse de pension annuel
                                </p>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPrevoyanceCategory("2eme_pilier");
                                  }}
                                  variant="outline"
                                >
                                  Renseigner les données LPP
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* 3ème Pilier A/B */}
                <Card>
                  <Collapsible
                    open={openPrevoyanceCategories["3eme_pilier"]}
                    onOpenChange={(open) =>
                      setOpenPrevoyanceCategories((prev) => ({ ...prev, "3eme_pilier": open }))
                    }
                  >
                    <CardHeader>
                      <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`h-5 w-5 transition-transform ${
                              openPrevoyanceCategories["3eme_pilier"] ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                          <div className="text-left">
                            <CardTitle>3ème pilier A/B</CardTitle>
                            <CardDescription>Prévoyance privée</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold">
                            {formatCurrency(prevoyanceData.pilier_3a + prevoyanceData.pilier_3b)}
                          </span>
                          {editingPrevoyanceCategory !== "3eme_pilier" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPrevoyanceCategory("3eme_pilier");
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Modifier
                            </Button>
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        {editingPrevoyanceCategory === "3eme_pilier" ? (
                          <Form {...prevoyanceForm}>
                            <form onSubmit={prevoyanceForm.handleSubmit(onSubmitPrevoyance)} className="space-y-4">
                              <FormField
                                control={prevoyanceForm.control}
                                name="pilier_3a"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>3ème Pilier A</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="1"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={prevoyanceForm.control}
                                name="pilier_3b"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>3ème Pilier B</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="1"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setEditingPrevoyanceCategory(null);
                                    prevoyanceForm.reset(prevoyanceData);
                                  }}
                                  variant="outline"
                                  className="flex-1"
                                  type="button"
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="submit"
                                  className="flex-1"
                                  disabled={prevoyanceForm.formState.isSubmitting}
                                >
                                  {prevoyanceForm.formState.isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Enregistrer
                                </Button>
                              </div>
                            </form>
                          </Form>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">3ème Pilier A</p>
                              <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.pilier_3a)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">3ème Pilier B</p>
                              <p className="text-xl font-semibold">{formatCurrency(prevoyanceData.pilier_3b)}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Total Prévoyance Card */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-2xl">Total prévoyance</CardTitle>
                    <CardDescription>Somme de tous les piliers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-primary">{formatCurrency(totalPrevoyance)}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Impôts */}
            <TabsContent value="impots">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Données fiscales</CardTitle>
                    <CardDescription>
                      Informations de votre simulation d'impôts
                    </CardDescription>
                  </div>
                  {taxData && !editingTax && (
                    <Button variant="outline" size="sm" onClick={() => setEditingTax(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {taxData ? (
                    editingTax ? (
                      <Form {...taxForm}>
                        <form onSubmit={taxForm.handleSubmit(onSubmitTax)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={taxForm.control}
                              name="canton"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Canton de résidence</FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      setCommunesDisponibles(communesParCanton[value] || []);
                                      taxForm.setValue("commune", "");
                                    }} 
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez un canton" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background z-50">
                                      {cantons.map((canton) => (
                                        <SelectItem key={canton.value} value={canton.value}>
                                          {canton.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taxForm.control}
                              name="commune"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Commune de résidence</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                    disabled={!selectedCanton}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez une commune" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background z-50">
                                      {communesDisponibles.map((commune) => (
                                        <SelectItem key={commune.value} value={commune.value}>
                                          {commune.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={taxForm.control}
                              name="etat_civil"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>État civil</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background z-50">
                                      <SelectItem value="celibataire">Célibataire</SelectItem>
                                      <SelectItem value="marie">Marié(e)</SelectItem>
                                      <SelectItem value="parent">Parent seul avec enfants</SelectItem>
                                      <SelectItem value="divorce">Divorcé(e)</SelectItem>
                                      <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taxForm.control}
                              name="confession"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confession</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "aucune"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Aucune" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background z-50">
                                      <SelectItem value="aucune">Aucune</SelectItem>
                                      <SelectItem value="catholique">Catholique romaine</SelectItem>
                                      <SelectItem value="protestant">Protestante / Réformée évangélique</SelectItem>
                                      <SelectItem value="catholique-chretien">Catholique-chrétienne</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={taxForm.control}
                              name="revenu_annuel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Revenu annuel (CHF)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taxForm.control}
                              name="fortune"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Fortune (CHF)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={taxForm.control}
                              name="nombre_enfants"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombre d'enfants</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taxForm.control}
                              name="charges_sociales"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Charges sociales (CHF)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={taxForm.control}
                              name="deduction_3eme_pilier"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>3ème pilier A (CHF)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taxForm.control}
                              name="interets_hypothecaires"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Intérêts hypothécaires (CHF)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={taxForm.control}
                            name="autres_deductions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Autres déductions (CHF)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingTax(false);
                                taxForm.reset();
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                            <Button type="submit">
                              <Save className="h-4 w-4 mr-2" />
                              Enregistrer
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Canton</span>
                              <span className="font-medium">{taxData.canton}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Commune</span>
                              <span className="font-medium">{taxData.commune}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">État civil</span>
                              <span className="font-medium capitalize">{taxData.etat_civil}</span>
                            </div>
                            {taxData.confession && taxData.confession !== "aucune" && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confession</span>
                                <span className="font-medium capitalize">{taxData.confession}</span>
                              </div>
                            )}
                            {taxData.nombre_enfants > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Nombre d'enfants</span>
                                <span className="font-medium">{taxData.nombre_enfants}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Revenus et déductions</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Revenu annuel</span>
                              <span className="font-medium">CHF {taxData.revenu_annuel.toLocaleString()}</span>
                            </div>
                            {taxData.fortune > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fortune</span>
                                <span className="font-medium">CHF {taxData.fortune.toLocaleString()}</span>
                              </div>
                            )}
                            {taxData.charges_sociales > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Charges sociales</span>
                                <span className="font-medium">CHF {taxData.charges_sociales.toLocaleString()}</span>
                              </div>
                            )}
                            {taxData.deduction_3eme_pilier > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">3ème pilier A</span>
                                <span className="font-medium">CHF {taxData.deduction_3eme_pilier.toLocaleString()}</span>
                              </div>
                            )}
                            {taxData.interets_hypothecaires > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Intérêts hypothécaires</span>
                                <span className="font-medium">CHF {taxData.interets_hypothecaires.toLocaleString()}</span>
                              </div>
                            )}
                            {taxData.autres_deductions > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Autres déductions</span>
                                <span className="font-medium">CHF {taxData.autres_deductions.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Calcul des impôts</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Impôt fédéral direct</span>
                            <span className="font-medium">CHF {taxData.impot_federal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Impôt cantonal</span>
                            <span className="font-medium">CHF {taxData.impot_cantonal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Impôt communal</span>
                            <span className="font-medium">CHF {taxData.impot_communal.toLocaleString()}</span>
                          </div>
                          {taxData.impot_ecclesiastique > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Impôt ecclésiastique</span>
                              <span className="font-medium">CHF {taxData.impot_ecclesiastique.toLocaleString()}</span>
                            </div>
                          )}
                          {taxData.impot_fortune > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Impôt sur la fortune</span>
                              <span className="font-medium">CHF {taxData.impot_fortune.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="bg-primary/10 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total des impôts</span>
                          <span className="font-bold text-2xl text-primary">
                            CHF {taxData.total_impots.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="text-muted-foreground">Taux effectif</span>
                          <span className="font-semibold">
                            {((taxData.total_impots / taxData.revenu_annuel) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
                        <span>Dernière mise à jour: {new Date(taxData.updated_at).toLocaleDateString("fr-CH")}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate("/simulateur-impots")}
                        >
                          Mettre à jour
                        </Button>
                      </div>
                    </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Aucune simulation d'impôts enregistrée
                      </p>
                      <Button onClick={() => navigate("/simulateur-impots")}>
                        Effectuer une simulation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assurances */}
            <TabsContent value="assurances">
              <Card>
                <CardHeader>
                  <CardTitle>Mes assurances</CardTitle>
                  <CardDescription>
                    Gérez vos contrats d'assurance et comparaisons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Aucune assurance enregistrée pour le moment
                      </p>
                      <Button onClick={() => navigate("/comparateur")}>
                        Comparer les assurances
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Mes documents</CardTitle>
                  <CardDescription>
                    {documents.length} document{documents.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="flex items-center space-x-4">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="capitalize">{doc.category}</span>
                                {doc.subcategory && (
                                  <>
                                    <span>•</span>
                                    <span>{doc.subcategory}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>•</span>
                                <span>{formatDate(doc.uploaded_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun document</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importer les données du certificat LPP ?</DialogTitle>
            <DialogDescription>
              Les données suivantes seront importées dans votre profil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lppCertificate?.extracted_data && (
              <div className="space-y-2 text-sm">
                {lppCertificate.extracted_data.avoir_vieillesse && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Avoir vieillesse:</span>
                    <span className="font-semibold">CHF {lppCertificate.extracted_data.avoir_vieillesse.toLocaleString('fr-CH')}</span>
                  </div>
                )}
                {lppCertificate.extracted_data.capital_projete_65 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Capital projeté 65 ans:</span>
                    <span className="font-semibold">CHF {lppCertificate.extracted_data.capital_projete_65.toLocaleString('fr-CH')}</span>
                  </div>
                )}
                {lppCertificate.extracted_data.rente_mensuelle_projetee && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Rente mensuelle projetée:</span>
                    <span className="font-semibold">CHF {lppCertificate.extracted_data.rente_mensuelle_projetee.toLocaleString('fr-CH')}/mois</span>
                  </div>
                )}
                {lppCertificate.extracted_data.rente_invalidite_mensuelle && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Rente invalidité mensuelle:</span>
                    <span className="font-semibold">CHF {lppCertificate.extracted_data.rente_invalidite_mensuelle.toLocaleString('fr-CH')}/mois</span>
                  </div>
                )}
                {lppCertificate.extracted_data.capital_invalidite && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Capital invalidité:</span>
                    <span className="font-semibold">CHF {lppCertificate.extracted_data.capital_invalidite.toLocaleString('fr-CH')}</span>
                  </div>
                )}
                {lppCertificate.extracted_data.capital_deces && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Capital décès:</span>
                    <span className="font-semibold">CHF {lppCertificate.extracted_data.capital_deces.toLocaleString('fr-CH')}</span>
                  </div>
                )}
                {lppCertificate.extracted_data.date_certificat && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Date du certificat:</span>
                    <span className="font-semibold">{new Date(lppCertificate.extracted_data.date_certificat).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                ⚠️ Cela remplacera vos données actuelles du 2ème pilier. Vous pourrez les vérifier et les modifier avant de sauvegarder.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportConfirm(false)}>
              Annuler
            </Button>
            <Button onClick={handleImportLppData}>
              Confirmer l'import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default UserProfile;
