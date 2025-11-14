import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calculator, TrendingDown, Info, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  canton: z.string().min(1, "Veuillez sélectionner un canton"),
  etatCivil: z.string().min(1, "Veuillez sélectionner votre état civil"),
  revenuAnnuel: z.string().min(1, "Veuillez indiquer votre revenu"),
  fortune: z.string().optional(),
  nombreEnfants: z.string().optional(),
  deduction3emePilier: z.string().optional(),
  interetsHypothecaires: z.string().optional(),
  autresDeductions: z.string().optional(),
});

const cantons = [
  { value: "ZH", label: "Zürich", tauxCantonal: 0.08, tauxCommunal: 0.03 },
  { value: "BE", label: "Berne", tauxCantonal: 0.09, tauxCommunal: 0.035 },
  { value: "VD", label: "Vaud", tauxCantonal: 0.095, tauxCommunal: 0.04 },
  { value: "GE", label: "Genève", tauxCantonal: 0.10, tauxCommunal: 0.045 },
  { value: "VS", label: "Valais", tauxCantonal: 0.07, tauxCommunal: 0.025 },
  { value: "FR", label: "Fribourg", tauxCantonal: 0.085, tauxCommunal: 0.03 },
  { value: "NE", label: "Neuchâtel", tauxCantonal: 0.088, tauxCommunal: 0.032 },
  { value: "JU", label: "Jura", tauxCantonal: 0.092, tauxCommunal: 0.035 },
  { value: "TI", label: "Ticino", tauxCantonal: 0.082, tauxCommunal: 0.028 },
  { value: "GR", label: "Grisons", tauxCantonal: 0.075, tauxCommunal: 0.027 },
];

const SimulateurImpots = () => {
  const [results, setResults] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      canton: "",
      etatCivil: "",
      revenuAnnuel: "",
      fortune: "0",
      nombreEnfants: "0",
      deduction3emePilier: "0",
      interetsHypothecaires: "0",
      autresDeductions: "0",
    },
  });

  const calculateTax = (values: z.infer<typeof formSchema>) => {
    const revenu = parseFloat(values.revenuAnnuel) || 0;
    const fortune = parseFloat(values.fortune || "0") || 0;
    const enfants = parseInt(values.nombreEnfants || "0") || 0;
    const pilier3 = parseFloat(values.deduction3emePilier || "0") || 0;
    const interets = parseFloat(values.interetsHypothecaires || "0") || 0;
    const autresDeductions = parseFloat(values.autresDeductions || "0") || 0;

    const deductionsTotal = pilier3 + interets + autresDeductions;
    const deductionEnfants = enfants * 6500;
    const deductionCouple = values.etatCivil === "marie" ? 2600 : 0;

    const revenuImposable = Math.max(0, revenu - deductionsTotal - deductionEnfants - deductionCouple);
    const fortuneImposable = Math.max(0, fortune - 100000);

    // Impôt fédéral direct (IFD) - barème progressif simplifié
    let impotFederal = 0;
    if (revenuImposable > 0) {
      if (revenuImposable <= 31600) {
        impotFederal = 0;
      } else if (revenuImposable <= 72500) {
        impotFederal = (revenuImposable - 31600) * 0.01;
      } else if (revenuImposable <= 103600) {
        impotFederal = 409 + (revenuImposable - 72500) * 0.02;
      } else if (revenuImposable <= 134600) {
        impotFederal = 1031 + (revenuImposable - 103600) * 0.03;
      } else if (revenuImposable <= 176000) {
        impotFederal = 1961 + (revenuImposable - 134600) * 0.04;
      } else {
        impotFederal = 3617 + (revenuImposable - 176000) * 0.055 + (revenuImposable - 176000) * 0.065;
      }
    }

    const cantonData = cantons.find(c => c.value === values.canton);
    const impotCantonal = revenuImposable * (cantonData?.tauxCantonal || 0.08) + fortuneImposable * 0.002;
    const impotCommunal = revenuImposable * (cantonData?.tauxCommunal || 0.03) + fortuneImposable * 0.001;

    const totalImpots = impotFederal + impotCantonal + impotCommunal;
    const tauxEffectif = revenu > 0 ? (totalImpots / revenu) * 100 : 0;

    setResults({
      revenuImposable,
      fortuneImposable,
      deductionsTotal: deductionsTotal + deductionEnfants + deductionCouple,
      impotFederal,
      impotCantonal,
      impotCommunal,
      totalImpots,
      tauxEffectif,
      canton: cantonData?.label || "",
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    calculateTax(values);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Simulateur d'impôts Suisse</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Calculez vos impôts 2024
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Estimez précisément vos impôts fédéraux, cantonaux et communaux selon votre situation personnelle
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Vos informations
                </CardTitle>
                <CardDescription>
                  Remplissez les champs ci-dessous pour calculer vos impôts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="canton"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Canton de résidence *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un canton" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cantons.map((canton) => (
                                  <SelectItem key={canton.value} value={canton.value}>
                                    {canton.label}
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
                        name="etatCivil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>État civil *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="celibataire">Célibataire</SelectItem>
                                <SelectItem value="marie">Marié(e)</SelectItem>
                                <SelectItem value="divorce">Divorcé(e)</SelectItem>
                                <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Revenus et fortune</h3>
                      
                      <FormField
                        control={form.control}
                        name="revenuAnnuel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Revenu annuel brut (CHF) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="80000" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fortune"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fortune totale (CHF)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nombreEnfants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre d'enfants à charge</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Déductions</h3>
                      
                      <FormField
                        control={form.control}
                        name="deduction3emePilier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>3ème pilier A (CHF)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="interetsHypothecaires"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intérêts hypothécaires (CHF)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autresDeductions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Autres déductions (CHF)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <Calculator className="mr-2 h-5 w-5" />
                      Calculer mes impôts
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Résultats et Conseils */}
          <div className="space-y-6">
            {/* Résultats */}
            {results && (
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-primary">Estimation fiscale</CardTitle>
                  <CardDescription>Canton de {results.canton}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Revenu imposable</span>
                      <span className="font-semibold">CHF {results.revenuImposable.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Fortune imposable</span>
                      <span className="font-semibold">CHF {results.fortuneImposable.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Déductions totales</span>
                      <span className="font-semibold text-green-500">- CHF {results.deductionsTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Impôt fédéral direct</span>
                      <span className="font-medium">CHF {results.impotFederal.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Impôt cantonal</span>
                      <span className="font-medium">CHF {results.impotCantonal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Impôt communal</span>
                      <span className="font-medium">CHF {results.impotCommunal.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg text-foreground">Total des impôts</span>
                      <span className="font-bold text-2xl text-primary">CHF {results.totalImpots.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Taux effectif</span>
                      <span className="font-semibold text-accent">{results.tauxEffectif.toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conseils */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingDown className="h-5 w-5" />
                  Conseils d'optimisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">3ème pilier A</h4>
                    <p className="text-sm text-muted-foreground">
                      Cotisez jusqu'à CHF 7'056 par an pour réduire votre revenu imposable
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Frais professionnels</h4>
                    <p className="text-sm text-muted-foreground">
                      Déduisez vos frais de transport, repas et formation continue
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Comparaison cantonale</h4>
                    <p className="text-sm text-muted-foreground">
                      Les charges fiscales varient fortement entre cantons. Vaud, Genève et Berne ont des taux plus élevés
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Planification successorale</h4>
                    <p className="text-sm text-muted-foreground">
                      Anticipez les impôts sur la fortune et les successions avec un conseiller fiscal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-muted/50 border-border/50">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Avertissement :</strong> Cette simulation est indicative et ne remplace pas un conseil fiscal professionnel. 
                  Les calculs sont simplifiés et peuvent varier selon votre situation spécifique, les barèmes communaux précis et 
                  les déductions applicables. Consultez un expert-comptable pour une estimation exacte.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SimulateurImpots;
