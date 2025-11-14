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
  commune: z.string().min(1, "Veuillez sélectionner une commune"),
  etatCivil: z.string().min(1, "Veuillez sélectionner votre état civil"),
  revenuAnnuel: z.string().min(1, "Veuillez indiquer votre revenu"),
  fortune: z.string().optional(),
  nombreEnfants: z.string().optional(),
  deduction3emePilier: z.string().optional(),
  interetsHypothecaires: z.string().optional(),
  autresDeductions: z.string().optional(),
});

const cantons = [
  { value: "ZH", label: "Zürich", tauxCantonal: 1.00, coefficientCantonal: 1.00 },
  { value: "BE", label: "Berne", tauxCantonal: 3.06, coefficientCantonal: 1.00 },
  { value: "VD", label: "Vaud", tauxCantonal: 1.00, coefficientCantonal: 1.00 },
  { value: "GE", label: "Genève", tauxCantonal: 1.00, coefficientCantonal: 45.50 },
  { value: "VS", label: "Valais", tauxCantonal: 1.67, coefficientCantonal: 1.00 },
  { value: "FR", label: "Fribourg", tauxCantonal: 1.00, coefficientCantonal: 1.00 },
  { value: "NE", label: "Neuchâtel", tauxCantonal: 1.00, coefficientCantonal: 1.00 },
  { value: "JU", label: "Jura", tauxCantonal: 1.00, coefficientCantonal: 1.00 },
  { value: "TI", label: "Ticino", tauxCantonal: 1.00, coefficientCantonal: 1.00 },
  { value: "GR", label: "Grisons", tauxCantonal: 1.00, coefficientCantonal: 1.00 },
];

// Communes par canton avec leurs coefficients multiplicateurs réels (2024)
const communesParCanton: Record<string, Array<{ value: string; label: string; coefficientCommunal: number }>> = {
  ZH: [
    { value: "zurich", label: "Zürich", coefficientCommunal: 1.19 },
    { value: "winterthur", label: "Winterthur", coefficientCommunal: 1.22 },
    { value: "uster", label: "Uster", coefficientCommunal: 1.09 },
    { value: "dubendorf", label: "Dübendorf", coefficientCommunal: 1.07 },
    { value: "dietikon", label: "Dietikon", coefficientCommunal: 1.15 },
  ],
  BE: [
    { value: "berne", label: "Berne", coefficientCommunal: 1.54 },
    { value: "biel", label: "Bienne", coefficientCommunal: 1.69 },
    { value: "thun", label: "Thoune", coefficientCommunal: 1.52 },
    { value: "koniz", label: "Köniz", coefficientCommunal: 1.50 },
    { value: "burgdorf", label: "Berthoud", coefficientCommunal: 1.58 },
  ],
  VD: [
    { value: "lausanne", label: "Lausanne", coefficientCommunal: 0.79 },
    { value: "yverdon", label: "Yverdon-les-Bains", coefficientCommunal: 0.78 },
    { value: "montreux", label: "Montreux", coefficientCommunal: 0.72 },
    { value: "vevey", label: "Vevey", coefficientCommunal: 0.77 },
    { value: "nyon", label: "Nyon", coefficientCommunal: 0.71 },
  ],
  GE: [
    { value: "geneve", label: "Genève", coefficientCommunal: 0.455 },
    { value: "vernier", label: "Vernier", coefficientCommunal: 0.46 },
    { value: "lancy", label: "Lancy", coefficientCommunal: 0.45 },
    { value: "meyrin", label: "Meyrin", coefficientCommunal: 0.43 },
    { value: "carouge", label: "Carouge", coefficientCommunal: 0.455 },
  ],
  VS: [
    { value: "sion", label: "Sion", coefficientCommunal: 1.25 },
    { value: "sierre", label: "Sierre", coefficientCommunal: 1.30 },
    { value: "martigny", label: "Martigny", coefficientCommunal: 1.20 },
    { value: "monthey", label: "Monthey", coefficientCommunal: 1.22 },
    { value: "brig", label: "Brigue-Glis", coefficientCommunal: 1.28 },
  ],
  FR: [
    { value: "fribourg", label: "Fribourg", coefficientCommunal: 1.08 },
    { value: "bulle", label: "Bulle", coefficientCommunal: 1.05 },
    { value: "villars", label: "Villars-sur-Glâne", coefficientCommunal: 0.88 },
    { value: "marly", label: "Marly", coefficientCommunal: 0.92 },
    { value: "estavayer", label: "Estavayer-le-Lac", coefficientCommunal: 1.10 },
  ],
  NE: [
    { value: "neuchatel", label: "Neuchâtel", coefficientCommunal: 0.74 },
    { value: "chaux", label: "La Chaux-de-Fonds", coefficientCommunal: 0.76 },
    { value: "locle", label: "Le Locle", coefficientCommunal: 0.78 },
    { value: "val", label: "Val-de-Ruz", coefficientCommunal: 0.69 },
  ],
  JU: [
    { value: "delemont", label: "Delémont", coefficientCommunal: 1.80 },
    { value: "porrentruy", label: "Porrentruy", coefficientCommunal: 1.75 },
    { value: "courrendlin", label: "Courrendlin", coefficientCommunal: 1.70 },
  ],
  TI: [
    { value: "lugano", label: "Lugano", coefficientCommunal: 0.90 },
    { value: "bellinzona", label: "Bellinzone", coefficientCommunal: 0.95 },
    { value: "locarno", label: "Locarno", coefficientCommunal: 0.92 },
    { value: "mendrisio", label: "Mendrisio", coefficientCommunal: 0.88 },
  ],
  GR: [
    { value: "chur", label: "Coire", coefficientCommunal: 1.05 },
    { value: "davos", label: "Davos", coefficientCommunal: 0.95 },
    { value: "stmoritz", label: "Saint-Moritz", coefficientCommunal: 0.80 },
  ],
};

const SimulateurImpots = () => {
  const [results, setResults] = useState<any>(null);
  const [communesDisponibles, setCommunesDisponibles] = useState<Array<{ value: string; label: string; coefficientCommunal: number }>>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      canton: "",
      commune: "",
      etatCivil: "",
      revenuAnnuel: "",
      fortune: "0",
      nombreEnfants: "0",
      deduction3emePilier: "0",
      interetsHypothecaires: "0",
      autresDeductions: "0",
    },
  });

  const selectedCanton = form.watch("canton");

  // Barème officiel de l'impôt fédéral direct 2025 (personne seule)
  const calculateFederalTax = (revenuImposable: number): number => {
    if (revenuImposable < 18500) return 0;
    
    // Barème complet IFD 2025 basé sur le document officiel
    const bareme = [
      { seuil: 18500, impot: 25.41, tauxPar100: 0 },
      { seuil: 19000, impot: 29.26, tauxPar100: 0.77 },
      { seuil: 26000, impot: 83.16, tauxPar100: 0.77 },
      { seuil: 38000, impot: 180.84, tauxPar100: 0.88 },
      { seuil: 50000, impot: 400.80, tauxPar100: 2.64 },
      { seuil: 56000, impot: 559.20, tauxPar100: 2.64 },
      { seuil: 57000, impot: 585.60, tauxPar100: 2.64 },
      { seuil: 58000, impot: 612.00, tauxPar100: 2.64 },
      { seuil: 59000, impot: 638.40, tauxPar100: 2.64 },
      { seuil: 60000, impot: 664.80, tauxPar100: 2.64 },
      { seuil: 61000, impot: 691.20, tauxPar100: 2.64 },
      { seuil: 62000, impot: 717.60, tauxPar100: 2.64 },
      { seuil: 63000, impot: 744.00, tauxPar100: 2.64 },
      { seuil: 64000, impot: 770.40, tauxPar100: 2.64 },
      { seuil: 65000, impot: 796.80, tauxPar100: 2.64 },
      { seuil: 70000, impot: 928.80, tauxPar100: 2.64 },
      { seuil: 75000, impot: 1060.80, tauxPar100: 2.64 },
      { seuil: 80000, impot: 1192.80, tauxPar100: 2.64 },
      { seuil: 85000, impot: 1698.00, tauxPar100: 6.60 },
      { seuil: 90000, impot: 2028.00, tauxPar100: 6.60 },
      { seuil: 95000, impot: 2358.00, tauxPar100: 6.60 },
      { seuil: 100000, impot: 2688.00, tauxPar100: 6.60 },
      { seuil: 105000, impot: 3018.00, tauxPar100: 6.60 },
      { seuil: 108600, impot: 3255.60, tauxPar100: 8.80 },
      { seuil: 110000, impot: 3374.40, tauxPar100: 8.80 },
      { seuil: 115000, impot: 3814.40, tauxPar100: 8.80 },
      { seuil: 120000, impot: 4254.40, tauxPar100: 8.80 },
      { seuil: 125000, impot: 4694.40, tauxPar100: 8.80 },
      { seuil: 130000, impot: 5134.40, tauxPar100: 8.80 },
      { seuil: 135000, impot: 5574.40, tauxPar100: 8.80 },
      { seuil: 138300, impot: 5864.80, tauxPar100: 11.00 },
      { seuil: 141500, impot: 6146.40, tauxPar100: 11.00 },
      { seuil: 144200, impot: 6443.40, tauxPar100: 11.00 },
      { seuil: 148200, impot: 6883.40, tauxPar100: 11.00 },
      { seuil: 150000, impot: 7081.40, tauxPar100: 11.00 },
      { seuil: 155000, impot: 7631.40, tauxPar100: 11.00 },
      { seuil: 160000, impot: 8181.40, tauxPar100: 11.00 },
      { seuil: 170000, impot: 9281.40, tauxPar100: 11.00 },
      { seuil: 184900, impot: 10920.40, tauxPar100: 13.20 },
      { seuil: 200000, impot: 12913.60, tauxPar100: 13.20 },
      { seuil: 250000, impot: 19513.60, tauxPar100: 13.20 },
      { seuil: 300000, impot: 26113.60, tauxPar100: 13.20 },
      { seuil: 400000, impot: 39313.60, tauxPar100: 13.20 },
      { seuil: 500000, impot: 52513.60, tauxPar100: 13.20 },
      { seuil: 600000, impot: 65713.60, tauxPar100: 13.20 },
      { seuil: 700000, impot: 78913.60, tauxPar100: 13.20 },
    ];

    // Trouver la tranche applicable
    let trancheApplicable = bareme[0];
    for (let i = bareme.length - 1; i >= 0; i--) {
      if (revenuImposable >= bareme[i].seuil) {
        trancheApplicable = bareme[i];
        break;
      }
    }

    // Calculer l'impôt: impôt de base + (revenu excédentaire / 100) * taux par 100
    const revenuExcedentaire = revenuImposable - trancheApplicable.seuil;
    const impotSurExcedent = (revenuExcedentaire / 100) * trancheApplicable.tauxPar100;
    
    return trancheApplicable.impot + impotSurExcedent;
  };

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

    // Impôt fédéral direct (IFD) avec barème officiel 2025
    const impotFederal = calculateFederalTax(revenuImposable);

    const cantonData = cantons.find(c => c.value === values.canton);
    const communeData = communesDisponibles.find(c => c.value === values.commune);

    // Calcul de l'impôt cantonal de base (simplifié - environ 6-8% du revenu imposable selon canton)
    const impotCantonalBase = revenuImposable * 0.065 + fortuneImposable * 0.002;
    const impotCantonal = impotCantonalBase * (cantonData?.tauxCantonal || 1.00);

    // Calcul de l'impôt communal avec le coefficient multiplicateur réel
    const impotCommunalBase = revenuImposable * 0.025 + fortuneImposable * 0.001;
    const impotCommunal = impotCommunalBase * (communeData?.coefficientCommunal || 1.00);

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
      commune: communeData?.label || "",
      coefficientCommunal: communeData?.coefficientCommunal || 1.00,
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
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setCommunesDisponibles(communesParCanton[value] || []);
                                form.setValue("commune", "");
                              }} 
                              defaultValue={field.value}
                            >
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
                        name="commune"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commune de résidence *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={!selectedCanton}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une commune" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {communesDisponibles.map((commune) => (
                                  <SelectItem key={commune.value} value={commune.value}>
                                    {commune.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
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
                  <CardDescription>
                    {results.commune}, Canton de {results.canton}
                    <span className="block text-xs mt-1">
                      Coefficient communal: {results.coefficientCommunal}
                    </span>
                  </CardDescription>
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
