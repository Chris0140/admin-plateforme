import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const formSchema = z.object({
  asset_name: z.string().min(1, "Le nom de l'actif est requis"),
  asset_type: z.string().min(1, "Le type d'actif est requis"),
  ticker_symbol: z.string().optional(),
  quantity: z.string().min(1, "La quantité est requise"),
  purchase_price: z.string().min(1, "Le prix d'achat est requis"),
  current_price: z.string().optional(),
  purchase_date: z.string().optional(),
  currency: z.string().default("CHF"),
  platform: z.string().optional(),
  notes: z.string().optional(),
});

interface InvestmentAssetFormProps {
  assetId: string | null;
  profileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const assetTypes = [
  { value: "actions", label: "Actions" },
  { value: "etf", label: "ETF" },
  { value: "crypto", label: "Cryptomonnaies" },
  { value: "obligations", label: "Obligations" },
  { value: "immobilier", label: "Immobilier" },
  { value: "fonds", label: "Fonds d'investissement" },
  { value: "autres", label: "Autres" },
];

const currencies = [
  { value: "CHF", label: "CHF" },
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
];

const InvestmentAssetForm = ({ assetId, profileId, onSuccess, onCancel }: InvestmentAssetFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset_name: "",
      asset_type: "",
      ticker_symbol: "",
      quantity: "",
      purchase_price: "",
      current_price: "",
      purchase_date: "",
      currency: "CHF",
      platform: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (assetId) {
      loadAsset();
    }
  }, [assetId]);

  const loadAsset = async () => {
    if (!assetId) return;

    try {
      const { data, error } = await supabase
        .from("investment_assets")
        .select("*")
        .eq("id", assetId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          asset_name: data.asset_name,
          asset_type: data.asset_type,
          ticker_symbol: data.ticker_symbol || "",
          quantity: data.quantity.toString(),
          purchase_price: data.purchase_price.toString(),
          current_price: data.current_price?.toString() || "",
          purchase_date: data.purchase_date || "",
          currency: data.currency,
          platform: data.platform || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("Error loading asset:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'actif.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      const assetData = {
        profile_id: profileId,
        asset_name: values.asset_name,
        asset_type: values.asset_type,
        ticker_symbol: values.ticker_symbol || null,
        quantity: parseFloat(values.quantity),
        purchase_price: parseFloat(values.purchase_price),
        current_price: values.current_price ? parseFloat(values.current_price) : parseFloat(values.purchase_price),
        purchase_date: values.purchase_date || null,
        currency: values.currency,
        platform: values.platform || null,
        notes: values.notes || null,
      };

      if (assetId) {
        const { error } = await supabase
          .from("investment_assets")
          .update(assetData)
          .eq("id", assetId);

        if (error) throw error;

        toast({
          title: "Actif mis à jour",
          description: "Les modifications ont été enregistrées.",
        });
      } else {
        const { error } = await supabase
          .from("investment_assets")
          .insert(assetData);

        if (error) throw error;

        toast({
          title: "Actif ajouté",
          description: "L'actif a été ajouté à votre portefeuille.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving asset:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'actif.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass border-border/50 mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {assetId ? "Modifier l'actif" : "Ajouter un actif"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="asset_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'actif</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apple Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="asset_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'actif</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="ticker_symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbole (ticker)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AAPL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plateforme / Broker</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Swissquote, DEGIRO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
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
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix d'achat (unitaire)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix actuel (unitaire)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'achat</FormLabel>
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
                    <Textarea placeholder="Notes ou commentaires..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? "Enregistrement..." : assetId ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InvestmentAssetForm;
