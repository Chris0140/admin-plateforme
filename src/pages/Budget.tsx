import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  GripVertical,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type BudgetMode = "mensuel" | "annuel" | "yearly-detailed";

interface BudgetItem {
  id: string;
  name: string;
  value: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  items: BudgetItem[];
}

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

const generateId = () => Math.random().toString(36).substr(2, 9);

const Budget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  
  const [mode, setMode] = useState<BudgetMode>("mensuel");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState("revenus");
  
  // Yearly detailed data
  const [yearlyData, setYearlyData] = useState<any[]>([]);

  // Finary-style data structure
  const [revenus, setRevenus] = useState<BudgetCategory[]>([
    {
      id: generateId(),
      name: "Revenus",
      items: [{ id: generateId(), name: "Salaire", value: "" }]
    }
  ]);
  
  const [investissements, setInvestissements] = useState<BudgetCategory[]>([
    {
      id: generateId(),
      name: "Épargne mensuelle",
      items: [{ id: generateId(), name: "3ème pilier", value: "" }]
    }
  ]);
  
  const [depenses, setDepenses] = useState<BudgetCategory[]>([
    {
      id: generateId(),
      name: "Logement",
      items: [
        { id: generateId(), name: "Loyer", value: "" },
        { id: generateId(), name: "Charges", value: "" }
      ]
    },
    {
      id: generateId(),
      name: "Vie quotidienne",
      items: [
        { id: generateId(), name: "Courses", value: "" },
        { id: generateId(), name: "Restaurants", value: "" }
      ]
    },
    {
      id: generateId(),
      name: "Abonnements",
      items: [
        { id: generateId(), name: "Téléphone", value: "" },
        { id: generateId(), name: "Internet", value: "" }
      ]
    }
  ]);

  // Mode annuel states
  const [revenuBrutAnnuel, setRevenuBrutAnnuel] = useState("");
  const [chargesSocialesAnnuel, setChargesSocialesAnnuel] = useState("");
  const [depensesAnnuel, setDepensesAnnuel] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  // Calculations
  const calculateTotal = (categories: BudgetCategory[]): number => {
    return categories.reduce((total, cat) => {
      return total + cat.items.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    }, 0);
  };

  const totalRevenus = calculateTotal(revenus);
  const totalInvestissements = calculateTotal(investissements);
  const totalDepenses = calculateTotal(depenses);
  const solde = totalRevenus - totalInvestissements - totalDepenses;
  const tauxEpargne = totalRevenus > 0 ? (totalInvestissements / totalRevenus) * 100 : 0;
  const tauxEpargnePossible = totalRevenus > 0 ? ((totalRevenus - totalDepenses) / totalRevenus) * 100 : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(isNaN(value) ? 0 : value);

  // Load data from database
  useEffect(() => {
    if (!user) return;
    if (mode === "mensuel") {
      fetchMonthlyBudget();
    } else if (mode === "annuel") {
      fetchAnnualProjection();
    } else if (mode === "yearly-detailed") {
      fetchYearlyDetailed();
    }
  }, [user, mode, selectedYear, selectedMonth]);

  const fetchMonthlyBudget = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("monthly_expense_categories")
        .select("*")
        .eq("user_id", user?.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .order("created_at", { ascending: true });

      if (categoriesError) throw categoriesError;

      if (categoriesData && categoriesData.length > 0) {
        // Parse into Finary structure
        const revenuItems = categoriesData.filter(c => c.category === "revenu");
        const investItems = categoriesData.filter(c => c.category === "investissement");
        const depenseItems = categoriesData.filter(c => c.category !== "revenu" && c.category !== "investissement");

        if (revenuItems.length > 0) {
          setRevenus([{
            id: generateId(),
            name: "Revenus",
            items: revenuItems.map(item => ({
              id: item.id,
              name: item.name,
              value: item.amount?.toString() || ""
            }))
          }]);
        }

        if (investItems.length > 0) {
          setInvestissements([{
            id: generateId(),
            name: "Épargne mensuelle",
            items: investItems.map(item => ({
              id: item.id,
              name: item.name,
              value: item.amount?.toString() || ""
            }))
          }]);
        }

        if (depenseItems.length > 0) {
          const grouped = depenseItems.reduce((acc: Record<string, BudgetItem[]>, item) => {
            const cat = item.category || "Autre";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push({
              id: item.id,
              name: item.name,
              value: item.amount?.toString() || ""
            });
            return acc;
          }, {});

          setDepenses(Object.entries(grouped).map(([name, items]) => ({
            id: generateId(),
            name,
            items
          })));
        }
      }
    } catch (err) {
      console.error("Erreur chargement budget:", err);
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
      console.error("Erreur chargement année:", err);
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
      }
    } catch (err) {
      console.error("Erreur chargement projection:", err);
    }
  };

  const saveMonthlyBudget = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erreur", description: "Vous devez être connecté" });
      return;
    }

    setIsLoading(true);
    try {
      // Delete existing entries for this month
      await supabase
        .from("monthly_expense_categories")
        .delete()
        .eq("user_id", user.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth);

      // Insert all items
      const allItems: any[] = [];
      
      revenus.forEach(cat => {
        cat.items.forEach(item => {
          if (item.name && item.value) {
            allItems.push({
              user_id: user.id,
              year: selectedYear,
              month: selectedMonth,
              name: item.name,
              category: "revenu",
              amount: parseFloat(item.value) || 0
            });
          }
        });
      });

      investissements.forEach(cat => {
        cat.items.forEach(item => {
          if (item.name && item.value) {
            allItems.push({
              user_id: user.id,
              year: selectedYear,
              month: selectedMonth,
              name: item.name,
              category: "investissement",
              amount: parseFloat(item.value) || 0
            });
          }
        });
      });

      depenses.forEach(cat => {
        cat.items.forEach(item => {
          if (item.name && item.value) {
            allItems.push({
              user_id: user.id,
              year: selectedYear,
              month: selectedMonth,
              name: item.name,
              category: cat.name,
              amount: parseFloat(item.value) || 0
            });
          }
        });
      });

      if (allItems.length > 0) {
        const { error } = await supabase.from("monthly_expense_categories").insert(allItems);
        if (error) throw error;
      }

      // Update budget_monthly summary
      await supabase.from("budget_monthly").upsert({
        user_id: user.id,
        year: selectedYear,
        month: selectedMonth,
        salaire_net: totalRevenus,
        total_revenus: totalRevenus,
        total_sorties: totalDepenses + totalInvestissements,
        total_restant: solde,
        epargne_investissements: totalInvestissements,
      }, { onConflict: "user_id,year,month" });

      toast({ title: "Budget sauvegardé" });
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
      const depensesVal = parseFloat(depensesAnnuel) || 0;

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
        autres_depenses: depensesVal,
        revenu_brut_annuel: revenu,
        charges_sociales_annuel: charges,
        autres_depenses_annuel: depensesVal,
        revenu_brut_mensuel: Math.round(revenu / 12),
        charges_sociales_mensuel: Math.round(charges / 12),
        autres_depenses_mensuel: Math.round(depensesVal / 12),
      };

      if (existing) {
        await supabase.from("budget_data").update(payload).eq("user_id", user.id);
      } else {
        await supabase.from("budget_data").insert(payload);
      }

      toast({ title: "Projection sauvegardée" });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erreur" });
    } finally {
      setIsLoading(false);
    }
  };

  // Item management functions
  const addItem = (type: "revenus" | "investissements" | "depenses", categoryId: string) => {
    const setter = type === "revenus" ? setRevenus : type === "investissements" ? setInvestissements : setDepenses;
    const data = type === "revenus" ? revenus : type === "investissements" ? investissements : depenses;
    
    setter(data.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: [...cat.items, { id: generateId(), name: "", value: "" }]
        };
      }
      return cat;
    }));
  };

  const updateItem = (type: "revenus" | "investissements" | "depenses", categoryId: string, itemId: string, field: "name" | "value", value: string) => {
    const setter = type === "revenus" ? setRevenus : type === "investissements" ? setInvestissements : setDepenses;
    const data = type === "revenus" ? revenus : type === "investissements" ? investissements : depenses;
    
    setter(data.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id === itemId) {
              return { ...item, [field]: value };
            }
            return item;
          })
        };
      }
      return cat;
    }));
  };

  const removeItem = (type: "revenus" | "investissements" | "depenses", categoryId: string, itemId: string) => {
    const setter = type === "revenus" ? setRevenus : type === "investissements" ? setInvestissements : setDepenses;
    const data = type === "revenus" ? revenus : type === "investissements" ? investissements : depenses;
    
    setter(data.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId)
        };
      }
      return cat;
    }));
  };

  const addCategory = (type: "depenses") => {
    const newCat: BudgetCategory = {
      id: generateId(),
      name: "Nouvelle catégorie",
      items: [{ id: generateId(), name: "", value: "" }]
    };
    setDepenses([...depenses, newCat]);
  };

  const updateCategoryName = (type: "depenses", categoryId: string, name: string) => {
    setDepenses(depenses.map(cat => cat.id === categoryId ? { ...cat, name } : cat));
  };

  const removeCategory = (type: "depenses", categoryId: string) => {
    setDepenses(depenses.filter(cat => cat.id !== categoryId));
  };

  // Annual mode calculations
  const annualRevenuNet = (parseFloat(revenuBrutAnnuel || "0") - parseFloat(chargesSocialesAnnuel || "0"));
  const annualFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const annualTotalDepenses = (parseFloat(depensesAnnuel || "0") || 0) + annualFixedExpenses;
  const annualSolde = annualRevenuNet - annualTotalDepenses;

  const modeButtons = [
    { id: "mensuel" as BudgetMode, label: "Mensuel", icon: Calendar },
    { id: "yearly-detailed" as BudgetMode, label: "Année", icon: TrendingUp },
    { id: "annuel" as BudgetMode, label: "Projection", icon: Sparkles },
  ];

  // Visual Chart Component (Finary-style stacked bar)
  const BudgetChart = () => {
    const total = totalRevenus;
    if (total === 0) return null;

    const investPct = (totalInvestissements / total) * 100;
    const depensesPct = (totalDepenses / total) * 100;
    const restePct = Math.max(0, 100 - investPct - depensesPct);

    // Get category details for depenses
    const depensesDetails = depenses.map(cat => ({
      name: cat.name,
      total: cat.items.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0)
    })).filter(c => c.total > 0);

    return (
      <div className="space-y-6">
        {/* Summary Text */}
        <div className="text-center text-sm text-muted-foreground leading-relaxed">
          Votre taux d'épargne est de{" "}
          <span className={cn("font-semibold", tauxEpargne >= 10 ? "text-green-500" : "text-amber-500")}>
            {tauxEpargne.toFixed(1)}%
          </span>
          {" "}(taux possible: {tauxEpargnePossible.toFixed(1)}%). Vous avez un revenu de{" "}
          <span className="font-semibold text-foreground">{formatCurrency(totalRevenus)}</span>
          , des dépenses de{" "}
          <span className="font-semibold text-foreground">{formatCurrency(totalDepenses)}</span>
          {totalInvestissements > 0 && (
            <>
              {" "}et épargnez{" "}
              <span className="font-semibold text-foreground">{formatCurrency(totalInvestissements)}</span>
            </>
          )}
          , il vous reste{" "}
          <span className={cn("font-semibold", solde >= 0 ? "text-green-500" : "text-red-500")}>
            {formatCurrency(solde)}
          </span>
          {" "}disponible.
        </div>

        {/* Stacked Bar Chart */}
        <div className="relative h-64 flex items-end gap-1 px-4">
          {/* Revenus Bar */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full rounded-t-lg bg-primary/80 transition-all duration-500 relative group cursor-pointer hover:bg-primary"
              style={{ height: `${Math.min(100, (totalRevenus / Math.max(totalRevenus, totalDepenses + totalInvestissements)) * 100)}%`, minHeight: totalRevenus > 0 ? "40px" : "0" }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg z-10">
                {formatCurrency(totalRevenus)}
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Revenus</span>
            <span className="text-sm font-semibold">{formatCurrency(totalRevenus)}</span>
          </div>

          {/* Budget Bar (stacked) */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden transition-all duration-500"
              style={{ height: `${Math.min(100, ((totalDepenses + totalInvestissements) / Math.max(totalRevenus, totalDepenses + totalInvestissements)) * 100)}%`, minHeight: (totalDepenses + totalInvestissements) > 0 ? "40px" : "0" }}
            >
              {/* Investissements */}
              {totalInvestissements > 0 && (
                <div 
                  className="w-full bg-amber-500/80 hover:bg-amber-500 transition-colors relative group cursor-pointer"
                  style={{ flex: `${totalInvestissements}` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg z-10">
                    Épargne: {formatCurrency(totalInvestissements)}
                  </div>
                </div>
              )}
              
              {/* Dépenses par catégorie */}
              {depensesDetails.map((cat, idx) => {
                const colors = [
                  "bg-rose-400/80 hover:bg-rose-400",
                  "bg-orange-400/80 hover:bg-orange-400",
                  "bg-pink-400/80 hover:bg-pink-400",
                  "bg-red-400/80 hover:bg-red-400",
                  "bg-fuchsia-400/80 hover:bg-fuchsia-400",
                ];
                return (
                  <div 
                    key={cat.name}
                    className={cn("w-full transition-colors relative group cursor-pointer", colors[idx % colors.length])}
                    style={{ flex: `${cat.total}` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg z-10">
                      {cat.name}: {formatCurrency(cat.total)}
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground font-medium">Budget</span>
            <span className="text-sm font-semibold">{formatCurrency(totalDepenses + totalInvestissements)}</span>
          </div>

          {/* Disponible Bar */}
          {solde !== 0 && (
            <div className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "w-full rounded-t-lg transition-all duration-500 relative group cursor-pointer",
                  solde >= 0 ? "bg-green-500/80 hover:bg-green-500" : "bg-red-500/80 hover:bg-red-500"
                )}
                style={{ height: `${Math.min(100, (Math.abs(solde) / Math.max(totalRevenus, totalDepenses + totalInvestissements)) * 100)}%`, minHeight: "40px" }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg z-10">
                  {formatCurrency(solde)}
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Disponible</span>
              <span className={cn("text-sm font-semibold", solde >= 0 ? "text-green-500" : "text-red-500")}>
                {formatCurrency(solde)}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          {totalInvestissements > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-muted-foreground">Épargne: {formatCurrency(totalInvestissements)}</span>
            </div>
          )}
          {depensesDetails.map((cat, idx) => {
            const colors = ["bg-rose-400", "bg-orange-400", "bg-pink-400", "bg-red-400", "bg-fuchsia-400"];
            return (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded", colors[idx % colors.length])} />
                <span className="text-muted-foreground">{cat.name}: {formatCurrency(cat.total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Category Input Card Component
  const CategoryCard = ({ 
    category, 
    type, 
    color 
  }: { 
    category: BudgetCategory; 
    type: "revenus" | "investissements" | "depenses";
    color: "green" | "amber" | "red";
  }) => {
    const colorClasses = {
      green: "border-green-500/20 bg-green-500/5",
      amber: "border-amber-500/20 bg-amber-500/5",
      red: "border-red-500/20 bg-red-500/5"
    };

    const categoryTotal = category.items.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);

    return (
      <div className={cn("rounded-xl border p-4 space-y-3 transition-all", colorClasses[color])}>
        <div className="flex items-center justify-between">
          {type === "depenses" ? (
            <Input 
              value={category.name}
              onChange={(e) => updateCategoryName("depenses", category.id, e.target.value)}
              className="font-medium bg-transparent border-0 p-0 h-auto focus-visible:ring-0 text-foreground"
            />
          ) : (
            <h3 className="font-medium">{category.name}</h3>
          )}
          <span className={cn(
            "text-sm font-semibold",
            color === "green" ? "text-green-500" : color === "amber" ? "text-amber-500" : "text-red-500"
          )}>
            {formatCurrency(categoryTotal)}
          </span>
        </div>

        <div className="space-y-2">
          {category.items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 group">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Nom</Label>
                  <Input 
                    value={item.name}
                    onChange={(e) => updateItem(type, category.id, item.id, "name", e.target.value)}
                    placeholder="Ex: Salaire"
                    className="h-9 bg-background/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Montant</Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      value={item.value}
                      onChange={(e) => updateItem(type, category.id, item.id, "value", e.target.value)}
                      placeholder="0"
                      className="h-9 pr-12 bg-background/50 border-border/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">CHF</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500 mt-4"
                onClick={() => removeItem(type, category.id, item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => addItem(type, category.id)}
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter une source de {type === "revenus" ? "revenu" : type === "investissements" ? "épargne" : "dépense"}
        </Button>

        {type === "depenses" && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
            onClick={() => removeCategory("depenses", category.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Supprimer cette catégorie
          </Button>
        )}
      </div>
    );
  };

  return (
    <AppLayout title="Calculateur de budget" subtitle="Visualisez la répartition de vos dépenses et découvrez votre taux d'épargne">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Mode Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50">
            {modeButtons.map((btn) => {
              const Icon = btn.icon;
              const isActive = mode === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setMode(btn.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Mode - Finary Style */}
        {mode === "mensuel" && (
          <div className="space-y-8 animate-fade-in">
            {/* Month/Year Selector */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-24 border-0 bg-transparent p-0 h-auto focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-16 border-0 bg-transparent p-0 h-auto focus:ring-0">
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
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs - Finary Style */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-12 p-1 bg-card border border-border/50 rounded-xl">
                <TabsTrigger 
                  value="revenus" 
                  className="rounded-lg data-[state=active]:bg-green-500/10 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Revenus
                </TabsTrigger>
                <TabsTrigger 
                  value="investissements"
                  className="rounded-lg data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
                >
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Épargne
                </TabsTrigger>
                <TabsTrigger 
                  value="depenses"
                  className="rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Dépenses
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="revenus" className="mt-0 space-y-4">
                  {revenus.map(cat => (
                    <CategoryCard key={cat.id} category={cat} type="revenus" color="green" />
                  ))}
                </TabsContent>

                <TabsContent value="investissements" className="mt-0 space-y-4">
                  {investissements.map(cat => (
                    <CategoryCard key={cat.id} category={cat} type="investissements" color="amber" />
                  ))}
                </TabsContent>

                <TabsContent value="depenses" className="mt-0 space-y-4">
                  {depenses.map(cat => (
                    <CategoryCard key={cat.id} category={cat} type="depenses" color="red" />
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={() => addCategory("depenses")}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une catégorie
                  </Button>
                </TabsContent>
              </div>
            </Tabs>

            {/* Next/Save Button */}
            <div className="flex justify-center gap-3">
              {activeTab !== "depenses" && (
                <Button
                  size="lg"
                  className="px-8 rounded-full"
                  onClick={() => {
                    if (activeTab === "revenus") setActiveTab("investissements");
                    else if (activeTab === "investissements") setActiveTab("depenses");
                  }}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {user && (
                <Button
                  size="lg"
                  variant={activeTab === "depenses" ? "default" : "outline"}
                  className="px-8 rounded-full gap-2"
                  onClick={saveMonthlyBudget}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              )}
            </div>

            {/* Chart Section */}
            {(totalRevenus > 0 || totalDepenses > 0) && (
              <Card className="overflow-hidden">
                <CardHeader className="text-center pb-4">
                  <CardTitle>Répartition de votre budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <BudgetChart />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Yearly Detailed Mode */}
        {mode === "yearly-detailed" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Année {selectedYear}
              </h2>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-28">
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
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Revenus</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_revenus || 0), 0))}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Dépenses</span>
                  </div>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_sorties || 0), 0))}
                  </p>
                </CardContent>
              </Card>
              
              <Card className={cn(
                yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                      <PiggyBank className={cn(
                        "h-4 w-4",
                        yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 ? "text-green-500" : "text-red-500"
                      )} />
                    </div>
                    <span className="text-sm text-muted-foreground">Solde</span>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0) >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_restant || 0), 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif mensuel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 font-medium">Mois</th>
                        <th className="text-right py-3 px-3 font-medium text-green-500">Revenus</th>
                        <th className="text-right py-3 px-3 font-medium text-red-500">Dépenses</th>
                        <th className="text-right py-3 px-3 font-medium">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {months.map((month) => {
                        const monthData = yearlyData.find(d => d.month === month.value);
                        const revenus = monthData?.total_revenus || 0;
                        const sorties = monthData?.total_sorties || 0;
                        const solde = monthData?.total_restant || 0;
                        
                        return (
                          <tr key={month.value} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2.5 px-3 font-medium">{month.label}</td>
                            <td className="text-right py-2.5 px-3">{formatCurrency(revenus)}</td>
                            <td className="text-right py-2.5 px-3">{formatCurrency(sorties)}</td>
                            <td className={cn(
                              "text-right py-2.5 px-3 font-semibold",
                              solde >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {formatCurrency(solde)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-muted/50">
                        <td className="py-3 px-3">Total</td>
                        <td className="text-right py-3 px-3 text-green-500">
                          {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_revenus || 0), 0))}
                        </td>
                        <td className="text-right py-3 px-3 text-red-500">
                          {formatCurrency(yearlyData.reduce((sum, d) => sum + (d.total_sorties || 0), 0))}
                        </td>
                        <td className={cn(
                          "text-right py-3 px-3",
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
              {/* Revenus */}
              <Card className="border-green-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Revenus annuels</CardTitle>
                      <CardDescription>Projection sur l'année</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Revenu brut annuel</Label>
                    <Input 
                      type="number" 
                      value={revenuBrutAnnuel} 
                      onChange={(e) => setRevenuBrutAnnuel(e.target.value)} 
                      placeholder="82000" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Charges sociales annuelles</Label>
                    <Input 
                      type="number" 
                      value={chargesSocialesAnnuel} 
                      onChange={(e) => setChargesSocialesAnnuel(e.target.value)} 
                      placeholder="12000" 
                      className="mt-1"
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenu net</span>
                      <span className="text-lg font-bold text-green-500">{formatCurrency(annualRevenuNet)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dépenses */}
              <Card className="border-red-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Dépenses annuelles</CardTitle>
                      <CardDescription>Budget prévisionnel</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Dépenses fixes annuelles</Label>
                    <Input 
                      type="number" 
                      value={depensesAnnuel} 
                      onChange={(e) => setDepensesAnnuel(e.target.value)} 
                      placeholder="50000" 
                      className="mt-1"
                    />
                  </div>

                  {fixedExpenses.length > 0 && (
                    <div className="space-y-2">
                      {fixedExpenses.map((exp) => (
                        <div key={exp.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/50 group">
                          <span className="text-sm">{exp.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(exp.amount)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={async () => {
                                await supabase.from("fixed_expenses").delete().eq("id", exp.id);
                                setFixedExpenses(fixedExpenses.filter((e) => e.id !== exp.id));
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddExpense ? (
                    <div className="space-y-3 p-3 rounded-lg border border-dashed">
                      <Input 
                        value={newExpenseName} 
                        onChange={(e) => setNewExpenseName(e.target.value)} 
                        placeholder="Nom" 
                      />
                      <Input 
                        type="number" 
                        value={newExpenseAmount} 
                        onChange={(e) => setNewExpenseAmount(e.target.value)} 
                        placeholder="Montant annuel" 
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            if (!newExpenseName || !newExpenseAmount) return;
                            const { data } = await supabase.from("fixed_expenses").insert({
                              user_id: user?.id,
                              name: newExpenseName,
                              amount: parseFloat(newExpenseAmount),
                              category: "autre",
                              frequency: "annual"
                            }).select().single();
                            if (data) setFixedExpenses([...fixedExpenses, data]);
                            setNewExpenseName("");
                            setNewExpenseAmount("");
                            setShowAddExpense(false);
                          }}
                        >
                          Ajouter
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddExpense(false)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-dashed"
                      onClick={() => setShowAddExpense(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter une dépense
                    </Button>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total dépenses</span>
                      <span className="text-lg font-bold text-red-500">{formatCurrency(annualTotalDepenses)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Solde */}
            <Card className={cn(
              "p-6",
              annualSolde >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl",
                    annualSolde >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    <PiggyBank className={cn("h-6 w-6", annualSolde >= 0 ? "text-green-500" : "text-red-500")} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Solde annuel prévisionnel</p>
                    <p className={cn("text-3xl font-bold", annualSolde >= 0 ? "text-green-500" : "text-red-500")}>
                      {formatCurrency(annualSolde)}
                    </p>
                  </div>
                </div>
                {user && (
                  <Button onClick={saveAnnualProjection} disabled={isLoading} className="gap-2">
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Budget;
