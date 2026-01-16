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
import { useState } from "react";

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
}

export function AccountConfigForm({ onClose }: AccountConfigFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      revenues: [{ source: "", amount: "" }],
      revenueType: undefined,
      accountingDay: "",
      bankName: "",
    },
  });

  const onSubmit = async (values: AccountFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the account
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

      // Create the revenues
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

      if (onClose) onClose();
      navigate("/budget/dashboard");
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer votre compte",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              Création en cours...
            </>
          ) : (
            "Créer mon budget"
          )}
        </Button>
      </form>
    </Form>
  );
}
