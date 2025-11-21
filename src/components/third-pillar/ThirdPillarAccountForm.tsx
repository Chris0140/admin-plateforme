import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { saveThirdPillarAccount, ThirdPillarAccount } from "@/lib/thirdPillarCalculations";

const formSchema = z.object({
  account_type: z.enum(['3a_bank', '3a_insurance', '3b']),
  institution_name: z.string().min(1, "Nom requis"),
  contract_number: z.string().optional(),
  current_amount: z.number().min(0),
  annual_contribution: z.number().min(0),
  start_date: z.string().optional(),
  return_rate: z.number().min(0).max(100),
  projected_amount_at_retirement: z.number().min(0).optional(),
  disability_rent_annual: z.number().min(0).optional(),
  death_capital: z.number().min(0).optional(),
  premium_exemption_waiting_period: z.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ThirdPillarAccountFormProps {
  accountId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ThirdPillarAccountForm = ({ accountId, onSuccess, onCancel }: ThirdPillarAccountFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_type: '3a_bank',
      institution_name: '',
      contract_number: '',
      current_amount: 0,
      annual_contribution: 0,
      start_date: '',
      return_rate: 2,
      projected_amount_at_retirement: 0,
      disability_rent_annual: 0,
      death_capital: 0,
      premium_exemption_waiting_period: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
      }

      if (accountId) {
        const { data: account } = await supabase
          .from('third_pillar_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (account) {
          form.reset({
            account_type: account.account_type as '3a_bank' | '3a_insurance' | '3b',
            institution_name: account.institution_name,
            contract_number: account.contract_number || '',
            current_amount: Number(account.current_amount),
            annual_contribution: Number(account.annual_contribution),
            start_date: account.start_date || '',
            return_rate: Number(account.return_rate),
            projected_amount_at_retirement: Number(account.projected_amount_at_retirement || 0),
            disability_rent_annual: Number(account.disability_rent_annual || 0),
            death_capital: Number(account.death_capital || 0),
            premium_exemption_waiting_period: account.premium_exemption_waiting_period || undefined,
            notes: account.notes || '',
          });
        }
      }
    };

    loadData();
  }, [accountId, form]);

  const onSubmit = async (values: FormValues) => {
    if (!profileId) {
      toast({
        title: "Erreur",
        description: "Profil non trouvé",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const accountData: Partial<ThirdPillarAccount> = {
      ...values,
      profile_id: profileId,
      id: accountId || undefined,
    };

    const result = await saveThirdPillarAccount(accountData);

    setLoading(false);

    if (result.success) {
      toast({
        title: "Succès",
        description: accountId ? "Compte mis à jour" : "Compte créé",
      });
      onSuccess();
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{accountId ? "Modifier" : "Ajouter"} un compte 3e pilier</CardTitle>
        <CardDescription>
          Gérez vos comptes de prévoyance individuelle (3a/3b)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de compte</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3a_bank">3a Bancaire</SelectItem>
                        <SelectItem value="3a_insurance">3a Assurance</SelectItem>
                        <SelectItem value="3b">3b</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institution_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Banque Cantonale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de contrat</FormLabel>
                    <FormControl>
                      <Input placeholder="Optionnel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capital actuel (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annual_contribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotisation annuelle (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Montant versé chaque année
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="return_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux de rendement (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Taux de rendement annuel estimé
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projected_amount_at_retirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avoir projeté à la retraite (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Capital estimé à 65 ans
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="death_capital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capital décès (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch('account_type') === '3a_insurance' || form.watch('account_type') === '3b') && (
                <>
                  <FormField
                    control={form.control}
                    name="disability_rent_annual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rente d'invalidité annuelle (CHF)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="premium_exemption_waiting_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exonération des primes</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Délai d'attente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3">3 mois</SelectItem>
                            <SelectItem value="6">6 mois</SelectItem>
                            <SelectItem value="12">12 mois</SelectItem>
                            <SelectItem value="24">24 mois</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Délai avant exonération en cas d'incapacité de gain
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes additionnelles..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : accountId ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ThirdPillarAccountForm;