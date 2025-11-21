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

type BudgetMode = "mensuel" | "annuel";

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
  const [logementAnnuel, setLogementAnnuel] = useState("");
  const [assurancesAnnuel, setAssurancesAnnuel] = useState("");
  const [alimentationAnnuel, setAlimentationAnnuel] = useState("");
  const [autresDepensesAnnuel, setAutresDepensesAnnuel] = useState("");

  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseFrequency, setNewExpenseFrequency] = useState<"mensuel" | "annuel">("mensuel");

  const [revenusOpen, setRevenusOpen] = useState(true);
  const [depensesOpen, setDepensesOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (mode === "mensuel") {
      fetchMonthlyBudget();
    } else {
      fetchAnnualProjection();
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
        setLogementAnnuel(data.depenses_logement_annuel?.toString() || "");
        setAssurancesAnnuel(data.depenses_transport_annuel?.toString() || "");
        setAlimentationAnnuel(data.depenses_alimentation_annuel?.toString() || "");
        setAutresDepensesAnnuel(data.autres_depenses_annuel?.toString() || "");
      } else {
        setRevenuBrutAnnuel("");
        setChargesSocialesAnnuel("");
        setLogementAnnuel("");
        setAssurancesAnnuel("");
        setAlimentationAnnuel("");
        setAutresDepensesAnnuel("");
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
      const depVar = parseFloat(depensesVariables) || 0;
      const frais = parseFloat(fraisFixesDettes) || 0;
      const ass = parseFloat(assurances) || 0;
      const epargne = parseFloat(epargneInvest) || 0;

      const totalRevenus = salaire + autres;
      const totalSorties = depVar + frais + ass + epargne;
      const totalRestant = reste + totalRevenus - totalSorties;

      const { error } = await supabase.from("budget_monthly").upsert({
        user_id: user.id,
        year: selectedYear,
        month: selectedMonth,
        reste_mois_precedent: reste,
        salaire_net: salaire,
        autres_revenus: autres,
        depenses_variables: depVar,
        frais_fixes_dettes: frais,
        assurances: ass,
        epargne_investissements: epargne,
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
      const logement = parseFloat(logementAnnuel) || 0;
      const assur = parseFloat(assurancesAnnuel) || 0;
      const alim = parseFloat(alimentationAnnuel) || 0;
      const autres = parseFloat(autresDepensesAnnuel) || 0;

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
        depenses_logement: logement,
        depenses_transport: assur,
        depenses_alimentation: alim,
        autres_depenses: autres,
        revenu_brut_annuel: revenu,
        charges_sociales_annuel: charges,
        depenses_logement_annuel: logement,
        depenses_transport_annuel: assur,
        depenses_alimentation_annuel: alim,
        autres_depenses_annuel: autres,
        revenu_brut_mensuel: Math.round(revenu / 12),
        charges_sociales_mensuel: Math.round(charges / 12),
        depenses_logement_mensuel: Math.round(logement / 12),
        depenses_transport_mensuel: Math.round(assur / 12),
        depenses_alimentation_mensuel: Math.round(alim / 12),
        autres_depenses_mensuel: Math.round(autres / 12),
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
    (parseFloat(logementAnnuel || "0") || 0) +
    (parseFloat(assurancesAnnuel || "0") || 0) +
    (parseFloat(alimentationAnnuel || "0") || 0) +
    (parseFloat(autresDepensesAnnuel || "0") || 0) +
    annualFixedExpenses;
  const annualSolde = annualRevenuNet - annualTotalDepenses;

  const mReste = parseFloat(resteMoisPrecedent || "0") || 0;
  const mSalaire = parseFloat(salaireNet || "0") || 0;
  const mAutres = parseFloat(autresRevenus || "0") || 0;
  const mDepVar = parseFloat(depensesVariables || "0") || 0;
  const mFrais = parseFloat(fraisFixesDettes || "0") || 0;
  const mAss = parseFloat(assurances || "0") || 0;
  const mEpargne = parseFloat(epargneInvest || "0") || 0;

  const mTotalRevenus = mSalaire + mAutres;
  const mTotalSorties = mDepVar + mFrais + mAss + mEpargne;
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

          <div className="mb-8 flex flex-col items-center gap-3">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(value) => value && setMode(value as BudgetMode)}
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem value="mensuel" className="px-6">
                Suivi mensuel détaillé
              </ToggleGroupItem>
              <ToggleGroupItem value="annuel" className="px-6">
                Projection annuelle simple
              </ToggleGroupItem>
            </ToggleGroup>
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
                        <div>
                          <Label htmlFor="depensesVariables">Dépenses (variables)</Label>
                          <Input id="depensesVariables" type="number" value={depensesVariables} onChange={(e) => setDepensesVariables(e.target.value)} placeholder="Courses, sorties, etc." />
                        </div>
                        <div>
                          <Label htmlFor="fraisFixesDettes">Frais fixes & dettes</Label>
                          <Input id="fraisFixesDettes" type="number" value={fraisFixesDettes} onChange={(e) => setFraisFixesDettes(e.target.value)} placeholder="Loyer, leasing, etc." />
                        </div>
                        <div>
                          <Label htmlFor="assurances">Assurances</Label>
                          <Input id="assurances" type="number" value={assurances} onChange={(e) => setAssurances(e.target.value)} placeholder="Lamal, RC, véhicule…" />
                        </div>
                        <div>
                          <Label htmlFor="epargneInvest">Épargne & investissements</Label>
                          <Input id="epargneInvest" type="number" value={epargneInvest} onChange={(e) => setEpargneInvest(e.target.value)} placeholder="3e pilier, ETF, etc." />
                        </div>
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
                          <Label htmlFor="logementAnnuel">Logement (annuel)</Label>
                          <Input id="logementAnnuel" type="number" value={logementAnnuel} onChange={(e) => setLogementAnnuel(e.target.value)} placeholder="Loyer/hypothèque * 12" />
                        </div>
                        <div>
                          <Label htmlFor="assurancesAnnuel">Assurances (annuel)</Label>
                          <Input id="assurancesAnnuel" type="number" value={assurancesAnnuel} onChange={(e) => setAssurancesAnnuel(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="alimentationAnnuel">Alimentation (annuel)</Label>
                          <Input id="alimentationAnnuel" type="number" value={alimentationAnnuel} onChange={(e) => setAlimentationAnnuel(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="autresDepensesAnnuel">Autres dépenses (annuel)</Label>
                          <Input id="autresDepensesAnnuel" type="number" value={autresDepensesAnnuel} onChange={(e) => setAutresDepensesAnnuel(e.target.value)} />
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
                            Ajouter une dépense fixe
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
