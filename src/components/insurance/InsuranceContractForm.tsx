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
import { saveInsuranceContract, InsuranceContract, INSURANCE_TYPE_LABELS } from "@/lib/insuranceCalculations";

const formSchema = z.object({
  insurance_type: z.enum(['health_basic', 'health_complementary', 'household', 'liability', 'vehicle', 'legal_protection', 'life', 'disability', 'loss_of_earnings']),
  company_name: z.string().min(1, "Nom requis"),
  contract_number: z.string().optional(),
  annual_premium: z.number().min(0),
  deductible: z.number().min(0).optional(),
  coverage_amount: z.number().min(0).optional(),
  disability_rent_annual: z.number().min(0).optional(),
  death_capital: z.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InsuranceContractFormProps {
  contractId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const InsuranceContractForm = ({ contractId, onSuccess, onCancel }: InsuranceContractFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      insurance_type: 'health_basic',
      company_name: '',
      contract_number: '',
      annual_premium: 0,
      deductible: 0,
      coverage_amount: 0,
      disability_rent_annual: 0,
      death_capital: 0,
      start_date: '',
      end_date: '',
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

      if (contractId) {
        const { data: contract } = await supabase
          .from('insurance_contracts')
          .select('*')
          .eq('id', contractId)
          .single();

        if (contract) {
          form.reset({
            insurance_type: contract.insurance_type as any,
            company_name: contract.company_name,
            contract_number: contract.contract_number || '',
            annual_premium: Number(contract.annual_premium),
            deductible: Number(contract.deductible || 0),
            coverage_amount: Number(contract.coverage_amount || 0),
            disability_rent_annual: Number(contract.disability_rent_annual || 0),
            death_capital: Number(contract.death_capital || 0),
            start_date: contract.start_date || '',
            end_date: contract.end_date || '',
            notes: contract.notes || '',
          });
        }
      }
    };

    loadData();
  }, [contractId, form]);

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

    const contractData: Partial<InsuranceContract> = {
      ...values,
      profile_id: profileId,
      id: contractId || undefined,
    };

    const result = await saveInsuranceContract(contractData);

    setLoading(false);

    if (result.success) {
      toast({
        title: "Succès",
        description: contractId ? "Contrat mis à jour" : "Contrat créé",
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
        <CardTitle>{contractId ? "Modifier" : "Ajouter"} un contrat d'assurance</CardTitle>
        <CardDescription>
          Gérez vos contrats d'assurance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="insurance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'assurance</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(INSURANCE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compagnie</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Groupe Mutuel" {...field} />
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
                name="annual_premium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prime annuelle (CHF)</FormLabel>
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
                name="deductible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Franchise (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Pour assurance maladie</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverage_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant de couverture (CHF)</FormLabel>
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
                    <FormDescription>Pour assurance vie</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disability_rent_annual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rente invalidité annuelle (CHF)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Pour assurance invalidité/perte de gain</FormDescription>
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
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {loading ? "Enregistrement..." : contractId ? "Mettre à jour" : "Créer"}
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

export default InsuranceContractForm;