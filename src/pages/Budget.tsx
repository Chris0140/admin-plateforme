import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Save, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type BudgetMode = "mensuel" | "annuel" | "yearly-detailed";

const months = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

const Budget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  
  const [mode, setMode] = useState<BudgetMode>("mensuel");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  
  // Yearly detailed data
  const [yearlyData, setYearlyData] = useState<any[]>([]);

  // Mode mensuel states
  const [resteMoisPrecedent, setResteMoisPrecedent] = useState("");
  const [salaireNet, setSalaireNet] = useState("");
  const [autresRevenus, setAutresRevenus] = useState("");
  const [depensesVariables, setDepensesVariables] = useState("");
  const [fraisFixesDettes, setFraisFixesDettes] = useState("");
  const [assurances, setAssurances] = useState("");
  const [epargneInvest, setEpargneInvest] = useState("");

  // Mode annuel states
  const [revenuBrutAnnuel, setRevenuBrutAnnuel] = useState("");
  const [chargesSocialesAnnuel, setChargesSocialesAnnuel] = useState("");
  const [depensesAnnuel, setDepensesAnnuel] = useState("");

  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseFrequency, setNewExpenseFrequency] = useState<"mensuel" | "annuel">("mensuel");

  // Monthly custom categories
  const [monthlyCategories, setMonthlyCategories] = useState<any[]>([]);
  const [showAddMonthlyCategory, setShowAddMonthlyCategory] = useState(false);
  const [newMonthlyCategoryName, setNewMonthlyCategoryName] = useState("");
  const [newMonthlyCategoryType, setNewMonthlyCategoryType] = useState("");
  const [newMonthlyCategoryAmount, setNewMonthlyCategoryAmount] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([selectedMonth]);

  const [revenusOpen, setRevenusOpen] = useState(true);
  const [depensesOpen, setDepensesOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (mode === "mensuel") {
      fetchMonthlyBudget();
      setSelectedMonths([selectedMonth]); // Reset selected months when changing month
    } else if (mode === "annuel") {
      fetchAnnualProjection();
    } else if (mode === "yearly-detailed") {
      fetchYearlyDetailed();
    }
  }, [user, mode, selectedYear, selectedMonth]);

  const fetchMonthlyBudget = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_monthly")
        .select("*")
        .eq("user_id", user?.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      // Load monthly categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("monthly_expense_categories")
        .select("*")
        .eq("user_id", user?.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .order("created_at", { ascending: false });

      if (categoriesError) throw categoriesError;
      if (categoriesData) setMonthlyCategories(categoriesData);

      if (data) {
        setResteMoisPrecedent(data.reste_mois_precedent?.toString() || "");
        setSalaireNet(data.salaire_net?.toString() || "");
        setAutresRevenus(data.autres_revenus?.toString() || "");
        setDepensesVariables(data.depenses_variables?.toString() || "");
        setFraisFixesDettes(data.frais_fixes_dettes?.toString() || "");
        setAssurances(data.assurances?.toString() || "");
        setEpargneInvest(data.epargne_investissements?.toString() || "");
      } else {
        setResteMoisPrecedent("");
        setSalaireNet("");
        setAutresRevenus("");
        setDepensesVariables("");
        setFraisFixesDettes("");
        setAssurances("");
        setEpargneInvest("");
      }
    } catch (err) {
      console.error("Erreur chargement budget mensuel:", err);
    }
  };

  const fetchYearlyDetailed = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_monthly")
        .select("*")
        .eq("user_id", user?.id)
        .eq("year", selectedYear)
        .order("month", { ascending: true });

      if (error) throw error;
      setYearlyData(data || []);
    } catch (err) {
      console.error("Erreur chargement année détaillée:", err);
    }
  };

  const fetchAnnualProjection = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_data")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      const { data: expensesData, error: expensesError } = await supabase
        .from("fixed_expenses")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (expensesError) throw expensesError;
      if (expensesData) setFixedExpenses(expensesData);

      if (data) {
        setRevenuBrutAnnuel(data.revenu_brut_annuel?.toString() || "");
        setChargesSocialesAnnuel(data.charges_sociales_annuel?.toString() || "");
        setDepensesAnnuel(data.autres_depenses_annuel?.toString() || "");
      } else {
        setRevenuBrutAnnuel("");
        setChargesSocialesAnnuel("");
        setDepensesAnnuel("");
      }
    } catch (err) {
      console.error("Erreur chargement projection annuelle:", err);
    }
  };

  const saveMonthlyBudget = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erreur", description: "Vous devez être connecté" });
      return;
    }

    setIsLoading(true);
    try {
      const reste = parseFloat(resteMoisPrecedent) || 0;
      const salaire = parseFloat(salaireNet) || 0;
      const autres = parseFloat(autresRevenus) || 0;

      const totalRevenus = salaire + autres;
      const totalSorties = mCategoriesTotal;
      const totalRestant = reste + totalRevenus - totalSorties;

      const { error } = await supabase.from("budget_monthly").upsert({
        user_id: user.id,
        year: selectedYear,
        month: selectedMonth,
        reste_mois_precedent: reste,
        salaire_net: salaire,
        autres_revenus: autres,
        depenses_variables: 0,
        frais_fixes_dettes: 0,
        assurances: 0,
        epargne_investissements: 0,
        total_revenus: totalRevenus,
        total_sorties: totalSorties,
        total_restant: totalRestant,
      }, { onConflict: "user_id,year,month" });

      if (error) throw error;
      toast({ title: "Budget mensuel sauvegardé" });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnnualProjection = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erreur", description: "Vous devez être connecté" });
      return;
    }

    setIsLoading(true);
    try {
      const revenu = parseFloat(revenuBrutAnnuel) || 0;
      const charges = parseFloat(chargesSocialesAnnuel) || 0;
      const depenses = parseFloat(depensesAnnuel) || 0;

      const { data: existing } = await supabase
        .from("budget_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        period_type: "annuel",
        revenu_brut: revenu,
        charges_sociales: charges,
        depenses_logement: 0,
        depenses_transport: 0,
        depenses_alimentation: 0,
        autres_depenses: depenses,
        revenu_brut_annuel: revenu,
        charges_sociales_annuel: charges,
        depenses_logement_annuel: 0,
        depenses_transport_annuel: 0,
        depenses_alimentation_annuel: 0,
        autres_depenses_annuel: depenses,
        revenu_brut_mensuel: Math.round(revenu / 12),
        charges_sociales_mensuel: Math.round(charges / 12),
        depenses_logement_mensuel: 0,
        depenses_transport_mensuel: 0,
        depenses_alimentation_mensuel: 0,
        autres_depenses_mensuel: Math.round(depenses / 12),
      };

      if (existing) {
        const { error } = await supabase.from("budget_data").update(payload).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budget_data").insert(payload);
        if (error) throw error;
      }

      toast({ title: "Projection annuelle sauvegardée" });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder" });
    } finally {
      setIsLoading(false);
    }
  };

  const convertExpenseAmount = (amount: number, frequency: "mensuel" | "annuel") => {
    return frequency === "mensuel" ? amount * 12 : amount;
  };

  const annualRevenuNet = (parseFloat(revenuBrutAnnuel || "0") - parseFloat(chargesSocialesAnnuel || "0"));
  const annualFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + convertExpenseAmount(exp.amount, exp.frequency), 0);
  const annualTotalDepenses = 
    (parseFloat(depensesAnnuel || "0") || 0) +
    annualFixedExpenses;
  const annualSolde = annualRevenuNet - annualTotalDepenses;

  const mReste = parseFloat(resteMoisPrecedent || "0") || 0;
  const mSalaire = parseFloat(salaireNet || "0") || 0;
  const mAutres = parseFloat(autresRevenus || "0") || 0;
  
  const mCategoriesTotal = monthlyCategories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0);

  const mTotalRevenus = mSalaire + mAutres;
  const mTotalSorties = mCategoriesTotal;
  const mTotalRestant = mReste + mTotalRevenus - mTotalSorties;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(isNaN(value) ? 0 : value);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">Gestion de Budget</h1>
          <p className="text-muted-foreground mb-8">
            Suivez votre budget <span className="font-semibold">mois par mois</span> ou faites une{" "}
            <span className="font-semibold">projection annuelle simple</span>.
          </p>

          <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full md:w-auto">
              <Button
                variant="default"
                onClick={() => setMode("annuel")}
                className={`w-full md:w-auto px-6 ${mode === "annuel" ? "" : "opacity-70"}`}
              >
                Projection annuelle simple
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => setMode("mensuel")}
                className={`px-6 ${mode === "mensuel" ? "" : "opacity-70"}`}
              >
                Suivi mensuel détaillé
              </Button>
              <Button
                variant="default"
                onClick={() => setMode("yearly-detailed")}
                className={`px-6 ${mode === "yearly-detailed" ? "" : "opacity-70"}`}
              >
                Année détaillée
              </Button>
            </div>
          </div>

          {mode === "mensuel" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="w-full md:w-1/2">
                  <Label>Année</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-1/2">
                  <Label>Mois</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Collapsible open={revenusOpen} onOpenChange={setRevenusOpen} className="md:contents">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Entrées</CardTitle>
                          <CardDescription>Reste + revenus du mois</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="md:hidden">
                            <ChevronDown className={`h-4 w-4 transition-transform ${revenusOpen ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="resteMoisPrecedent">Reste du mois précédent</Label>
                          <Input id="resteMoisPrecedent" type="number" value={resteMoisPrecedent} onChange={(e) => setResteMoisPrecedent(e.target.value)} placeholder="Ex: 500" />
                        </div>
                        <div>
                          <Label htmlFor="salaireNet">Salaire net</Label>
                          <Input id="salaireNet" type="number" value={salaireNet} onChange={(e) => setSalaireNet(e.target.value)} placeholder="Ex: 6'800" />
                        </div>
                        <div>
                          <Label htmlFor="autresRevenus">Autres revenus</Label>
                          <Input id="autresRevenus" type="number" value={autresRevenus} onChange={(e) => setAutresRevenus(e.target.value)} placeholder="Ex: 200" />
                        </div>
                        <div className="pt-4 border-t space-y-1">
                          <p className="text-sm text-muted-foreground">Total revenus du mois</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(mTotalRevenus)}</p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                <Collapsible open={depensesOpen} onOpenChange={setDepensesOpen} className="md:contents">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Sorties</CardTitle>
                          <CardDescription>Dépenses du mois</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="md:hidden">
                            <ChevronDown className={`h-4 w-4 transition-transform ${depensesOpen ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        {/* Catégories de dépenses */}
                        {monthlyCategories.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Catégories de dépenses</p>
                            {monthlyCategories.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{cat.name}</p>
                                  <p className="text-xs text-muted-foreground">{cat.category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {formatCurrency(parseFloat(cat.amount) || 0)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={async () => {
                                      try {
                                        await supabase
                                          .from("monthly_expense_categories")
                                          .delete()
                                          .eq("id", cat.id);
                                        setMonthlyCategories(monthlyCategories.filter((c) => c.id !== cat.id));
                                        toast({
                                          title: "Catégorie supprimée",
                                          description: "La catégorie a été supprimée avec succès",
                                        });
                                      } catch (error) {
                                        console.error(error);
                                        toast({
                                          variant: "destructive",
                                          title: "Erreur",
                                          description: "Impossible de supprimer la catégorie",
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulaire ajout catégorie */}
                        {showAddMonthlyCategory ? (
                          <div className="pt-4 border-t space-y-3">
                            <p className="text-sm font-medium">Nouvelle dépense</p>
                            <div>
                              <Label htmlFor="newMonthlyCategoryName">Nom</Label>
                              <Input
                                id="newMonthlyCategoryName"
                                placeholder="Ex: Loisirs"
                                value={newMonthlyCategoryName}
                                onChange={(e) => setNewMonthlyCategoryName(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="newMonthlyCategoryType">Type</Label>
                              <Input
                                id="newMonthlyCategoryType"
                                placeholder="Ex: Sorties"
                                value={newMonthlyCategoryType}
                                onChange={(e) => setNewMonthlyCategoryType(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="newMonthlyCategoryAmount">Montant (CHF)</Label>
                              <Input
                                id="newMonthlyCategoryAmount"
                                type="number"
                                placeholder="100"
                                value={newMonthlyCategoryAmount}
                                onChange={(e) => setNewMonthlyCategoryAmount(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label>Appliquer aux mois</Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedMonths.length === 12) {
                                      setSelectedMonths([selectedMonth]);
                                    } else {
                                      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
                                    }
                                  }}
                                >
                                  {selectedMonths.length === 12 ? "Désélectionner tout" : "Tous les mois"}
                                </Button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {months.map((m) => (
                                  <label
                                    key={m.value}
                                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedMonths.includes(m.value)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedMonths([...selectedMonths, m.value]);
                                        } else {
                                          setSelectedMonths(selectedMonths.filter((month) => month !== m.value));
                                        }
                                      }}
                                      className="rounded border-input"
                                    />
                                    <span className="text-sm">{m.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (!newMonthlyCategoryName || !newMonthlyCategoryAmount) {
                                    toast({
                                      variant: "destructive",
                                      title: "Erreur",
                                      description: "Veuillez remplir tous les champs",
                                    });
                                    return;
                                  }
                                  if (selectedMonths.length === 0) {
                                    toast({
                                      variant: "destructive",
                                      title: "Erreur",
                                      description: "Veuillez sélectionner au moins un mois",
                                    });
                                    return;
                                  }
                                  try {
                                    const insertPromises = selectedMonths.map((month) =>
                                      supabase
                                        .from("monthly_expense_categories")
                                        .insert({
                                          user_id: user?.id,
                                          year: selectedYear,
                                          month: month,
                                          name: newMonthlyCategoryName,
                                          category: newMonthlyCategoryType || "Autre",
                                          amount: parseFloat(newMonthlyCategoryAmount),
                                        })
                                    );

                                    await Promise.all(insertPromises);

                                    // Refresh current month categories if one of the selected months is current
                                    if (selectedMonths.includes(selectedMonth)) {
                                      await fetchMonthlyBudget();
                                    }

                                    setNewMonthlyCategoryName("");
                                    setNewMonthlyCategoryType("");
                                    setNewMonthlyCategoryAmount("");
                                    setSelectedMonths([selectedMonth]);
                                    setShowAddMonthlyCategory(false);
                                    toast({
                                      title: "Dépense ajoutée",
                                      description: `La dépense a été ajoutée à ${selectedMonths.length} mois`,
                                    });
                                  } catch (error) {
                                    console.error(error);
                                    toast({
                                      variant: "destructive",
                                      title: "Erreur",
                                      description: "Impossible d'ajouter la dépense",
                                    });
                                  }
                                }}
                              >
                                Ajouter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowAddMonthlyCategory(false);
                                  setNewMonthlyCategoryName("");
                                  setNewMonthlyCategoryType("");
                                  setNewMonthlyCategoryAmount("");
                                  setSelectedMonths([selectedMonth]);
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => setShowAddMonthlyCategory(true)}
                          >
                            <Plus className="h-4 w-4" />
                            Ajouter une dépense
                          </Button>
                        )}

                        <div className="pt-4 border-t space-y-1">
                          <p className="text-sm text-muted-foreground">Total sorties du mois</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(mTotalSorties)}</p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>

              {user && (
                <div className="flex justify-center items-center gap-4 mb-4">
                  <Button
                    onClick={() => {
                      if (selectedMonth === 1) {
                        setSelectedMonth(12);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    variant="outline"
                    size="icon"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button onClick={saveMonthlyBudget} disabled={isLoading} className="gap-2">
                    <Save className="h-4 w-4" />
                    Enregistrer le mois
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (selectedMonth === 12) {
                        setSelectedMonth(1);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    variant="outline"
                    size="icon"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>
                    Résumé du mois - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Reste mois précédent</p>
                      <p className="text-xl font-semibold">{formatCurrency(mReste)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total revenus</p>
                      <p className="text-xl font-semibold">{formatCurrency(mTotalRevenus)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total sorties</p>
                      <p className="text-xl font-semibold">{formatCurrency(mTotalSorties)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total restant</p>
                      <p className={`text-xl font-bold ${mTotalRestant >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(mTotalRestant)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {mode === "yearly-detailed" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Année {selectedYear}</h2>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenus annuels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_revenus || 0), 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dépenses annuelles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_sorties || 0), 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Solde annuel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${
                      yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif des mois de {selectedYear}</CardTitle>
                  <CardDescription>Données réelles enregistrées par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold text-sm">Mois</th>
                          <th className="text-right py-3 px-2 font-semibold text-sm">Revenus</th>
                          <th className="text-right py-3 px-2 font-semibold text-sm">Sorties</th>
                          <th className="text-right py-3 px-2 font-semibold text-sm">Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {months.map((month) => {
                          const monthData = yearlyData.find(d => d.month === month.value);
                          const revenus = monthData?.total_revenus || 0;
                          const sorties = monthData?.total_sorties || 0;
                          const solde = monthData?.total_restant || 0;
                          
                          return (
                            <tr key={month.value} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm">{month.label}</td>
                              <td className="text-right py-3 px-2 text-sm">{formatCurrency(revenus)}</td>
                              <td className="text-right py-3 px-2 text-sm">{formatCurrency(sorties)}</td>
                              <td className={`text-right py-3 px-2 text-sm font-semibold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(solde)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="font-bold border-t-2">
                          <td className="py-3 px-2 text-sm">Total</td>
                          <td className="text-right py-3 px-2 text-sm">
                            {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_revenus || 0), 0))}
                          </td>
                          <td className="text-right py-3 px-2 text-sm">
                            {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_sorties || 0), 0))}
                          </td>
                          <td className={`text-right py-3 px-2 text-sm ${
                            yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {mode === "annuel" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Collapsible open={revenusOpen} onOpenChange={setRevenusOpen} className="md:contents">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Revenus annuels</CardTitle>
                          <CardDescription>Projection sur l'année</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="md:hidden">
                            <ChevronDown className={`h-4 w-4 transition-transform ${revenusOpen ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="revenuBrutAnnuel">Revenu brut annuel</Label>
                          <Input id="revenuBrutAnnuel" type="number" value={revenuBrutAnnuel} onChange={(e) => setRevenuBrutAnnuel(e.target.value)} placeholder="Ex: 82'000" />
                        </div>
                        <div>
                          <Label htmlFor="chargesSocialesAnnuel">Charges sociales annuelles</Label>
                          <Input id="chargesSocialesAnnuel" type="number" value={chargesSocialesAnnuel} onChange={(e) => setChargesSocialesAnnuel(e.target.value)} placeholder="AVS, LPP, etc." />
                        </div>
                        <div className="pt-4 border-t space-y-1">
                          <p className="text-sm text-muted-foreground">Revenu net annuel</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(annualRevenuNet)}</p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                <Collapsible open={depensesOpen} onOpenChange={setDepensesOpen} className="md:contents">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Dépenses annuelles</CardTitle>
                          <CardDescription>Par grandes catégories</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="md:hidden">
                            <ChevronDown className={`h-4 w-4 transition-transform ${depensesOpen ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="depensesAnnuel">Dépenses (annuel)</Label>
                          <Input id="depensesAnnuel" type="number" value={depensesAnnuel} onChange={(e) => setDepensesAnnuel(e.target.value)} placeholder="Ex: 50'000" />
                        </div>

                        {fixedExpenses.length > 0 && (
                          <div className="pt-4 border-t space-y-3">
                            <p className="text-sm font-medium">Dépenses fixes additionnelles</p>
                            {fixedExpenses.map((exp) => (
                              <div key={exp.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{exp.name}</p>
                                  <p className="text-xs text-muted-foreground">{exp.category} ({exp.frequency})</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">{formatCurrency(convertExpenseAmount(exp.amount, exp.frequency))}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={async () => {
                                      try {
                                        await supabase.from("fixed_expenses").delete().eq("id", exp.id);
                                        setFixedExpenses(fixedExpenses.filter((e) => e.id !== exp.id));
                                        toast({ title: "Dépense supprimée" });
                                      } catch (err) {
                                        toast({ variant: "destructive", title: "Erreur" });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {showAddExpense ? (
                          <div className="pt-4 border-t space-y-3">
                            <p className="text-sm font-medium">Nouvelle dépense fixe</p>
                            <div><Label>Nom</Label><Input value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} placeholder="Ex: Netflix" /></div>
                            <div><Label>Catégorie</Label><Input value={newExpenseCategory} onChange={(e) => setNewExpenseCategory(e.target.value)} placeholder="Ex: Loisirs" /></div>
                            <div><Label>Montant</Label><Input type="number" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} /></div>
                            <div>
                              <Label>Fréquence</Label>
                              <Select value={newExpenseFrequency} onValueChange={(v) => setNewExpenseFrequency(v as "mensuel" | "annuel")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mensuel">Mensuel</SelectItem>
                                  <SelectItem value="annuel">Annuel</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={async () => {
                                if (!newExpenseName || !newExpenseAmount) {
                                  toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs" });
                                  return;
                                }
                                try {
                                  const { data } = await supabase.from("fixed_expenses").insert({
                                    user_id: user?.id,
                                    name: newExpenseName,
                                    category: newExpenseCategory || "Autre",
                                    amount: parseFloat(newExpenseAmount),
                                    frequency: newExpenseFrequency,
                                    is_active: true,
                                  }).select().single();
                                  if (data) setFixedExpenses([...fixedExpenses, data]);
                                  setNewExpenseName("");
                                  setNewExpenseCategory("");
                                  setNewExpenseAmount("");
                                  setNewExpenseFrequency("mensuel");
                                  setShowAddExpense(false);
                                  toast({ title: "Dépense ajoutée" });
                                } catch (err) {
                                  toast({ variant: "destructive", title: "Erreur" });
                                }
                              }}>Ajouter</Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setShowAddExpense(false);
                                setNewExpenseName("");
                                setNewExpenseCategory("");
                                setNewExpenseAmount("");
                              }}>Annuler</Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full gap-2 mt-2" onClick={() => setShowAddExpense(true)}>
                            <Plus className="h-4 w-4" />
                            Ajouter une dépense
                          </Button>
                        )}

                        <div className="pt-4 border-t space-y-1">
                          <p className="text-sm text-muted-foreground">Total des dépenses annuelles</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(annualTotalDepenses)}</p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>

              {user && (
                <div className="flex justify-center mb-4">
                  <Button onClick={saveAnnualProjection} disabled={isLoading} className="gap-2">
                    <Save className="h-4 w-4" />
                    Enregistrer la projection annuelle
                  </Button>
                </div>
              )}

              <Card>
                <CardHeader><CardTitle>Résumé annuel</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Revenu net annuel</p>
                      <p className="text-2xl font-bold">{formatCurrency(annualRevenuNet)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total dépenses annuelles</p>
                      <p className="text-2xl font-bold">{formatCurrency(annualTotalDepenses)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Solde annuel</p>
                      <p className={`text-2xl font-bold ${annualSolde >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(annualSolde)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Budget;
