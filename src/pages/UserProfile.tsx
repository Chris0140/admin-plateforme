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
import { User, Wallet, Calculator, FileText, Loader2, Edit, Save, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  avs_1er_pilier: number;
  lpp_2eme_pilier: number;
  pilier_3a: number;
  pilier_3b: number;
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
  avs_1er_pilier: z.number().min(0, "Le montant doit être positif"),
  lpp_2eme_pilier: z.number().min(0, "Le montant doit être positif"),
  pilier_3a: z.number().min(0, "Le montant doit être positif"),
  pilier_3b: z.number().min(0, "Le montant doit être positif"),
});

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
  const [displayPeriodType, setDisplayPeriodType] = useState<"mensuel" | "annuel">("mensuel");
  const [budgetData, setBudgetData] = useState<BudgetData>({
    period_type: "mensuel",
    revenu_brut: 0,
    charges_sociales: 0,
    depenses_logement: 0,
    depenses_transport: 0,
    depenses_alimentation: 0,
    autres_depenses: 0,
    avs_1er_pilier: 0,
    lpp_2eme_pilier: 0,
    pilier_3a: 0,
    pilier_3b: 0,
  });

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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
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
          avs_1er_pilier: Number(budgetDataResult.avs_1er_pilier),
          lpp_2eme_pilier: Number(budgetDataResult.lpp_2eme_pilier),
          pilier_3a: Number(budgetDataResult.pilier_3a),
          pilier_3b: Number(budgetDataResult.pilier_3b),
        };
        setBudgetData(budget);
        setDisplayPeriodType(budget.period_type);
        budgetForm.reset(budget);
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
        avs_1er_pilier: values.avs_1er_pilier,
        lpp_2eme_pilier: values.lpp_2eme_pilier,
        pilier_3a: values.pilier_3a,
        pilier_3b: values.pilier_3b,
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
    budgetData.avs_1er_pilier +
    budgetData.lpp_2eme_pilier +
    budgetData.pilier_3a +
    budgetData.pilier_3b;

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

          <Tabs defaultValue="informations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="informations">
                <User className="h-4 w-4 mr-2" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="budget">
                <Wallet className="h-4 w-4 mr-2" />
                Budget
              </TabsTrigger>
              <TabsTrigger value="impots">
                <Calculator className="h-4 w-4 mr-2" />
                Impôts
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

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Revenus</h3>
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
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Dépenses</h3>
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
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Prévoyance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={budgetForm.control}
                              name="avs_1er_pilier"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>1er Pilier</FormLabel>
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
                              name="lpp_2eme_pilier"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>2ème Pilier</FormLabel>
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
                              control={budgetForm.control}
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
                          </div>
                        </div>

                        <Button type="submit" className="w-full md:w-auto">
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-end mb-4">
                        <ToggleGroup 
                          type="single" 
                          value={displayPeriodType}
                          onValueChange={(value) => value && setDisplayPeriodType(value as "mensuel" | "annuel")}
                        >
                          <ToggleGroupItem value="mensuel">Mensuel</ToggleGroupItem>
                          <ToggleGroupItem value="annuel">Annuel</ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Revenus</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Revenu brut</p>
                            <p className="text-xl font-semibold">{formatCurrency(displayData.revenu_brut)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Charges sociales</p>
                            <p className="text-xl font-semibold">{formatCurrency(displayData.charges_sociales)}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">Revenu net</p>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(revenuNet)}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Dépenses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Logement</p>
                            <p className="text-xl font-semibold">{formatCurrency(displayData.depenses_logement)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Transport</p>
                            <p className="text-xl font-semibold">{formatCurrency(displayData.depenses_transport)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Alimentation</p>
                            <p className="text-xl font-semibold">{formatCurrency(displayData.depenses_alimentation)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Autres</p>
                            <p className="text-xl font-semibold">{formatCurrency(displayData.autres_depenses)}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalDepenses)}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Solde</p>
                        <p className={`text-3xl font-bold ${soldeBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(soldeBudget)}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Prévoyance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">1er Pilier</p>
                            <p className="text-xl font-semibold">{formatCurrency(budgetData.avs_1er_pilier)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">2ème Pilier</p>
                            <p className="text-xl font-semibold">{formatCurrency(budgetData.lpp_2eme_pilier)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">3ème Pilier A</p>
                            <p className="text-xl font-semibold">{formatCurrency(budgetData.pilier_3a)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">3ème Pilier B</p>
                            <p className="text-xl font-semibold">{formatCurrency(budgetData.pilier_3b)}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrevoyance)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Impôts */}
            <TabsContent value="impots">
              <Card>
                <CardHeader>
                  <CardTitle>Données fiscales</CardTitle>
                  <CardDescription>
                    Résultat de votre dernière simulation d'impôts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {taxData ? (
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
      <Footer />
    </div>
  );
};

export default UserProfile;
