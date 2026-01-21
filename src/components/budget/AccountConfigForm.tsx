import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RevenueFieldArray } from "./RevenueFieldArray";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const accountSchema = z.object({
  revenues: z
    .array(
      z.object({
        source: z.string().min(1, "Veuillez entrer une source"),
        amount: z.string().min(1, "Veuillez entrer un montant"),
      })
    )
    .min(1, "Ajoutez au moins une source de revenu"),
  revenueType: z.enum(["regulier", "variable"], {
    required_error: "Veuillez sélectionner un type",
  }),
  accountingDay: z.string().min(1, "Veuillez sélectionner un jour"),
  bankName: z.string().min(2, "Le nom de la banque doit contenir au moins 2 caractères"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountConfigFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  accountId?: string; // If provided, we're in edit mode
}

const LOCAL_ACCOUNTS_KEY = "budget_accounts_guest";
const LOCAL_REVENUES_KEY = "budget_revenues_guest";

// Helper to get guest accounts from localStorage
const getGuestAccounts = () => {
  try {
    const stored = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save guest accounts to localStorage
const saveGuestAccounts = (accounts: unknown[]) => {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
};

// Helper to get guest revenues from localStorage
const getGuestRevenues = () => {
  try {
    const stored = localStorage.getItem(LOCAL_REVENUES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save guest revenues to localStorage
const saveGuestRevenues = (revenues: unknown[]) => {
  localStorage.setItem(LOCAL_REVENUES_KEY, JSON.stringify(revenues));
};

export function AccountConfigForm({ onClose, onSuccess, accountId }: AccountConfigFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!accountId);

  const isEditMode = !!accountId;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      revenues: [{ source: "", amount: "" }],
      revenueType: undefined,
      accountingDay: "",
      bankName: "",
    },
  });

  // Load existing account data in edit mode
  useEffect(() => {
    if (!accountId) return;

    const loadAccountData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Authenticated user: fetch from Supabase
          const { data: account, error: accountError } = await supabase
            .from("budget_accounts")
            .select("*")
            .eq("id", accountId)
            .single();

          if (accountError) throw accountError;

          const { data: revenues, error: revenuesError } = await supabase
            .from("budget_account_revenues")
            .select("*")
            .eq("account_id", accountId);

          if (revenuesError) throw revenuesError;

          form.reset({
            bankName: account.bank_name,
            revenueType: account.revenue_type as "regulier" | "variable",
            accountingDay: account.accounting_day.toString(),
            revenues: revenues.length > 0
              ? revenues.map((r) => ({
                  source: r.source_name,
                  amount: r.amount.toString(),
                }))
              : [{ source: "", amount: "" }],
          });
        } else {
          // Guest user: fetch from localStorage
          const accounts = getGuestAccounts();
          const account = accounts.find((a: { id: string }) => a.id === accountId);
          const allRevenues = getGuestRevenues();
          const revenues = allRevenues.filter((r: { account_id: string }) => r.account_id === accountId);

          if (account) {
            form.reset({
              bankName: account.bank_name,
              revenueType: account.revenue_type as "regulier" | "variable",
              accountingDay: account.accounting_day.toString(),
              revenues: revenues.length > 0
                ? revenues.map((r: { source_name: string; amount: number }) => ({
                    source: r.source_name,
                    amount: r.amount.toString(),
                  }))
                : [{ source: "", amount: "" }],
            });
          }
        }
      } catch (error) {
        console.error("Error loading account:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données du compte",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountData();
  }, [accountId, form, toast, user]);

  const onSubmit = async (values: AccountFormValues) => {
    setIsSubmitting(true);
    try {
      if (user) {
        // Authenticated user: save to Supabase
        if (isEditMode && accountId) {
          const { error: accountError } = await supabase
            .from("budget_accounts")
            .update({
              bank_name: values.bankName,
              revenue_type: values.revenueType,
              accounting_day: parseInt(values.accountingDay),
              updated_at: new Date().toISOString(),
            })
            .eq("id", accountId);

          if (accountError) throw accountError;

          const { error: deleteError } = await supabase
            .from("budget_account_revenues")
            .delete()
            .eq("account_id", accountId);

          if (deleteError) throw deleteError;

          const revenues = values.revenues.map((rev) => ({
            account_id: accountId,
            source_name: rev.source,
            amount: parseFloat(rev.amount) || 0,
          }));

          const { error: revenuesError } = await supabase
            .from("budget_account_revenues")
            .insert(revenues);

          if (revenuesError) throw revenuesError;

          toast({
            title: "Compte mis à jour",
            description: "Les modifications ont été enregistrées",
          });

          if (onSuccess) onSuccess();
          if (onClose) onClose();
        } else {
          const { data: account, error: accountError } = await supabase
            .from("budget_accounts")
            .insert({
              user_id: user.id,
              account_type: "courant",
              bank_name: values.bankName,
              revenue_type: values.revenueType,
              accounting_day: parseInt(values.accountingDay),
              is_active: true,
            })
            .select()
            .single();

          if (accountError) throw accountError;

          const revenues = values.revenues.map((rev) => ({
            account_id: account.id,
            source_name: rev.source,
            amount: parseFloat(rev.amount) || 0,
          }));

          const { error: revenuesError } = await supabase
            .from("budget_account_revenues")
            .insert(revenues);

          if (revenuesError) throw revenuesError;

          toast({
            title: "Votre espace est prêt !",
            description: "Bienvenue dans votre tableau de bord budget",
          });

          if (onSuccess) onSuccess();
          if (onClose) onClose();
          navigate(`/budget/dashboard/${account.id}`);
        }
      } else {
        // Guest user: save to localStorage
        const accounts = getGuestAccounts();
        const allRevenues = getGuestRevenues();

        if (isEditMode && accountId) {
          // Update existing account
          const updatedAccounts = accounts.map((acc: { id: string }) =>
            acc.id === accountId
              ? {
                  ...acc,
                  bank_name: values.bankName,
                  revenue_type: values.revenueType,
                  accounting_day: parseInt(values.accountingDay),
                  updated_at: new Date().toISOString(),
                }
              : acc
          );
          saveGuestAccounts(updatedAccounts);

          // Update revenues
          const otherRevenues = allRevenues.filter((r: { account_id: string }) => r.account_id !== accountId);
          const newRevenues = values.revenues.map((rev) => ({
            id: crypto.randomUUID(),
            account_id: accountId,
            source_name: rev.source,
            amount: parseFloat(rev.amount) || 0,
            created_at: new Date().toISOString(),
          }));
          saveGuestRevenues([...otherRevenues, ...newRevenues]);

          toast({
            title: "Compte mis à jour",
            description: "Les modifications ont été enregistrées",
          });

          if (onSuccess) onSuccess();
          if (onClose) onClose();
        } else {
          // Create new account
          const newAccountId = crypto.randomUUID();
          const newAccount = {
            id: newAccountId,
            user_id: "guest",
            account_type: "courant",
            bank_name: values.bankName,
            revenue_type: values.revenueType,
            accounting_day: parseInt(values.accountingDay),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          saveGuestAccounts([...accounts, newAccount]);

          // Create revenues
          const newRevenues = values.revenues.map((rev) => ({
            id: crypto.randomUUID(),
            account_id: newAccountId,
            source_name: rev.source,
            amount: parseFloat(rev.amount) || 0,
            created_at: new Date().toISOString(),
          }));
          saveGuestRevenues([...allRevenues, ...newRevenues]);

          toast({
            title: "Votre espace est prêt !",
            description: "Bienvenue dans votre tableau de bord budget",
          });

          if (onSuccess) onSuccess();
          if (onClose) onClose();
          navigate(`/budget/dashboard/${newAccountId}`);
        }
      }
    } catch (error) {
      console.error("Error saving account:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: isEditMode
          ? "Impossible de mettre à jour le compte"
          : "Impossible de créer votre compte",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Revenues Section */}
        <RevenueFieldArray control={form.control} name="revenues" />

        {/* Revenue Type */}
        <FormField
          control={form.control}
          name="revenueType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de revenus</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="regulier">
                    <div className="flex flex-col">
                      <span>Régulier</span>
                      <span className="text-xs text-muted-foreground">
                        Montant fixe chaque mois
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="variable">
                    <div className="flex flex-col">
                      <span>Variable</span>
                      <span className="text-xs text-muted-foreground">
                        Montant différent chaque mois
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Accounting Day */}
        <FormField
          control={form.control}
          name="accountingDay"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Jour comptable</FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[240px]">
                    <p>
                      Le jour où vos compteurs se remettent à zéro (ex: jour de
                      paie). Vos statistiques mensuelles seront calculées à
                      partir de ce jour.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le jour" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bank Name */}
        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banque</FormLabel>
              <FormControl>
                <Input placeholder="Ex: UBS, Credit Suisse, PostFinance..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Mise à jour..." : "Création en cours..."}
            </>
          ) : isEditMode ? (
            "Mettre à jour"
          ) : (
            "Créer mon budget"
          )}
        </Button>
      </form>
    </Form>
  );
}
