import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BudgetAccount {
  id: string;
  bank_name: string;
}

interface AggregatedData {
  accountId: string;
  accountName: string;
  totalRevenus: number;
  totalSorties: number;
  solde: number;
}

interface AggregatedBudgetTableProps {
  selectedAccounts: BudgetAccount[];
  year: number;
  month: number;
}

const GUEST_BUDGET_KEY = "budget_monthly_guest";

const getGuestBudgetData = (): Record<string, any> => {
  try {
    const stored = localStorage.getItem(GUEST_BUDGET_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export function AggregatedBudgetTable({ selectedAccounts, year, month }: AggregatedBudgetTableProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AggregatedData[]>([]);

  useEffect(() => {
    if (selectedAccounts.length === 0) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Authenticated: fetch from Supabase
          const results = await Promise.all(
            selectedAccounts.map(async (account) => {
              const { data: budgetData } = await supabase
                .from("budget_monthly")
                .select("total_revenus, total_sorties, total_restant")
                .eq("account_id", account.id)
                .eq("year", year)
                .eq("month", month)
                .maybeSingle();

              return {
                accountId: account.id,
                accountName: account.bank_name,
                totalRevenus: budgetData?.total_revenus || 0,
                totalSorties: budgetData?.total_sorties || 0,
                solde: budgetData?.total_restant || 0,
              };
            })
          );
          setData(results);
        } else {
          // Guest: fetch from localStorage
          const guestData = getGuestBudgetData();
          const results = selectedAccounts.map((account) => {
            const key = `${account.id}_${year}_${month}`;
            const budgetData = guestData[key];
            return {
              accountId: account.id,
              accountName: account.bank_name,
              totalRevenus: budgetData?.total_revenus || 0,
              totalSorties: budgetData?.total_sorties || 0,
              solde: budgetData?.total_restant || 0,
            };
          });
          setData(results);
        }
      } catch (error) {
        console.error("Error fetching aggregated data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, selectedAccounts, year, month]);

  const totals = data.reduce(
    (acc, item) => ({
      totalRevenus: acc.totalRevenus + item.totalRevenus,
      totalSorties: acc.totalSorties + item.totalSorties,
      solde: acc.solde + item.solde,
    }),
    { totalRevenus: 0, totalSorties: 0, solde: 0 }
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Récapitulatif - {monthNames[month - 1]} {year}
        </h3>
        <span className="text-sm text-muted-foreground">
          {selectedAccounts.length} compte{selectedAccounts.length > 1 ? "s" : ""} sélectionné{selectedAccounts.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Compte</TableHead>
              <TableHead className="text-right">Revenus</TableHead>
              <TableHead className="text-right">Dépenses</TableHead>
              <TableHead className="text-right">Solde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Aucune donnée disponible pour cette période
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.accountId}>
                  <TableCell className="font-medium">{row.accountName}</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.totalRevenus)}
                  </TableCell>
                  <TableCell className="text-right text-rose-600 dark:text-rose-400">
                    {formatCurrency(row.totalSorties)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {row.solde >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                      )}
                      <span
                        className={cn(
                          "font-medium",
                          row.solde >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {formatCurrency(row.solde)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data.length > 0 && (
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.totalRevenus)}
                </TableCell>
                <TableCell className="text-right text-rose-600 dark:text-rose-400">
                  {formatCurrency(totals.totalSorties)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {totals.solde >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                    <span
                      className={cn(
                        totals.solde >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {formatCurrency(totals.solde)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
