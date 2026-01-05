import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ChevronDown, 
  Save, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type BudgetMode = "mensuel" | "annuel" | "yearly-detailed";

const months = [
  { value: 1, label: "Janvier", short: "Jan" },
  { value: 2, label: "Février", short: "Fév" },
  { value: 3, label: "Mars", short: "Mar" },
  { value: 4, label: "Avril", short: "Avr" },
  { value: 5, label: "Mai", short: "Mai" },
  { value: 6, label: "Juin", short: "Juin" },
  { value: 7, label: "Juillet", short: "Juil" },
  { value: 8, label: "Août", short: "Août" },
  { value: 9, label: "Septembre", short: "Sep" },
  { value: 10, label: "Octobre", short: "Oct" },
  { value: 11, label: "Novembre", short: "Nov" },
  { value: 12, label: "Décembre", short: "Déc" },
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
  const [salaireBrut, setSalaireBrut] = useState("");
  const [chargesSociales, setChargesSociales] = useState("");
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
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
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

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
      setSelectedMonths([selectedMonth]);
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
        const netSalary = data.salaire_net || 0;
        const brutEstimate = netSalary * 1.15;
        setSalaireBrut(brutEstimate.toString());
        setChargesSociales((brutEstimate - netSalary).toString());
        setAutresRevenus(data.autres_revenus?.toString() || "");
        setDepensesVariables(data.depenses_variables?.toString() || "");
        setFraisFixesDettes(data.frais_fixes_dettes?.toString() || "");
        setAssurances(data.assurances?.toString() || "");
        setEpargneInvest(data.epargne_investissements?.toString() || "");
      } else {
        setResteMoisPrecedent("");
        setSalaireNet("");
        setSalaireBrut("");
        setChargesSociales("");
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

  const annualRevenuNet = (parseFloat(revenuBrutAnnuel || "0") - parseFloat(chargesSocialesAnnuel || "0"));
  const annualFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
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

  const modeButtons = [
    { id: "mensuel" as BudgetMode, label: "Mensuel", icon: Calendar, description: "Suivi détaillé" },
    { id: "yearly-detailed" as BudgetMode, label: "Année", icon: TrendingUp, description: "Vue complète" },
    { id: "annuel" as BudgetMode, label: "Projection", icon: Sparkles, description: "Prévisionnel" },
  ];

  return (
    <AppLayout title="Budget" subtitle="Gérez vos finances avec précision">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Mode Switcher - Modern Pill Design */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
            {modeButtons.map((btn) => {
              const Icon = btn.icon;
              const isActive = mode === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setMode(btn.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Mode */}
        {mode === "mensuel" && (
          <div className="space-y-6 animate-fade-in">
            {/* Month/Year Selector - Compact Design */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 border border-border/50 hover:bg-primary/10 hover:border-primary/50"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-28 border-0 bg-transparent shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-20 border-0 bg-transparent shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 border border-border/50 hover:bg-primary/10 hover:border-primary/50"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Summary Cards - Top */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Report</p>
                    <p className="text-2xl font-bold">{formatCurrency(mReste)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenus</p>
                    <p className="text-2xl font-bold text-green-500">{formatCurrency(mTotalRevenus)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-green-500/10">
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dépenses</p>
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(mTotalSorties)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10">
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 bg-card border",
                mTotalRestant >= 0 
                  ? "border-green-500/30 hover:shadow-lg hover:shadow-green-500/10"
                  : "border-red-500/30 hover:shadow-lg hover:shadow-red-500/10"
              )}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Solde</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      mTotalRestant >= 0 ? "text-green-500" : "text-red-500"
                    )}>{formatCurrency(mTotalRestant)}</p>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    mTotalRestant >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    <PiggyBank className={cn(
                      "h-5 w-5",
                      mTotalRestant >= 0 ? "text-green-500" : "text-red-500"
                    )} />
                  </div>
                </div>
              </div>
            </div>

            {/* Input Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenus Card */}
              <Collapsible open={revenusOpen} onOpenChange={setRevenusOpen}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-green-500/10">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Entrées</CardTitle>
                          <CardDescription>Revenus du mois</CardDescription>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", revenusOpen && "rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label htmlFor="resteMoisPrecedent" className="text-sm text-muted-foreground">Report mois précédent</Label>
                        <Input 
                          id="resteMoisPrecedent" 
                          type="number" 
                          value={resteMoisPrecedent} 
                          onChange={(e) => setResteMoisPrecedent(e.target.value)} 
                          placeholder="0" 
                          className="bg-background/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Salaire net</Label>
                        <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start gap-2 bg-background/50 hover:bg-primary/10 border-dashed">
                              <Plus className="h-4 w-4 text-primary" />
                              {parseFloat(salaireNet) > 0 ? formatCurrency(parseFloat(salaireNet)) : "Ajouter salaire"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Détails du salaire</DialogTitle>
                              <DialogDescription>Entrez les détails de votre salaire</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="salaireBrut">Salaire brut</Label>
                                <Input
                                  id="salaireBrut"
                                  type="number"
                                  value={salaireBrut}
                                  onChange={(e) => {
                                    setSalaireBrut(e.target.value);
                                    const brut = parseFloat(e.target.value) || 0;
                                    const charges = parseFloat(chargesSociales) || 0;
                                    setSalaireNet((brut - charges).toString());
                                  }}
                                  placeholder="8000"
                                />
                              </div>
                              <div>
                                <Label htmlFor="chargesSociales">Charges sociales</Label>
                                <Input
                                  id="chargesSociales"
                                  type="number"
                                  value={chargesSociales}
                                  onChange={(e) => {
                                    setChargesSociales(e.target.value);
                                    const brut = parseFloat(salaireBrut) || 0;
                                    const charges = parseFloat(e.target.value) || 0;
                                    setSalaireNet((brut - charges).toString());
                                  }}
                                  placeholder="1200"
                                />
                              </div>
                              <div>
                                <Label htmlFor="salaireNetDialog">Salaire net</Label>
                                <Input
                                  id="salaireNetDialog"
                                  type="number"
                                  value={salaireNet}
                                  onChange={(e) => setSalaireNet(e.target.value)}
                                  placeholder="6800"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => setShowSalaryDialog(false)}>Enregistrer</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="autresRevenus" className="text-sm text-muted-foreground">Autres revenus</Label>
                        <Input 
                          id="autresRevenus" 
                          type="number" 
                          value={autresRevenus} 
                          onChange={(e) => setAutresRevenus(e.target.value)} 
                          placeholder="0" 
                          className="bg-background/50"
                        />
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Total revenus</p>
                          <p className="text-2xl font-bold text-green-500">{formatCurrency(mTotalRevenus)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Dépenses Card */}
              <Collapsible open={depensesOpen} onOpenChange={setDepensesOpen}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-red-500/10">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Sorties</CardTitle>
                          <CardDescription>Dépenses du mois</CardDescription>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", depensesOpen && "rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      {monthlyCategories.length > 0 && (
                        <div className="space-y-2">
                          {monthlyCategories.map((cat) => (
                            <div
                              key={cat.id}
                            className="group flex items-center justify-between py-3 px-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                          >
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-muted">
                                  <Receipt className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{cat.name}</p>
                                  <p className="text-xs text-muted-foreground">{cat.category}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{formatCurrency(parseFloat(cat.amount) || 0)}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
                                  onClick={async () => {
                                    try {
                                      await supabase.from("monthly_expense_categories").delete().eq("id", cat.id);
                                      setMonthlyCategories(monthlyCategories.filter((c) => c.id !== cat.id));
                                      toast({ title: "Catégorie supprimée" });
                                    } catch (error) {
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

                      {showAddMonthlyCategory ? (
                        <div className="space-y-4 p-4 rounded-xl bg-background/50 border border-dashed border-border">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Nom</Label>
                              <Input
                                placeholder="Ex: Loisirs"
                                value={newMonthlyCategoryName}
                                onChange={(e) => setNewMonthlyCategoryName(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Montant</Label>
                              <Input
                                type="number"
                                placeholder="100"
                                value={newMonthlyCategoryAmount}
                                onChange={(e) => setNewMonthlyCategoryAmount(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Type (optionnel)</Label>
                            <Input
                              placeholder="Ex: Sorties"
                              value={newMonthlyCategoryType}
                              onChange={(e) => setNewMonthlyCategoryType(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs">Appliquer aux mois</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  if (selectedMonths.length === 12) {
                                    setSelectedMonths([selectedMonth]);
                                  } else {
                                    setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
                                  }
                                }}
                              >
                                {selectedMonths.length === 12 ? "Aucun" : "Tous"}
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {months.map((m) => (
                                <button
                                  key={m.value}
                                  type="button"
                                  onClick={() => {
                                    if (selectedMonths.includes(m.value)) {
                                      setSelectedMonths(selectedMonths.filter((month) => month !== m.value));
                                    } else {
                                      setSelectedMonths([...selectedMonths, m.value]);
                                    }
                                  }}
                                  className={cn(
                                    "px-2 py-1 text-xs rounded-md transition-all",
                                    selectedMonths.includes(m.value)
                                      ? "bg-primary/20 text-primary border border-primary/30"
                                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {m.short}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={async () => {
                                if (!newMonthlyCategoryName || !newMonthlyCategoryAmount) {
                                  toast({ variant: "destructive", title: "Erreur", description: "Remplissez les champs requis" });
                                  return;
                                }
                                if (selectedMonths.length === 0) {
                                  toast({ variant: "destructive", title: "Erreur", description: "Sélectionnez au moins un mois" });
                                  return;
                                }
                                try {
                                  const insertPromises = selectedMonths.map((month) =>
                                    supabase.from("monthly_expense_categories").insert({
                                      user_id: user?.id,
                                      year: selectedYear,
                                      month: month,
                                      name: newMonthlyCategoryName,
                                      category: newMonthlyCategoryType || "Autre",
                                      amount: parseFloat(newMonthlyCategoryAmount),
                                    })
                                  );
                                  await Promise.all(insertPromises);
                                  if (selectedMonths.includes(selectedMonth)) await fetchMonthlyBudget();
                                  setNewMonthlyCategoryName("");
                                  setNewMonthlyCategoryType("");
                                  setNewMonthlyCategoryAmount("");
                                  setSelectedMonths([selectedMonth]);
                                  setShowAddMonthlyCategory(false);
                                  toast({ title: `Dépense ajoutée à ${selectedMonths.length} mois` });
                                } catch (error) {
                                  toast({ variant: "destructive", title: "Erreur" });
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
                          className="w-full gap-2 border-dashed hover:bg-primary/10 hover:border-primary/50"
                          onClick={() => setShowAddMonthlyCategory(true)}
                        >
                          <Plus className="h-4 w-4 text-primary" />
                          Ajouter une dépense
                        </Button>
                      )}

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Total sorties</p>
                          <p className="text-2xl font-bold text-red-500">{formatCurrency(mTotalSorties)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Save Button */}
            {user && (
              <div className="flex justify-center">
                <Button 
                  onClick={saveMonthlyBudget} 
                  disabled={isLoading} 
                  size="lg"
                  className="gap-2 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Yearly Detailed Mode */}
        {mode === "yearly-detailed" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Année {selectedYear}
              </h2>
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

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-card border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Revenus annuels</p>
                </div>
                <p className="text-3xl font-bold text-green-500">
                  {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_revenus || 0), 0))}
                </p>
              </div>
              
              <div className="rounded-2xl bg-card border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-red-500/10">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Dépenses annuelles</p>
                </div>
                <p className="text-3xl font-bold text-red-500">
                  {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_sorties || 0), 0))}
                </p>
              </div>
              
              <div className={cn(
                "rounded-2xl p-6 bg-card border",
                yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0
                  ? "border-green-500/30"
                  : "border-red-500/30"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    <PiggyBank className={cn(
                      "h-5 w-5",
                      yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 ? "text-green-500" : "text-red-500"
                    )} />
                  </div>
                  <p className="text-sm text-muted-foreground">Solde annuel</p>
                </div>
                <p className={cn(
                  "text-3xl font-bold",
                  yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0))}
                </p>
              </div>
            </div>

            {/* Monthly Table */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Récapitulatif mensuel</CardTitle>
                <CardDescription>Données enregistrées par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold text-sm">Mois</th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-green-500">Revenus</th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-red-500">Sorties</th>
                        <th className="text-right py-3 px-4 font-semibold text-sm">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {months.map((month) => {
                        const monthData = yearlyData.find(d => d.month === month.value);
                        const revenus = monthData?.total_revenus || 0;
                        const sorties = monthData?.total_sorties || 0;
                        const solde = monthData?.total_restant || 0;
                        
                        return (
                          <tr key={month.value} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium">{month.label}</td>
                            <td className="text-right py-3 px-4 text-sm">{formatCurrency(revenus)}</td>
                            <td className="text-right py-3 px-4 text-sm">{formatCurrency(sorties)}</td>
                            <td className={cn(
                              "text-right py-3 px-4 text-sm font-semibold",
                              solde >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {formatCurrency(solde)}
                            </td>
                          </tr>
                        );
                      })}
                        <tr className="font-bold bg-muted/30">
                          <td className="py-4 px-4 text-sm">Total</td>
                          <td className="text-right py-4 px-4 text-sm text-green-500">
                            {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_revenus || 0), 0))}
                          </td>
                          <td className="text-right py-4 px-4 text-sm text-red-500">
                            {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_sorties || 0), 0))}
                          </td>
                          <td className={cn(
                            "text-right py-4 px-4 text-sm",
                            yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 ? "text-green-500" : "text-red-500"
                        )}>
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

        {/* Annual Projection Mode */}
        {mode === "annuel" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenus Card */}
              <Collapsible open={revenusOpen} onOpenChange={setRevenusOpen}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-green-500/10">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Revenus annuels</CardTitle>
                          <CardDescription>Projection sur l'année</CardDescription>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", revenusOpen && "rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Revenu brut annuel</Label>
                        <Input 
                          type="number" 
                          value={revenuBrutAnnuel} 
                          onChange={(e) => setRevenuBrutAnnuel(e.target.value)} 
                          placeholder="82000" 
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Charges sociales annuelles</Label>
                        <Input 
                          type="number" 
                          value={chargesSocialesAnnuel} 
                          onChange={(e) => setChargesSocialesAnnuel(e.target.value)} 
                          placeholder="AVS, LPP, etc." 
                          className="bg-background/50"
                        />
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Revenu net annuel</p>
                          <p className="text-2xl font-bold text-green-500">{formatCurrency(annualRevenuNet)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Dépenses Card */}
              <Collapsible open={depensesOpen} onOpenChange={setDepensesOpen}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-red-500/10">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Dépenses annuelles</CardTitle>
                          <CardDescription>Par grandes catégories</CardDescription>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", depensesOpen && "rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Dépenses fixes (annuel)</Label>
                        <Input 
                          type="number" 
                          value={depensesAnnuel} 
                          onChange={(e) => setDepensesAnnuel(e.target.value)} 
                          placeholder="50000" 
                          className="bg-background/50"
                        />
                      </div>

                      {fixedExpenses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Dépenses additionnelles</p>
                          {fixedExpenses.map((exp) => (
                            <div key={exp.id} className="group flex items-center justify-between py-3 px-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-muted">
                                  <Receipt className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">{exp.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{formatCurrency(exp.amount || 0)}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
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
                        <div className="space-y-3 p-4 rounded-xl bg-background/50 border border-dashed border-border">
                          <div>
                            <Label className="text-xs">Nom</Label>
                            <Input value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} placeholder="Ex: Netflix" className="mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs">Montant annuel</Label>
                            <Input type="number" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} placeholder="1200" className="mt-1" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={async () => {
                              if (!newExpenseName || !newExpenseAmount) {
                                toast({ variant: "destructive", title: "Erreur", description: "Remplissez les champs" });
                                return;
                              }
                              try {
                                const { data } = await supabase.from("fixed_expenses").insert({
                                  user_id: user?.id,
                                  name: newExpenseName,
                                  category: "Autre",
                                  amount: parseFloat(newExpenseAmount),
                                  frequency: "annuel",
                                  is_active: true,
                                }).select().single();
                                if (data) setFixedExpenses([...fixedExpenses, data]);
                                setNewExpenseName("");
                                setNewExpenseAmount("");
                                setShowAddExpense(false);
                                toast({ title: "Dépense ajoutée" });
                              } catch (err) {
                                toast({ variant: "destructive", title: "Erreur" });
                              }
                            }}>Ajouter</Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setShowAddExpense(false);
                              setNewExpenseName("");
                              setNewExpenseAmount("");
                            }}>Annuler</Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full gap-2 border-dashed hover:bg-primary/10 hover:border-primary/50"
                          onClick={() => setShowAddExpense(true)}
                        >
                          <Plus className="h-4 w-4 text-primary" />
                          Ajouter une dépense
                        </Button>
                      )}

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Total dépenses</p>
                          <p className="text-2xl font-bold text-red-500">{formatCurrency(annualTotalDepenses)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Save Button */}
            {user && (
              <div className="flex justify-center">
                <Button 
                  onClick={saveAnnualProjection} 
                  disabled={isLoading} 
                  size="lg"
                  className="gap-2 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer la projection
                </Button>
              </div>
            )}

            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-card border border-border/50 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Revenu net annuel</p>
                <p className="text-3xl font-bold text-green-500">{formatCurrency(annualRevenuNet)}</p>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Total dépenses</p>
                <p className="text-3xl font-bold text-red-500">{formatCurrency(annualTotalDepenses)}</p>
              </div>
              <div className={cn(
                "rounded-2xl p-6 text-center bg-card border",
                annualSolde >= 0 
                  ? "border-green-500/30"
                  : "border-red-500/30"
              )}>
                <p className="text-sm text-muted-foreground mb-2">Solde annuel</p>
                <p className={cn(
                  "text-3xl font-bold",
                  annualSolde >= 0 ? "text-green-500" : "text-red-500"
                )}>{formatCurrency(annualSolde)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Budget;
