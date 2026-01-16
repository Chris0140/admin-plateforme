import { useState, useEffect } from "react";
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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
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

interface BudgetContentProps {
  accountId: string;
}

const BudgetContent = ({ accountId }: BudgetContentProps) => {
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
  const [epargneADate, setEpargneADate] = useState("");
  const [salaires, setSalaires] = useState<{ id: string; nom: string; brut: string; charges: string; net: string }[]>([]);
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [tempSalaireNom, setTempSalaireNom] = useState("");
  const [tempSalaireBrut, setTempSalaireBrut] = useState("");
  const [tempSalaireCharges, setTempSalaireCharges] = useState("");
  const [tempSalaireNet, setTempSalaireNet] = useState("");
  const [selectedMonthsSalary, setSelectedMonthsSalary] = useState<number[]>([]);
  const [initialMonthsSalary, setInitialMonthsSalary] = useState<number[]>([]);
  const [autresRevenus, setAutresRevenus] = useState<{ id: string; nom: string; montant: string }[]>([]);
  const [showAutreRevenuDialog, setShowAutreRevenuDialog] = useState(false);
  const [editingAutreRevenuId, setEditingAutreRevenuId] = useState<string | null>(null);
  const [tempAutreRevenuNom, setTempAutreRevenuNom] = useState("");
  const [tempAutreRevenuMontant, setTempAutreRevenuMontant] = useState("");
  const [selectedMonthsAutreRevenu, setSelectedMonthsAutreRevenu] = useState<number[]>([]);
  const [initialMonthsAutreRevenu, setInitialMonthsAutreRevenu] = useState<number[]>([]);
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [newMonthlyCategoryName, setNewMonthlyCategoryName] = useState("");
  const [newMonthlyCategoryType, setNewMonthlyCategoryType] = useState("");
  const [newMonthlyCategoryAmount, setNewMonthlyCategoryAmount] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([selectedMonth]);
  const [initialMonthsExpense, setInitialMonthsExpense] = useState<number[]>([]);

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

      // Fetch salaries from new table
      const { data: salariesData, error: salariesError } = await supabase
        .from("monthly_salaries")
        .select("*")
        .eq("user_id", user?.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .order("created_at", { ascending: false });

      if (salariesError) throw salariesError;
      if (salariesData) {
        setSalaires(salariesData.map((s: any) => ({
          id: s.id,
          nom: s.nom,
          brut: s.brut?.toString() || "0",
          charges: s.charges?.toString() || "0",
          net: s.net?.toString() || "0"
        })));
      } else {
        setSalaires([]);
      }

      // Fetch other revenues from new table
      const { data: revenusData, error: revenusError } = await supabase
        .from("monthly_other_revenues")
        .select("*")
        .eq("user_id", user?.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .order("created_at", { ascending: false });

      if (revenusError) throw revenusError;
      if (revenusData) {
        setAutresRevenus(revenusData.map((r: any) => ({
          id: r.id,
          nom: r.nom,
          montant: r.montant?.toString() || "0"
        })));
      } else {
        setAutresRevenus([]);
      }

      if (data) {
        setEpargneADate(data.reste_mois_precedent?.toString() || "");
        setDepensesVariables(data.depenses_variables?.toString() || "");
        setFraisFixesDettes(data.frais_fixes_dettes?.toString() || "");
        setAssurances(data.assurances?.toString() || "");
        setEpargneInvest(data.epargne_investissements?.toString() || "");
      } else {
        setEpargneADate("");
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
      // Fetch all monthly data for the year from source tables
      const [salariesRes, revenusRes, expensesRes, budgetRes] = await Promise.all([
        supabase.from("monthly_salaries").select("month, net").eq("user_id", user?.id).eq("year", selectedYear),
        supabase.from("monthly_other_revenues").select("month, montant").eq("user_id", user?.id).eq("year", selectedYear),
        supabase.from("monthly_expense_categories").select("month, amount").eq("user_id", user?.id).eq("year", selectedYear),
        supabase.from("budget_monthly").select("month, reste_mois_precedent").eq("user_id", user?.id).eq("year", selectedYear)
      ]);

      // Calculate totals per month
      const monthlyTotals = months.map(m => {
        const salairesTotal = (salariesRes.data || [])
          .filter(s => s.month === m.value)
          .reduce((sum, s) => sum + (parseFloat(s.net?.toString()) || 0), 0);
        
        const autresRevenusTotal = (revenusRes.data || [])
          .filter(r => r.month === m.value)
          .reduce((sum, r) => sum + (parseFloat(r.montant?.toString()) || 0), 0);
        
        const expensesTotal = (expensesRes.data || [])
          .filter(e => e.month === m.value)
          .reduce((sum, e) => sum + (parseFloat(e.amount?.toString()) || 0), 0);
        
        const budgetData = (budgetRes.data || []).find(b => b.month === m.value);
        const epargne = parseFloat(budgetData?.reste_mois_precedent?.toString() || "0") || 0;
        
        const totalRevenus = salairesTotal + autresRevenusTotal;
        const totalSorties = expensesTotal;
        const totalRestant = epargne + totalRevenus - totalSorties;

        return {
          month: m.value,
          total_revenus: totalRevenus,
          total_sorties: totalSorties,
          total_restant: totalRestant
        };
      });

      setYearlyData(monthlyTotals);
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
      const epargne = parseFloat(epargneADate) || 0;
      const totalSalaires = salaires.reduce((sum, s) => sum + (parseFloat(s.net) || 0), 0);
      const totalAutresRevenus = autresRevenus.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);

      const totalRevenus = totalSalaires + totalAutresRevenus;
      const totalSorties = mCategoriesTotal;
      const totalRestant = epargne + totalRevenus - totalSorties;

      const { error } = await supabase.from("budget_monthly").upsert({
        user_id: user.id,
        year: selectedYear,
        month: selectedMonth,
        reste_mois_precedent: epargne,
        salaire_net: totalSalaires,
        autres_revenus: totalAutresRevenus,
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

  const mEpargne = parseFloat(epargneADate || "0") || 0;
  const mTotalSalaires = salaires.reduce((sum, s) => sum + (parseFloat(s.net) || 0), 0);
  const mTotalAutresRevenus = autresRevenus.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
  
  const mCategoriesTotal = monthlyCategories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0);

  const mTotalRevenus = mTotalSalaires + mTotalAutresRevenus;
  const mTotalSorties = mCategoriesTotal;
  const mTotalRestant = mEpargne + mTotalRevenus - mTotalSorties;

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

  // Helper function to handle salary save
  const handleSaveSalary = async () => {
    if (!user || !tempSalaireNom || !tempSalaireNet) return;
    
    try {
      const monthsToAdd = selectedMonthsSalary.filter(m => !initialMonthsSalary.includes(m));
      const monthsToRemove = initialMonthsSalary.filter(m => !selectedMonthsSalary.includes(m));
      const monthsToUpdate = selectedMonthsSalary.filter(m => initialMonthsSalary.includes(m));

      // Insert new months
      if (monthsToAdd.length > 0) {
        const { error } = await supabase.from("monthly_salaries").insert(
          monthsToAdd.map(m => ({
            user_id: user.id,
            year: selectedYear,
            month: m,
            nom: tempSalaireNom,
            brut: parseFloat(tempSalaireBrut) || 0,
            charges: parseFloat(tempSalaireCharges) || 0,
            net: parseFloat(tempSalaireNet) || 0,
          }))
        );
        if (error) throw error;
      }

      // Update existing months
      if (monthsToUpdate.length > 0 && editingSalaryId) {
        const { error } = await supabase
          .from("monthly_salaries")
          .update({
            nom: tempSalaireNom,
            brut: parseFloat(tempSalaireBrut) || 0,
            charges: parseFloat(tempSalaireCharges) || 0,
            net: parseFloat(tempSalaireNet) || 0,
          })
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("nom", salaires.find(s => s.id === editingSalaryId)?.nom || tempSalaireNom)
          .in("month", monthsToUpdate);
        if (error) throw error;
      }

      // Remove unchecked months
      if (monthsToRemove.length > 0 && editingSalaryId) {
        const { error } = await supabase
          .from("monthly_salaries")
          .delete()
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("nom", salaires.find(s => s.id === editingSalaryId)?.nom || tempSalaireNom)
          .in("month", monthsToRemove);
        if (error) throw error;
      }

      toast({ title: editingSalaryId ? "Salaire modifié" : "Salaire ajouté" });
      setShowSalaryDialog(false);
      setEditingSalaryId(null);
      setTempSalaireNom("");
      setTempSalaireBrut("");
      setTempSalaireCharges("");
      setTempSalaireNet("");
      fetchMonthlyBudget();
    } catch (error) {
      console.error("Error saving salary:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder le salaire" });
    }
  };

  // Helper function to handle other revenue save
  const handleSaveAutreRevenu = async () => {
    if (!user || !tempAutreRevenuNom || !tempAutreRevenuMontant) return;
    
    try {
      const monthsToAdd = selectedMonthsAutreRevenu.filter(m => !initialMonthsAutreRevenu.includes(m));
      const monthsToRemove = initialMonthsAutreRevenu.filter(m => !selectedMonthsAutreRevenu.includes(m));
      const monthsToUpdate = selectedMonthsAutreRevenu.filter(m => initialMonthsAutreRevenu.includes(m));

      if (monthsToAdd.length > 0) {
        const { error } = await supabase.from("monthly_other_revenues").insert(
          monthsToAdd.map(m => ({
            user_id: user.id,
            year: selectedYear,
            month: m,
            nom: tempAutreRevenuNom,
            montant: parseFloat(tempAutreRevenuMontant) || 0,
          }))
        );
        if (error) throw error;
      }

      if (monthsToUpdate.length > 0 && editingAutreRevenuId) {
        const { error } = await supabase
          .from("monthly_other_revenues")
          .update({
            nom: tempAutreRevenuNom,
            montant: parseFloat(tempAutreRevenuMontant) || 0,
          })
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("nom", autresRevenus.find(r => r.id === editingAutreRevenuId)?.nom || tempAutreRevenuNom)
          .in("month", monthsToUpdate);
        if (error) throw error;
      }

      if (monthsToRemove.length > 0 && editingAutreRevenuId) {
        const { error } = await supabase
          .from("monthly_other_revenues")
          .delete()
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("nom", autresRevenus.find(r => r.id === editingAutreRevenuId)?.nom || tempAutreRevenuNom)
          .in("month", monthsToRemove);
        if (error) throw error;
      }

      toast({ title: editingAutreRevenuId ? "Revenu modifié" : "Revenu ajouté" });
      setShowAutreRevenuDialog(false);
      setEditingAutreRevenuId(null);
      setTempAutreRevenuNom("");
      setTempAutreRevenuMontant("");
      fetchMonthlyBudget();
    } catch (error) {
      console.error("Error saving other revenue:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder le revenu" });
    }
  };

  // Helper function to handle expense save
  const handleSaveExpense = async () => {
    if (!user || !newMonthlyCategoryName || !newMonthlyCategoryType || !newMonthlyCategoryAmount) return;
    
    try {
      const monthsToAdd = selectedMonths.filter(m => !initialMonthsExpense.includes(m));
      const monthsToRemove = initialMonthsExpense.filter(m => !selectedMonths.includes(m));
      const monthsToUpdate = selectedMonths.filter(m => initialMonthsExpense.includes(m));

      if (monthsToAdd.length > 0) {
        const { error } = await supabase.from("monthly_expense_categories").insert(
          monthsToAdd.map(m => ({
            user_id: user.id,
            year: selectedYear,
            month: m,
            name: newMonthlyCategoryName,
            category: newMonthlyCategoryType,
            amount: parseFloat(newMonthlyCategoryAmount) || 0,
          }))
        );
        if (error) throw error;
      }

      if (monthsToUpdate.length > 0 && editingExpenseId) {
        const { error } = await supabase
          .from("monthly_expense_categories")
          .update({
            name: newMonthlyCategoryName,
            category: newMonthlyCategoryType,
            amount: parseFloat(newMonthlyCategoryAmount) || 0,
          })
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("name", monthlyCategories.find(c => c.id === editingExpenseId)?.name || newMonthlyCategoryName)
          .in("month", monthsToUpdate);
        if (error) throw error;
      }

      if (monthsToRemove.length > 0 && editingExpenseId) {
        const { error } = await supabase
          .from("monthly_expense_categories")
          .delete()
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("name", monthlyCategories.find(c => c.id === editingExpenseId)?.name || newMonthlyCategoryName)
          .in("month", monthsToRemove);
        if (error) throw error;
      }

      toast({ title: editingExpenseId ? "Dépense modifiée" : "Dépense ajoutée" });
      setShowExpenseDialog(false);
      setEditingExpenseId(null);
      setNewMonthlyCategoryName("");
      setNewMonthlyCategoryType("");
      setNewMonthlyCategoryAmount("");
      fetchMonthlyBudget();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder la dépense" });
    }
  };

  // Helper function to add fixed expense
  const handleAddFixedExpense = async () => {
    if (!user || !newExpenseName || !newExpenseAmount) return;
    
    try {
      const { error } = await supabase.from("fixed_expenses").insert({
        user_id: user.id,
        name: newExpenseName,
        category: "autre",
        amount: parseFloat(newExpenseAmount) || 0,
        frequency: "mensuel",
        is_active: true,
      });
      if (error) throw error;
      
      toast({ title: "Dépense fixe ajoutée" });
      setShowAddExpense(false);
      setNewExpenseName("");
      setNewExpenseAmount("");
      fetchAnnualProjection();
    } catch (error) {
      console.error("Error adding fixed expense:", error);
      toast({ variant: "destructive", title: "Erreur" });
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Mode Switcher - Modern Pill Design */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 md:gap-1.5 p-1 md:p-1.5 rounded-xl md:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
          {modeButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = mode === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setMode(btn.id)}
                className={cn(
                  "relative flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-300",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isActive && "animate-pulse")} />
                <span className="hidden xs:inline sm:inline">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Mode */}
      {mode === "mensuel" && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          {/* Month/Year Selector - Compact Design */}
          <div className="flex items-center justify-center gap-2 md:gap-4">
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
              className="rounded-full h-8 w-8 md:h-10 md:w-10 border border-border/50 hover:bg-primary/10 hover:border-primary/50"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary hidden sm:block" />
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-20 md:w-28 border-0 bg-transparent shadow-none focus:ring-0 text-xs md:text-sm h-8 md:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-16 md:w-20 border-0 bg-transparent shadow-none focus:ring-0 text-xs md:text-sm h-8 md:h-10">
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
              className="rounded-full h-8 w-8 md:h-10 md:w-10 border border-border/50 hover:bg-primary/10 hover:border-primary/50"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Summary Cards - Top */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <div className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-card border border-border/50 p-3 md:p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">Épargne</p>
                  <p className="text-lg md:text-2xl font-bold">{formatCurrency(mEpargne)}</p>
                </div>
                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-muted">
                  <Wallet className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-card border border-border/50 p-3 md:p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">Revenus</p>
                  <p className="text-lg md:text-2xl font-bold text-green-500">{formatCurrency(mTotalRevenus)}</p>
                </div>
                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-green-500/10">
                  <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-card border border-border/50 p-3 md:p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">Dépenses</p>
                  <p className="text-lg md:text-2xl font-bold text-red-500">{formatCurrency(mTotalSorties)}</p>
                </div>
                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-red-500/10">
                  <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                </div>
              </div>
            </div>
            
            <div className={cn(
              "group relative overflow-hidden rounded-xl md:rounded-2xl p-3 md:p-5 transition-all duration-300 bg-card border",
              mTotalRestant >= 0 
                ? "border-green-500/30 hover:shadow-lg hover:shadow-green-500/10"
                : "border-red-500/30 hover:shadow-lg hover:shadow-red-500/10"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">Solde</p>
                  <p className={cn(
                    "text-lg md:text-2xl font-bold",
                    mTotalRestant >= 0 ? "text-green-500" : "text-red-500"
                  )}>{formatCurrency(mTotalRestant)}</p>
                </div>
                <div className={cn(
                  "p-1.5 md:p-2.5 rounded-lg md:rounded-xl",
                  mTotalRestant >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  <PiggyBank className={cn(
                    "h-4 w-4 md:h-5 md:w-5",
                    mTotalRestant >= 0 ? "text-green-500" : "text-red-500"
                  )} />
                </div>
              </div>
            </div>
          </div>

          {/* Input Cards */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
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
                      <Label htmlFor="epargneADate" className="text-sm text-muted-foreground">Épargne à date</Label>
                      <Input 
                        id="epargneADate" 
                        type="number" 
                        value={epargneADate} 
                        onChange={(e) => setEpargneADate(e.target.value)} 
                        placeholder="0" 
                        className="bg-background/50"
                      />
                    </div>
                    
                    {/* Salaires Section */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Salaires</Label>
                      {salaires.length > 0 && (
                        <div className="space-y-2">
                          {salaires.map((salaire) => (
                            <div
                              key={salaire.id}
                              className="group flex items-center justify-between py-2 px-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                              onClick={async () => {
                                setEditingSalaryId(salaire.id);
                                setTempSalaireNom(salaire.nom);
                                setTempSalaireBrut(salaire.brut);
                                setTempSalaireCharges(salaire.charges);
                                setTempSalaireNet(salaire.net);
                                const { data: existingMonths } = await supabase
                                  .from("monthly_salaries")
                                  .select("month")
                                  .eq("user_id", user?.id)
                                  .eq("year", selectedYear)
                                  .eq("nom", salaire.nom);
                                const monthsList = existingMonths?.map(e => e.month) || [selectedMonth];
                                setSelectedMonthsSalary(monthsList);
                                setInitialMonthsSalary(monthsList);
                                setShowSalaryDialog(true);
                              }}
                            >
                              <div>
                                <p className="text-sm font-medium">{salaire.nom}</p>
                                <p className="text-xs text-muted-foreground">Net: {formatCurrency(parseFloat(salaire.net) || 0)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-green-500">{formatCurrency(parseFloat(salaire.net) || 0)}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await supabase.from("monthly_salaries").delete().eq("id", salaire.id);
                                      setSalaires(salaires.filter((s) => s.id !== salaire.id));
                                      toast({ title: "Salaire supprimé" });
                                    } catch (error) {
                                      toast({ variant: "destructive", title: "Erreur" });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Dialog open={showSalaryDialog} onOpenChange={(open) => {
                        setShowSalaryDialog(open);
                        if (!open) {
                          setEditingSalaryId(null);
                          setTempSalaireNom("");
                          setTempSalaireBrut("");
                          setTempSalaireCharges("");
                          setTempSalaireNet("");
                          setSelectedMonthsSalary([selectedMonth]);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2 bg-background/50 hover:bg-primary/10 border-dashed"
                            onClick={() => {
                              setEditingSalaryId(null);
                              setTempSalaireNom("");
                              setTempSalaireBrut("");
                              setTempSalaireCharges("");
                              setTempSalaireNet("");
                              setSelectedMonthsSalary([selectedMonth]);
                            }}
                          >
                            <Plus className="h-4 w-4 text-primary" />
                            Ajouter un salaire
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingSalaryId ? "Modifier le salaire" : "Ajouter un salaire"}</DialogTitle>
                            <DialogDescription>Entrez les détails du salaire</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="tempSalaireNom">Nom / Description</Label>
                              <Input
                                id="tempSalaireNom"
                                value={tempSalaireNom}
                                onChange={(e) => setTempSalaireNom(e.target.value)}
                                placeholder="Ex: Salaire principal"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label htmlFor="tempSalaireBrut">Brut</Label>
                                <Input
                                  id="tempSalaireBrut"
                                  type="number"
                                  value={tempSalaireBrut}
                                  onChange={(e) => setTempSalaireBrut(e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label htmlFor="tempSalaireCharges">Charges</Label>
                                <Input
                                  id="tempSalaireCharges"
                                  type="number"
                                  value={tempSalaireCharges}
                                  onChange={(e) => setTempSalaireCharges(e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label htmlFor="tempSalaireNet">Net</Label>
                                <Input
                                  id="tempSalaireNet"
                                  type="number"
                                  value={tempSalaireNet}
                                  onChange={(e) => setTempSalaireNet(e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="mb-2 block">Appliquer aux mois</Label>
                              <div className="flex flex-wrap gap-1">
                                {months.map((m) => (
                                  <Button
                                    key={m.value}
                                    type="button"
                                    variant={selectedMonthsSalary.includes(m.value) ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => {
                                      if (selectedMonthsSalary.includes(m.value)) {
                                        setSelectedMonthsSalary(selectedMonthsSalary.filter(v => v !== m.value));
                                      } else {
                                        setSelectedMonthsSalary([...selectedMonthsSalary, m.value]);
                                      }
                                    }}
                                  >
                                    {m.short}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleSaveSalary}>
                              {editingSalaryId ? "Mettre à jour" : "Ajouter"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Autres Revenus Section */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Autres revenus</Label>
                      {autresRevenus.length > 0 && (
                        <div className="space-y-2">
                          {autresRevenus.map((revenu) => (
                            <div
                              key={revenu.id}
                              className="group flex items-center justify-between py-2 px-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                              onClick={async () => {
                                setEditingAutreRevenuId(revenu.id);
                                setTempAutreRevenuNom(revenu.nom);
                                setTempAutreRevenuMontant(revenu.montant);
                                const { data: existingMonths } = await supabase
                                  .from("monthly_other_revenues")
                                  .select("month")
                                  .eq("user_id", user?.id)
                                  .eq("year", selectedYear)
                                  .eq("nom", revenu.nom);
                                const monthsList = existingMonths?.map(e => e.month) || [selectedMonth];
                                setSelectedMonthsAutreRevenu(monthsList);
                                setInitialMonthsAutreRevenu(monthsList);
                                setShowAutreRevenuDialog(true);
                              }}
                            >
                              <div>
                                <p className="text-sm font-medium">{revenu.nom}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-green-500">{formatCurrency(parseFloat(revenu.montant) || 0)}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await supabase.from("monthly_other_revenues").delete().eq("id", revenu.id);
                                      setAutresRevenus(autresRevenus.filter((r) => r.id !== revenu.id));
                                      toast({ title: "Revenu supprimé" });
                                    } catch (error) {
                                      toast({ variant: "destructive", title: "Erreur" });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Dialog open={showAutreRevenuDialog} onOpenChange={(open) => {
                        setShowAutreRevenuDialog(open);
                        if (!open) {
                          setEditingAutreRevenuId(null);
                          setTempAutreRevenuNom("");
                          setTempAutreRevenuMontant("");
                          setSelectedMonthsAutreRevenu([selectedMonth]);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2 bg-background/50 hover:bg-primary/10 border-dashed"
                            onClick={() => {
                              setEditingAutreRevenuId(null);
                              setTempAutreRevenuNom("");
                              setTempAutreRevenuMontant("");
                              setSelectedMonthsAutreRevenu([selectedMonth]);
                            }}
                          >
                            <Plus className="h-4 w-4 text-primary" />
                            Ajouter un autre revenu
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingAutreRevenuId ? "Modifier le revenu" : "Ajouter un revenu"}</DialogTitle>
                            <DialogDescription>Entrez les détails du revenu</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="tempAutreRevenuNom">Nom / Description</Label>
                              <Input
                                id="tempAutreRevenuNom"
                                value={tempAutreRevenuNom}
                                onChange={(e) => setTempAutreRevenuNom(e.target.value)}
                                placeholder="Ex: Bonus, Dividendes..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="tempAutreRevenuMontant">Montant</Label>
                              <Input
                                id="tempAutreRevenuMontant"
                                type="number"
                                value={tempAutreRevenuMontant}
                                onChange={(e) => setTempAutreRevenuMontant(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="mb-2 block">Appliquer aux mois</Label>
                              <div className="flex flex-wrap gap-1">
                                {months.map((m) => (
                                  <Button
                                    key={m.value}
                                    type="button"
                                    variant={selectedMonthsAutreRevenu.includes(m.value) ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => {
                                      if (selectedMonthsAutreRevenu.includes(m.value)) {
                                        setSelectedMonthsAutreRevenu(selectedMonthsAutreRevenu.filter(v => v !== m.value));
                                      } else {
                                        setSelectedMonthsAutreRevenu([...selectedMonthsAutreRevenu, m.value]);
                                      }
                                    }}
                                  >
                                    {m.short}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleSaveAutreRevenu}>
                              {editingAutreRevenuId ? "Mettre à jour" : "Ajouter"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Revenus</span>
                        <span className="text-lg font-bold text-green-500">{formatCurrency(mTotalRevenus)}</span>
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
                            className="group flex items-center justify-between py-2 px-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                            onClick={async () => {
                              setEditingExpenseId(cat.id);
                              setNewMonthlyCategoryName(cat.name);
                              setNewMonthlyCategoryType(cat.category);
                              setNewMonthlyCategoryAmount(cat.amount?.toString() || "");
                              const { data: existingMonths } = await supabase
                                .from("monthly_expense_categories")
                                .select("month")
                                .eq("user_id", user?.id)
                                .eq("year", selectedYear)
                                .eq("name", cat.name);
                              const monthsList = existingMonths?.map(e => e.month) || [selectedMonth];
                              setSelectedMonths(monthsList);
                              setInitialMonthsExpense(monthsList);
                              setShowExpenseDialog(true);
                            }}
                          >
                            <div>
                              <p className="text-sm font-medium">{cat.name}</p>
                              <p className="text-xs text-muted-foreground">{cat.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-red-500">{formatCurrency(parseFloat(cat.amount) || 0)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await supabase.from("monthly_expense_categories").delete().eq("id", cat.id);
                                    setMonthlyCategories(monthlyCategories.filter((c) => c.id !== cat.id));
                                    toast({ title: "Dépense supprimée" });
                                  } catch (error) {
                                    toast({ variant: "destructive", title: "Erreur" });
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Dialog open={showExpenseDialog} onOpenChange={(open) => {
                      setShowExpenseDialog(open);
                      if (!open) {
                        setEditingExpenseId(null);
                        setNewMonthlyCategoryName("");
                        setNewMonthlyCategoryType("");
                        setNewMonthlyCategoryAmount("");
                        setSelectedMonths([selectedMonth]);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 bg-background/50 hover:bg-primary/10 border-dashed"
                          onClick={() => {
                            setEditingExpenseId(null);
                            setNewMonthlyCategoryName("");
                            setNewMonthlyCategoryType("");
                            setNewMonthlyCategoryAmount("");
                            setSelectedMonths([selectedMonth]);
                          }}
                        >
                          <Plus className="h-4 w-4 text-primary" />
                          Ajouter une dépense
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingExpenseId ? "Modifier la dépense" : "Ajouter une dépense"}</DialogTitle>
                          <DialogDescription>Entrez les détails de la dépense</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="newMonthlyCategoryName">Nom</Label>
                            <Input
                              id="newMonthlyCategoryName"
                              value={newMonthlyCategoryName}
                              onChange={(e) => setNewMonthlyCategoryName(e.target.value)}
                              placeholder="Ex: Loyer, Électricité..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="newMonthlyCategoryType">Catégorie</Label>
                            <Select value={newMonthlyCategoryType} onValueChange={setNewMonthlyCategoryType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une catégorie" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="logement">Logement</SelectItem>
                                <SelectItem value="transport">Transport</SelectItem>
                                <SelectItem value="alimentation">Alimentation</SelectItem>
                                <SelectItem value="assurances">Assurances</SelectItem>
                                <SelectItem value="loisirs">Loisirs</SelectItem>
                                <SelectItem value="sante">Santé</SelectItem>
                                <SelectItem value="epargne">Épargne</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="newMonthlyCategoryAmount">Montant</Label>
                            <Input
                              id="newMonthlyCategoryAmount"
                              type="number"
                              value={newMonthlyCategoryAmount}
                              onChange={(e) => setNewMonthlyCategoryAmount(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Appliquer aux mois</Label>
                            <div className="flex flex-wrap gap-1">
                              {months.map((m) => (
                                <Button
                                  key={m.value}
                                  type="button"
                                  variant={selectedMonths.includes(m.value) ? "default" : "outline"}
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => {
                                    if (selectedMonths.includes(m.value)) {
                                      setSelectedMonths(selectedMonths.filter(v => v !== m.value));
                                    } else {
                                      setSelectedMonths([...selectedMonths, m.value]);
                                    }
                                  }}
                                >
                                  {m.short}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSaveExpense}>
                            {editingExpenseId ? "Mettre à jour" : "Ajouter"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Dépenses</span>
                        <span className="text-lg font-bold text-red-500">{formatCurrency(mTotalSorties)}</span>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button onClick={saveMonthlyBudget} disabled={isLoading} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Sauvegarde..." : "Sauvegarder le mois"}
            </Button>
          </div>
        </div>
      )}

      {/* Yearly Detailed Mode */}
      {mode === "yearly-detailed" && (
        <div className="space-y-6 animate-fade-in">
          {/* Year Selector */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => setSelectedYear(selectedYear - 1)}
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 border border-border/50 hover:bg-primary/10 hover:border-primary/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold">{selectedYear}</span>
            </div>
            
            <Button
              onClick={() => setSelectedYear(selectedYear + 1)}
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 border border-border/50 hover:bg-primary/10 hover:border-primary/50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Yearly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle</CardTitle>
              <CardDescription>Solde restant par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData}>
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(v) => months.find(m => m.value === v)?.short || v}
                    />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => months.find(m => m.value === label)?.label || label}
                    />
                    <Bar dataKey="total_restant" radius={[4, 4, 0, 0]}>
                      {yearlyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.total_restant >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Détail par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Mois</th>
                      <th className="text-right py-3 px-2">Revenus</th>
                      <th className="text-right py-3 px-2">Dépenses</th>
                      <th className="text-right py-3 px-2">Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((data) => (
                      <tr 
                        key={data.month} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedMonth(data.month);
                          setMode("mensuel");
                        }}
                      >
                        <td className="py-3 px-2 font-medium">
                          {months.find(m => m.value === data.month)?.label}
                        </td>
                        <td className="py-3 px-2 text-right text-green-500">
                          {formatCurrency(data.total_revenus)}
                        </td>
                        <td className="py-3 px-2 text-right text-red-500">
                          {formatCurrency(data.total_sorties)}
                        </td>
                        <td className={cn(
                          "py-3 px-2 text-right font-semibold",
                          data.total_restant >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {formatCurrency(data.total_restant)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className="py-3 px-2">Total</td>
                      <td className="py-3 px-2 text-right text-green-500">
                        {formatCurrency(yearlyData.reduce((sum, d) => sum + d.total_revenus, 0))}
                      </td>
                      <td className="py-3 px-2 text-right text-red-500">
                        {formatCurrency(yearlyData.reduce((sum, d) => sum + d.total_sorties, 0))}
                      </td>
                      <td className={cn(
                        "py-3 px-2 text-right",
                        yearlyData.reduce((sum, d) => sum + d.total_restant, 0) >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatCurrency(yearlyData.reduce((sum, d) => sum + d.total_restant, 0))}
                      </td>
                    </tr>
                  </tfoot>
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
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Revenus annuels</CardTitle>
                    <CardDescription>Projection des entrées</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="revenuBrutAnnuel">Revenu brut annuel</Label>
                  <Input
                    id="revenuBrutAnnuel"
                    type="number"
                    value={revenuBrutAnnuel}
                    onChange={(e) => setRevenuBrutAnnuel(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chargesSocialesAnnuel">Charges sociales annuelles</Label>
                  <Input
                    id="chargesSocialesAnnuel"
                    type="number"
                    value={chargesSocialesAnnuel}
                    onChange={(e) => setChargesSocialesAnnuel(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenu net annuel</span>
                    <span className="text-lg font-bold text-green-500">{formatCurrency(annualRevenuNet)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dépenses Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10">
                    <Receipt className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dépenses annuelles</CardTitle>
                    <CardDescription>Projection des sorties</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depensesAnnuel">Autres dépenses annuelles</Label>
                  <Input
                    id="depensesAnnuel"
                    type="number"
                    value={depensesAnnuel}
                    onChange={(e) => setDepensesAnnuel(e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                {/* Fixed Expenses */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Dépenses fixes</Label>
                  {fixedExpenses.length > 0 && (
                    <div className="space-y-2">
                      {fixedExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="group flex items-center justify-between py-2 px-3 rounded-xl bg-background/50 border border-border/50"
                        >
                          <span className="text-sm">{expense.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(expense.amount * 12)}/an</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                              onClick={async () => {
                                try {
                                  await supabase.from("fixed_expenses").delete().eq("id", expense.id);
                                  setFixedExpenses(fixedExpenses.filter((e) => e.id !== expense.id));
                                  toast({ title: "Dépense supprimée" });
                                } catch (error) {
                                  toast({ variant: "destructive", title: "Erreur" });
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 border-dashed">
                        <Plus className="h-4 w-4 text-primary" />
                        Ajouter une dépense fixe
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter une dépense fixe</DialogTitle>
                        <DialogDescription>Cette dépense sera comptée mensuellement</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="newExpenseName">Nom</Label>
                          <Input
                            id="newExpenseName"
                            value={newExpenseName}
                            onChange={(e) => setNewExpenseName(e.target.value)}
                            placeholder="Ex: Loyer, Assurance..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="newExpenseAmount">Montant mensuel</Label>
                          <Input
                            id="newExpenseAmount"
                            type="number"
                            value={newExpenseAmount}
                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddFixedExpense}>Ajouter</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total dépenses annuelles</span>
                    <span className="text-lg font-bold text-red-500">{formatCurrency(annualTotalDepenses)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className={cn(
            "border-2",
            annualSolde >= 0 ? "border-green-500/30" : "border-red-500/30"
          )}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl",
                    annualSolde >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    <PiggyBank className={cn(
                      "h-6 w-6",
                      annualSolde >= 0 ? "text-green-500" : "text-red-500"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Solde annuel projeté</p>
                    <p className="text-xs text-muted-foreground">
                      {annualSolde >= 0 ? "Capacité d'épargne" : "Déficit budgétaire"}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  "text-3xl font-bold",
                  annualSolde >= 0 ? "text-green-500" : "text-red-500"
                )}>{formatCurrency(annualSolde)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button onClick={saveAnnualProjection} disabled={isLoading} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Sauvegarde..." : "Sauvegarder la projection"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetContent;
