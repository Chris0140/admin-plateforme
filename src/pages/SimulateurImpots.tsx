import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calculator, TrendingDown, Info, FileText, Save } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { calculateVaudIncomeTax, calculateVaudWealthTax } from "@/lib/vaudTaxCalculations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
const formSchema = z.object({
  canton: z.string().min(1, "Veuillez sélectionner un canton"),
  commune: z.string().min(1, "Veuillez sélectionner une commune"),
  etatCivil: z.string().min(1, "Veuillez sélectionner votre état civil"),
  confession: z.string().optional(),
  revenuAnnuel: z.string().min(1, "Veuillez indiquer votre revenu"),
  fortune: z.string().optional(),
  nombreEnfants: z.string().optional(),
  deduction3emePilier: z.string().optional(),
  interetsHypothecaires: z.string().optional(),
  autresDeductions: z.string().optional(),
  chargesSociales: z.string().optional()
});

// Taux d'impôt ecclésiastique par canton (en % de centimes additionnels sur l'impôt de base)
const tauxEcclesiastiqueParCanton: Record<string, Record<string, number>> = {
  ZH: {
    catholique: 0.10,
    protestant: 0.10,
    "catholique-chretien": 0.10
  },
  BE: {
    catholique: 0.12,
    protestant: 0.12,
    "catholique-chretien": 0.12
  },
  VD: {
    catholique: 0.08,
    protestant: 0.08
  },
  GE: {
    catholique: 0.07,
    protestant: 0.07
  },
  VS: {
    catholique: 0.09,
    protestant: 0.09
  },
  FR: {
    catholique: 0.11,
    protestant: 0.11,
    "catholique-chretien": 0.11
  },
  NE: {
    catholique: 0.10,
    protestant: 0.10,
    "catholique-chretien": 0.10
  },
  JU: {
    catholique: 0.12,
    protestant: 0.12
  },
  TI: {
    catholique: 0.08,
    protestant: 0.08
  },
  GR: {
    catholique: 0.09,
    protestant: 0.09,
    "catholique-chretien": 0.09
  }
};
const cantons = [{
  value: "GE",
  label: "Genève",
  tauxCantonal: 1.00,
  coefficientCantonal: 45.50
}, {
  value: "VD",
  label: "Vaud",
  tauxCantonal: 1.00,
  coefficientCantonal: 1.00
}];

// Barème officiel de l'impôt sur le revenu 2025 pour Vaud (coefficient 100%)
const baremeRevenuVD2025: Array<{
  revenu: number;
  impot: number;
}> = [{
  revenu: 100,
  impot: 1.00
}, {
  revenu: 1000,
  impot: 10.00
}, {
  revenu: 2000,
  impot: 24.00
}, {
  revenu: 3000,
  impot: 44.00
}, {
  revenu: 4000,
  impot: 70.00
}, {
  revenu: 5000,
  impot: 99.00
}, {
  revenu: 6000,
  impot: 139.00
}, {
  revenu: 7000,
  impot: 179.00
}, {
  revenu: 8000,
  impot: 219.00
}, {
  revenu: 9000,
  impot: 266.00
}, {
  revenu: 10000,
  impot: 313.00
}, {
  revenu: 11000,
  impot: 360.00
}, {
  revenu: 12000,
  impot: 407.00
}, {
  revenu: 13000,
  impot: 454.00
}, {
  revenu: 14000,
  impot: 505.00
}, {
  revenu: 15000,
  impot: 556.00
}, {
  revenu: 16000,
  impot: 607.00
}, {
  revenu: 17000,
  impot: 658.00
}, {
  revenu: 18000,
  impot: 713.00
}, {
  revenu: 19000,
  impot: 768.00
}, {
  revenu: 20000,
  impot: 823.00
}, {
  revenu: 25000,
  impot: 1120.00
}, {
  revenu: 30000,
  impot: 1466.00
}, {
  revenu: 35000,
  impot: 1849.00
}, {
  revenu: 40000,
  impot: 2269.00
}, {
  revenu: 45000,
  impot: 2726.00
}, {
  revenu: 50000,
  impot: 3220.00
}, {
  revenu: 60000,
  impot: 4294.00
}, {
  revenu: 70000,
  impot: 5488.00
}, {
  revenu: 80000,
  impot: 6802.00
}, {
  revenu: 90000,
  impot: 8236.00
}, {
  revenu: 100000,
  impot: 9790.00
}, {
  revenu: 120000,
  impot: 13168.00
}, {
  revenu: 140000,
  impot: 17056.00
}, {
  revenu: 160000,
  impot: 21454.00
}, {
  revenu: 180000,
  impot: 26362.00
}, {
  revenu: 200000,
  impot: 31780.00
}, {
  revenu: 250000,
  impot: 46530.00
}, {
  revenu: 300000,
  impot: 63030.00
}, {
  revenu: 400000,
  impot: 100530.00
}, {
  revenu: 500000,
  impot: 143030.00
}];

// Barème officiel de l'impôt sur la fortune 2025 pour Vaud
const baremeFortuneVD2025: Array<{
  fortune: number;
  impot: number;
}> = [{
  fortune: 50000,
  impot: 22.95
}, {
  fortune: 60000,
  impot: 32.65
}, {
  fortune: 70000,
  impot: 42.35
}, {
  fortune: 80000,
  impot: 52.05
}, {
  fortune: 90000,
  impot: 61.75
}, {
  fortune: 100000,
  impot: 75.05
}, {
  fortune: 120000,
  impot: 108.85
}, {
  fortune: 140000,
  impot: 142.65
}, {
  fortune: 160000,
  impot: 180.45
}, {
  fortune: 180000,
  impot: 218.25
}, {
  fortune: 200000,
  impot: 260.05
}, {
  fortune: 250000,
  impot: 364.80
}, {
  fortune: 300000,
  impot: 479.55
}, {
  fortune: 400000,
  impot: 724.05
}, {
  fortune: 500000,
  impot: 983.55
}, {
  fortune: 600000,
  impot: 1258.05
}, {
  fortune: 700000,
  impot: 1547.55
}, {
  fortune: 800000,
  impot: 1852.05
}, {
  fortune: 900000,
  impot: 2171.55
}, {
  fortune: 1000000,
  impot: 2506.05
}];

// Communes par canton avec leurs coefficients multiplicateurs réels (2024)
const communesParCanton: Record<string, Array<{
  value: string;
  label: string;
  coefficientCommunal: number;
}>> = {
  ZH: [{
    value: "zurich",
    label: "Zürich",
    coefficientCommunal: 1.19
  }, {
    value: "winterthur",
    label: "Winterthur",
    coefficientCommunal: 1.22
  }, {
    value: "uster",
    label: "Uster",
    coefficientCommunal: 1.09
  }, {
    value: "dubendorf",
    label: "Dübendorf",
    coefficientCommunal: 1.07
  }, {
    value: "dietikon",
    label: "Dietikon",
    coefficientCommunal: 1.15
  }, {
    value: "wetzikon",
    label: "Wetzikon",
    coefficientCommunal: 1.12
  }, {
    value: "wadenswil",
    label: "Wädenswil",
    coefficientCommunal: 1.08
  }, {
    value: "kloten",
    label: "Kloten",
    coefficientCommunal: 1.06
  }, {
    value: "buelach",
    label: "Bülach",
    coefficientCommunal: 1.10
  }, {
    value: "horgen",
    label: "Horgen",
    coefficientCommunal: 1.04
  }, {
    value: "regensdorf",
    label: "Regensdorf",
    coefficientCommunal: 1.11
  }, {
    value: "schlieren",
    label: "Schlieren",
    coefficientCommunal: 1.14
  }, {
    value: "volketswil",
    label: "Volketswil",
    coefficientCommunal: 1.09
  }, {
    value: "adliswil",
    label: "Adliswil",
    coefficientCommunal: 1.05
  }, {
    value: "opfikon",
    label: "Opfikon",
    coefficientCommunal: 1.08
  }, {
    value: "meilen",
    label: "Meilen",
    coefficientCommunal: 0.98
  }, {
    value: "thalwil",
    label: "Thalwil",
    coefficientCommunal: 1.01
  }, {
    value: "bassersdorf",
    label: "Bassersdorf",
    coefficientCommunal: 1.07
  }, {
    value: "stafa",
    label: "Stäfa",
    coefficientCommunal: 1.00
  }, {
    value: "maennedorf",
    label: "Männedorf",
    coefficientCommunal: 0.99
  }, {
    value: "illnau-effretikon",
    label: "Illnau-Effretikon",
    coefficientCommunal: 1.13
  }, {
    value: "rapperswil-jona",
    label: "Rapperswil-Jona",
    coefficientCommunal: 1.02
  }, {
    value: "wallisellen",
    label: "Wallisellen",
    coefficientCommunal: 1.10
  }],
  BE: [{
    value: "berne",
    label: "Berne",
    coefficientCommunal: 1.54
  }, {
    value: "biel",
    label: "Bienne",
    coefficientCommunal: 1.69
  }, {
    value: "thun",
    label: "Thoune",
    coefficientCommunal: 1.52
  }, {
    value: "koniz",
    label: "Köniz",
    coefficientCommunal: 1.50
  }, {
    value: "burgdorf",
    label: "Berthoud",
    coefficientCommunal: 1.58
  }, {
    value: "ostermundigen",
    label: "Ostermundigen",
    coefficientCommunal: 1.53
  }, {
    value: "steffisburg",
    label: "Steffisburg",
    coefficientCommunal: 1.49
  }, {
    value: "langenthal",
    label: "Langenthal",
    coefficientCommunal: 1.62
  }, {
    value: "spiez",
    label: "Spiez",
    coefficientCommunal: 1.45
  }, {
    value: "muri",
    label: "Muri bei Bern",
    coefficientCommunal: 1.48
  }, {
    value: "ittigen",
    label: "Ittigen",
    coefficientCommunal: 1.51
  }, {
    value: "lyss",
    label: "Lyss",
    coefficientCommunal: 1.60
  }, {
    value: "belp",
    label: "Belp",
    coefficientCommunal: 1.47
  }, {
    value: "worb",
    label: "Worb",
    coefficientCommunal: 1.46
  }, {
    value: "interlaken",
    label: "Interlaken",
    coefficientCommunal: 1.43
  }, {
    value: "zollikofen",
    label: "Zollikofen",
    coefficientCommunal: 1.52
  }],
  VD: [{
    value: "aigle",
    label: "Aigle",
    coefficientCommunal: 0.66
  }, {
    value: "lausanne",
    label: "Lausanne",
    coefficientCommunal: 0.76
  }, {
    value: "yverdon-les-bains",
    label: "Yverdon-les-Bains",
    coefficientCommunal: 0.78
  }, {
    value: "montreux",
    label: "Montreux",
    coefficientCommunal: 0.68
  }, {
    value: "vevey",
    label: "Vevey",
    coefficientCommunal: 0.73
  }, {
    value: "nyon",
    label: "Nyon",
    coefficientCommunal: 0.66
  }, {
    value: "renens",
    label: "Renens",
    coefficientCommunal: 0.79
  }, {
    value: "pully",
    label: "Pully",
    coefficientCommunal: 0.67
  }, {
    value: "morges",
    label: "Morges",
    coefficientCommunal: 0.72
  }, {
    value: "prilly",
    label: "Prilly",
    coefficientCommunal: 0.77
  }, {
    value: "ecublens",
    label: "Ecublens",
    coefficientCommunal: 0.75
  }, {
    value: "gland",
    label: "Gland",
    coefficientCommunal: 0.64
  }, {
    value: "payerne",
    label: "Payerne",
    coefficientCommunal: 0.70
  }, {
    value: "lutry",
    label: "Lutry",
    coefficientCommunal: 0.72
  }, {
    value: "epalinges",
    label: "Epalinges",
    coefficientCommunal: 0.71
  }, {
    value: "rolle",
    label: "Rolle",
    coefficientCommunal: 0.69
  }, {
    value: "crissier",
    label: "Crissier",
    coefficientCommunal: 0.73
  }, {
    value: "bex",
    label: "Bex",
    coefficientCommunal: 0.71
  }, {
    value: "la-tour-de-peilz",
    label: "La Tour-de-Peilz",
    coefficientCommunal: 0.71
  }, {
    value: "cossonay",
    label: "Cossonay",
    coefficientCommunal: 0.76
  }],
  GE: [{
    value: "geneve",
    label: "Genève",
    coefficientCommunal: 0.455
  }, {
    value: "vernier",
    label: "Vernier",
    coefficientCommunal: 0.46
  }, {
    value: "lancy",
    label: "Lancy",
    coefficientCommunal: 0.45
  }, {
    value: "meyrin",
    label: "Meyrin",
    coefficientCommunal: 0.43
  }, {
    value: "carouge",
    label: "Carouge",
    coefficientCommunal: 0.455
  }, {
    value: "thonex",
    label: "Thônex",
    coefficientCommunal: 0.44
  }, {
    value: "versoix",
    label: "Versoix",
    coefficientCommunal: 0.41
  }, {
    value: "onex",
    label: "Onex",
    coefficientCommunal: 0.46
  }, {
    value: "chene-bougeries",
    label: "Chêne-Bougeries",
    coefficientCommunal: 0.39
  }, {
    value: "plan-les-ouates",
    label: "Plan-les-Ouates",
    coefficientCommunal: 0.42
  }, {
    value: "grand-saconnex",
    label: "Le Grand-Saconnex",
    coefficientCommunal: 0.42
  }, {
    value: "bernex",
    label: "Bernex",
    coefficientCommunal: 0.45
  }, {
    value: "chene-bourg",
    label: "Chêne-Bourg",
    coefficientCommunal: 0.44
  }, {
    value: "aniere",
    label: "Anières",
    coefficientCommunal: 0.37
  }, {
    value: "confignon",
    label: "Confignon",
    coefficientCommunal: 0.43
  }, {
    value: "pregny-chambesy",
    label: "Pregny-Chambésy",
    coefficientCommunal: 0.36
  }, {
    value: "bellevue",
    label: "Bellevue",
    coefficientCommunal: 0.38
  }, {
    value: "cologny",
    label: "Cologny",
    coefficientCommunal: 0.35
  }, {
    value: "veyrier",
    label: "Veyrier",
    coefficientCommunal: 0.42
  }, {
    value: "aire-la-ville",
    label: "Aire-la-Ville",
    coefficientCommunal: 0.40
  }, {
    value: "bardonnex",
    label: "Bardonnex",
    coefficientCommunal: 0.41
  }, {
    value: "cartigny",
    label: "Cartigny",
    coefficientCommunal: 0.42
  }, {
    value: "collonge-bellerive",
    label: "Collonge-Bellerive",
    coefficientCommunal: 0.38
  }, {
    value: "perly-certoux",
    label: "Perly-Certoux",
    coefficientCommunal: 0.43
  }, {
    value: "avully",
    label: "Avully",
    coefficientCommunal: 0.41
  }, {
    value: "avusy",
    label: "Avusy",
    coefficientCommunal: 0.42
  }, {
    value: "hermance",
    label: "Hermance",
    coefficientCommunal: 0.37
  }, {
    value: "jussy",
    label: "Jussy",
    coefficientCommunal: 0.39
  }, {
    value: "laconnex",
    label: "Laconnex",
    coefficientCommunal: 0.41
  }, {
    value: "russin",
    label: "Russin",
    coefficientCommunal: 0.40
  }, {
    value: "satigny",
    label: "Satigny",
    coefficientCommunal: 0.43
  }, {
    value: "soral",
    label: "Soral",
    coefficientCommunal: 0.40
  }, {
    value: "troinex",
    label: "Troinex",
    coefficientCommunal: 0.41
  }, {
    value: "vandoeuvres",
    label: "Vandœuvres",
    coefficientCommunal: 0.36
  }],
  VS: [{
    value: "sion",
    label: "Sion",
    coefficientCommunal: 1.25
  }, {
    value: "sierre",
    label: "Sierre",
    coefficientCommunal: 1.30
  }, {
    value: "martigny",
    label: "Martigny",
    coefficientCommunal: 1.20
  }, {
    value: "monthey",
    label: "Monthey",
    coefficientCommunal: 1.22
  }, {
    value: "brig",
    label: "Brigue-Glis",
    coefficientCommunal: 1.15
  }, {
    value: "naters",
    label: "Naters",
    coefficientCommunal: 1.18
  }, {
    value: "visp",
    label: "Viège",
    coefficientCommunal: 1.17
  }, {
    value: "conthey",
    label: "Conthey",
    coefficientCommunal: 1.23
  }, {
    value: "collombey-muraz",
    label: "Collombey-Muraz",
    coefficientCommunal: 1.21
  }, {
    value: "bagnes",
    label: "Bagnes",
    coefficientCommunal: 1.10
  }, {
    value: "saillon",
    label: "Saillon",
    coefficientCommunal: 1.24
  }, {
    value: "vionnaz",
    label: "Vionnaz",
    coefficientCommunal: 1.19
  }, {
    value: "crans-montana",
    label: "Crans-Montana",
    coefficientCommunal: 1.12
  }, {
    value: "fully",
    label: "Fully",
    coefficientCommunal: 1.22
  }],
  FR: [{
    value: "fribourg",
    label: "Fribourg",
    coefficientCommunal: 1.12
  }, {
    value: "bulle",
    label: "Bulle",
    coefficientCommunal: 1.15
  }, {
    value: "villars",
    label: "Villars-sur-Glâne",
    coefficientCommunal: 1.08
  }, {
    value: "marly",
    label: "Marly",
    coefficientCommunal: 1.10
  }, {
    value: "givisiez",
    label: "Givisiez",
    coefficientCommunal: 1.09
  }, {
    value: "granges-paccot",
    label: "Granges-Paccot",
    coefficientCommunal: 1.11
  }, {
    value: "estavayer-le-lac",
    label: "Estavayer-le-Lac",
    coefficientCommunal: 1.14
  }, {
    value: "murten",
    label: "Morat",
    coefficientCommunal: 1.13
  }, {
    value: "romont",
    label: "Romont",
    coefficientCommunal: 1.16
  }, {
    value: "tafers",
    label: "Tavel",
    coefficientCommunal: 1.10
  }],
  NE: [{
    value: "neuchatel",
    label: "Neuchâtel",
    coefficientCommunal: 0.72
  }, {
    value: "chaux",
    label: "La Chaux-de-Fonds",
    coefficientCommunal: 0.75
  }, {
    value: "locle",
    label: "Le Locle",
    coefficientCommunal: 0.78
  }, {
    value: "val",
    label: "Val-de-Ruz",
    coefficientCommunal: 0.69
  }, {
    value: "boudry",
    label: "Boudry",
    coefficientCommunal: 0.71
  }, {
    value: "marin-epagnier",
    label: "Marin-Epagnier",
    coefficientCommunal: 0.68
  }, {
    value: "peseux",
    label: "Peseux",
    coefficientCommunal: 0.70
  }, {
    value: "corcelles-cormondrèche",
    label: "Corcelles-Cormondrèche",
    coefficientCommunal: 0.70
  }],
  JU: [{
    value: "delemont",
    label: "Delémont",
    coefficientCommunal: 1.80
  }, {
    value: "porrentruy",
    label: "Porrentruy",
    coefficientCommunal: 1.75
  }, {
    value: "courrendlin",
    label: "Courrendlin",
    coefficientCommunal: 1.70
  }, {
    value: "courfaivre",
    label: "Courfaivre",
    coefficientCommunal: 1.72
  }, {
    value: "alle",
    label: "Alle",
    coefficientCommunal: 1.73
  }, {
    value: "courtedoux",
    label: "Courtedoux",
    coefficientCommunal: 1.74
  }],
  TI: [{
    value: "lugano",
    label: "Lugano",
    coefficientCommunal: 0.90
  }, {
    value: "bellinzona",
    label: "Bellinzone",
    coefficientCommunal: 0.95
  }, {
    value: "locarno",
    label: "Locarno",
    coefficientCommunal: 0.92
  }, {
    value: "mendrisio",
    label: "Mendrisio",
    coefficientCommunal: 0.88
  }, {
    value: "chiasso",
    label: "Chiasso",
    coefficientCommunal: 0.91
  }, {
    value: "paradiso",
    label: "Paradiso",
    coefficientCommunal: 0.87
  }, {
    value: "biasca",
    label: "Biasca",
    coefficientCommunal: 0.94
  }, {
    value: "ascona",
    label: "Ascona",
    coefficientCommunal: 0.85
  }, {
    value: "massagno",
    label: "Massagno",
    coefficientCommunal: 0.89
  }],
  GR: [{
    value: "chur",
    label: "Coire",
    coefficientCommunal: 1.05
  }, {
    value: "davos",
    label: "Davos",
    coefficientCommunal: 0.95
  }, {
    value: "stmoritz",
    label: "Saint-Moritz",
    coefficientCommunal: 0.80
  }, {
    value: "arosa",
    label: "Arosa",
    coefficientCommunal: 0.90
  }, {
    value: "ilanz",
    label: "Ilanz/Glion",
    coefficientCommunal: 1.02
  }, {
    value: "thusis",
    label: "Thusis",
    coefficientCommunal: 1.00
  }, {
    value: "landquart",
    label: "Landquart",
    coefficientCommunal: 1.03
  }]
};
const SimulateurImpots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [communesDisponibles, setCommunesDisponibles] = useState<Array<{
    value: string;
    label: string;
    coefficientCommunal: number;
  }>>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      canton: "",
      commune: "",
      etatCivil: "",
      confession: "aucune",
      revenuAnnuel: "",
      fortune: "0",
      nombreEnfants: "0",
      deduction3emePilier: "0",
      interetsHypothecaires: "0",
      autresDeductions: "0",
      chargesSociales: "0"
    }
  });
  const selectedCanton = form.watch("canton");

  // Charger les données fiscales et budget existantes au démarrage
  useEffect(() => {
    const loadTaxData = async () => {
      if (!user) return;

      try {
        // Charger les données fiscales
        const { data: taxData, error: taxError } = await supabase
          .from("tax_data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (taxError) throw taxError;

        // Charger les données de budget
        const { data: budgetData, error: budgetError } = await supabase
          .from("budget_data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (budgetError) throw budgetError;

        if (taxData) {
          // Préremplir le formulaire avec les données fiscales existantes
          form.reset({
            canton: taxData.canton,
            commune: taxData.commune,
            etatCivil: taxData.etat_civil,
            confession: taxData.confession || "aucune",
            revenuAnnuel: taxData.revenu_annuel.toString(),
            fortune: taxData.fortune.toString(),
            nombreEnfants: taxData.nombre_enfants.toString(),
            deduction3emePilier: taxData.deduction_3eme_pilier.toString(),
            interetsHypothecaires: taxData.interets_hypothecaires.toString(),
            autresDeductions: taxData.autres_deductions.toString(),
            chargesSociales: taxData.charges_sociales.toString(),
          });

          // Charger les communes pour le canton sélectionné
          if (communesParCanton[taxData.canton]) {
            setCommunesDisponibles(communesParCanton[taxData.canton]);
          }
        } else if (budgetData) {
          // Si pas de données fiscales, utiliser les données de budget
          const revenuAnnuel = budgetData.revenu_brut_annuel || 0;
          const chargesSociales = budgetData.charges_sociales_annuel || 0;

          form.reset({
            canton: "",
            commune: "",
            etatCivil: "",
            confession: "aucune",
            revenuAnnuel: revenuAnnuel.toString(),
            fortune: "0",
            nombreEnfants: "0",
            deduction3emePilier: "0",
            interetsHypothecaires: "0",
            autresDeductions: "0",
            chargesSociales: chargesSociales.toString(),
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    loadTaxData();
  }, [user]);

  const saveTaxData = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour sauvegarder vos données",
      });
      return;
    }

    if (!results) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez d'abord calculer vos impôts",
      });
      return;
    }

    setIsSaving(true);
    try {
      const formValues = form.getValues();
      const { data: existingData } = await supabase
        .from("tax_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const taxData = {
        user_id: user.id,
        canton: formValues.canton,
        commune: formValues.commune,
        etat_civil: formValues.etatCivil,
        confession: formValues.confession || null,
        revenu_annuel: parseFloat(formValues.revenuAnnuel) || 0,
        fortune: parseFloat(formValues.fortune || "0") || 0,
        nombre_enfants: parseInt(formValues.nombreEnfants || "0") || 0,
        deduction_3eme_pilier: parseFloat(formValues.deduction3emePilier || "0") || 0,
        interets_hypothecaires: parseFloat(formValues.interetsHypothecaires || "0") || 0,
        autres_deductions: parseFloat(formValues.autresDeductions || "0") || 0,
        charges_sociales: parseFloat(formValues.chargesSociales || "0") || 0,
        impot_federal: results.impotFederal || 0,
        impot_cantonal: results.impotCantonal || 0,
        impot_communal: results.impotCommunal || 0,
        impot_ecclesiastique: results.impotEcclesiastique || 0,
        impot_fortune: results.impotFortune || 0,
        total_impots: results.totalImpots || 0,
      };

      if (existingData) {
        const { error } = await supabase
          .from("tax_data")
          .update(taxData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tax_data")
          .insert(taxData);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Données fiscales sauvegardées dans votre profil",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder vos données",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Barème Genève 2024 - Impôt de base sur le revenu (indice 108.7)
  const baremeGeneve2024 = [{
    seuilMin: 0,
    seuilMax: 18479,
    taux: 0,
    impotCumul: 0
  }, {
    seuilMin: 18480,
    seuilMax: 22264,
    taux: 8.0,
    impotCumul: 0
  }, {
    seuilMin: 22265,
    seuilMax: 24491,
    taux: 9.0,
    impotCumul: 302.80
  }, {
    seuilMin: 24492,
    seuilMax: 26717,
    taux: 10.0,
    impotCumul: 503.25
  }, {
    seuilMin: 26718,
    seuilMax: 28943,
    taux: 11.0,
    impotCumul: 725.85
  }, {
    seuilMin: 28944,
    seuilMax: 34509,
    taux: 12.0,
    impotCumul: 970.70
  }, {
    seuilMin: 34510,
    seuilMax: 38962,
    taux: 13.0,
    impotCumul: 1638.60
  }, {
    seuilMin: 38963,
    seuilMax: 43416,
    taux: 14.0,
    impotCumul: 2217.50
  }, {
    seuilMin: 43417,
    seuilMax: 47868,
    taux: 14.5,
    impotCumul: 2841.05
  }, {
    seuilMin: 47869,
    seuilMax: 76811,
    taux: 15.0,
    impotCumul: 3486.60
  }, {
    seuilMin: 76812,
    seuilMax: 125793,
    taux: 15.5,
    impotCumul: 7828.05
  }, {
    seuilMin: 125794,
    seuilMax: 169208,
    taux: 16.0,
    impotCumul: 15420.25
  }, {
    seuilMin: 169209,
    seuilMax: 191473,
    taux: 16.5,
    impotCumul: 22366.65
  }, {
    seuilMin: 191474,
    seuilMax: 273850,
    taux: 17.0,
    impotCumul: 26040.40
  }, {
    seuilMin: 273851,
    seuilMax: 291661,
    taux: 17.5,
    impotCumul: 40044.50
  }, {
    seuilMin: 291662,
    seuilMax: 410775,
    taux: 18.0,
    impotCumul: 43161.45
  }, {
    seuilMin: 410776,
    seuilMax: 643435,
    taux: 18.5,
    impotCumul: 64601.95
  }, {
    seuilMin: 643436,
    seuilMax: Infinity,
    taux: 19.0,
    impotCumul: 107644.05
  }];

  // Calcul de l'impôt cantonal et communal pour Genève selon le barème officiel 2024
  const calculateGenevaTax = (revenuNet: number, etatCivil: string, coefficientCommunal: number, confession?: string): {
    impotCantonal: number;
    impotCommunal: number;
    impotBase: number;
    impotEcclesiastique: number;
  } => {
    // Déterminer le coefficient de splitting selon la situation
    let splittingCoeff = 1.0;
    if (etatCivil === "marie") {
      splittingCoeff = 0.5; // Splitting intégral (50%)
    } else if (etatCivil === "parent") {
      splittingCoeff = 0.5556; // Splitting partiel (55.56%)
    }

    // Revenu servant au calcul du taux
    const revenuPourTaux = revenuNet * splittingCoeff;

    // Trouver la tranche applicable
    let trancheIndex = 0;
    for (let i = 0; i < baremeGeneve2024.length; i++) {
      if (revenuPourTaux <= baremeGeneve2024[i].seuilMax) {
        trancheIndex = i;
        break;
      }
    }
    const tranche = baremeGeneve2024[trancheIndex];

    // Calculer l'impôt de base
    let impotBase = 0;
    if (tranche.taux === 0) {
      impotBase = 0;
    } else {
      // Impôt cumulé des tranches précédentes + impôt sur la différence
      const difference = revenuPourTaux - tranche.seuilMin;
      impotBase = tranche.impotCumul + difference * tranche.taux / 100;
    }

    // Si splitting appliqué, multiplier par le ratio
    if (splittingCoeff < 1.0) {
      impotBase = revenuNet / revenuPourTaux * impotBase;
    }

    // Appliquer la réduction de 12% (art. loi du 26 septembre 1999)
    const impotBaseReduit = impotBase * 0.88;

    // Calcul de l'impôt cantonal
    // Centimes additionnels cantonaux: 47.5% de l'impôt de base
    const centimesCantonal = impotBase * 0.475;
    // Centime additionnel cantonal supplémentaire pour l'aide à domicile: 1%
    const supplementAideDomicile = impotBase * 0.01;
    const impotCantonal = impotBaseReduit + centimesCantonal + supplementAideDomicile;

    // Calcul de l'impôt communal
    // Centimes additionnels communaux (calculés sur l'impôt de base, pas le réduit)
    const centimesCommunal = impotBase * coefficientCommunal;
    const impotCommunal = centimesCommunal;

    // Calcul de l'impôt ecclésiastique (culte) pour Genève
    // Taux: 7 centimes additionnels sur l'impôt de base pour les confessions reconnues
    let impotEcclesiastique = 0;
    const tauxEcclesiastique = confession && tauxEcclesiastiqueParCanton.GE?.[confession];
    if (tauxEcclesiastique) {
      impotEcclesiastique = impotBase * tauxEcclesiastique;
    }
    return {
      impotBase,
      impotCantonal: Math.round(impotCantonal * 100) / 100,
      impotCommunal: Math.round(impotCommunal * 100) / 100,
      impotEcclesiastique: Math.round(impotEcclesiastique * 100) / 100
    };
  };

  // Calcul de l'impôt ecclésiastique pour les autres cantons (basé sur l'impôt cantonal)
  const calculateEcclesiasticalTax = (impotCantonal: number, canton: string, confession?: string): number => {
    if (!confession || confession === "aucune" || !tauxEcclesiastiqueParCanton[canton]) {
      return 0;
    }
    const tauxEcclesiastique = tauxEcclesiastiqueParCanton[canton][confession];
    if (!tauxEcclesiastique) {
      return 0;
    }

    // Pour les autres cantons, l'impôt ecclésiastique est généralement calculé comme un pourcentage de l'impôt cantonal
    return Math.round(impotCantonal * tauxEcclesiastique * 100) / 100;
  };

  // Barème officiel de l'impôt fédéral direct 2025 (personne seule)
  const calculateFederalTax = (revenuImposable: number): number => {
    if (revenuImposable < 18500) return 0;

    // Barème complet IFD 2025 basé sur le document officiel
    const bareme = [{
      seuil: 18500,
      impot: 25.41,
      tauxPar100: 0
    }, {
      seuil: 19000,
      impot: 29.26,
      tauxPar100: 0.77
    }, {
      seuil: 26000,
      impot: 83.16,
      tauxPar100: 0.77
    }, {
      seuil: 38000,
      impot: 180.84,
      tauxPar100: 0.88
    }, {
      seuil: 50000,
      impot: 400.80,
      tauxPar100: 2.64
    }, {
      seuil: 56000,
      impot: 559.20,
      tauxPar100: 2.64
    }, {
      seuil: 57000,
      impot: 585.60,
      tauxPar100: 2.64
    }, {
      seuil: 58000,
      impot: 612.00,
      tauxPar100: 2.64
    }, {
      seuil: 59000,
      impot: 638.40,
      tauxPar100: 2.64
    }, {
      seuil: 60000,
      impot: 664.80,
      tauxPar100: 2.64
    }, {
      seuil: 61000,
      impot: 691.20,
      tauxPar100: 2.64
    }, {
      seuil: 62000,
      impot: 717.60,
      tauxPar100: 2.64
    }, {
      seuil: 63000,
      impot: 744.00,
      tauxPar100: 2.64
    }, {
      seuil: 64000,
      impot: 770.40,
      tauxPar100: 2.64
    }, {
      seuil: 65000,
      impot: 796.80,
      tauxPar100: 2.64
    }, {
      seuil: 70000,
      impot: 928.80,
      tauxPar100: 2.64
    }, {
      seuil: 75000,
      impot: 1060.80,
      tauxPar100: 2.64
    }, {
      seuil: 80000,
      impot: 1192.80,
      tauxPar100: 2.64
    }, {
      seuil: 85000,
      impot: 1698.00,
      tauxPar100: 6.60
    }, {
      seuil: 90000,
      impot: 2028.00,
      tauxPar100: 6.60
    }, {
      seuil: 95000,
      impot: 2358.00,
      tauxPar100: 6.60
    }, {
      seuil: 100000,
      impot: 2688.00,
      tauxPar100: 6.60
    }, {
      seuil: 105000,
      impot: 3018.00,
      tauxPar100: 6.60
    }, {
      seuil: 108600,
      impot: 3255.60,
      tauxPar100: 8.80
    }, {
      seuil: 110000,
      impot: 3374.40,
      tauxPar100: 8.80
    }, {
      seuil: 115000,
      impot: 3814.40,
      tauxPar100: 8.80
    }, {
      seuil: 120000,
      impot: 4254.40,
      tauxPar100: 8.80
    }, {
      seuil: 125000,
      impot: 4694.40,
      tauxPar100: 8.80
    }, {
      seuil: 130000,
      impot: 5134.40,
      tauxPar100: 8.80
    }, {
      seuil: 135000,
      impot: 5574.40,
      tauxPar100: 8.80
    }, {
      seuil: 138300,
      impot: 5864.80,
      tauxPar100: 11.00
    }, {
      seuil: 141500,
      impot: 6146.40,
      tauxPar100: 11.00
    }, {
      seuil: 144200,
      impot: 6443.40,
      tauxPar100: 11.00
    }, {
      seuil: 148200,
      impot: 6883.40,
      tauxPar100: 11.00
    }, {
      seuil: 150000,
      impot: 7081.40,
      tauxPar100: 11.00
    }, {
      seuil: 155000,
      impot: 7631.40,
      tauxPar100: 11.00
    }, {
      seuil: 160000,
      impot: 8181.40,
      tauxPar100: 11.00
    }, {
      seuil: 170000,
      impot: 9281.40,
      tauxPar100: 11.00
    }, {
      seuil: 184900,
      impot: 10920.40,
      tauxPar100: 13.20
    }, {
      seuil: 200000,
      impot: 12913.60,
      tauxPar100: 13.20
    }, {
      seuil: 250000,
      impot: 19513.60,
      tauxPar100: 13.20
    }, {
      seuil: 300000,
      impot: 26113.60,
      tauxPar100: 13.20
    }, {
      seuil: 400000,
      impot: 39313.60,
      tauxPar100: 13.20
    }, {
      seuil: 500000,
      impot: 52513.60,
      tauxPar100: 13.20
    }, {
      seuil: 600000,
      impot: 65713.60,
      tauxPar100: 13.20
    }, {
      seuil: 700000,
      impot: 78913.60,
      tauxPar100: 13.20
    }];

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
    const impotSurExcedent = revenuExcedentaire / 100 * trancheApplicable.tauxPar100;
    return trancheApplicable.impot + impotSurExcedent;
  };
  const calculateTax = (values: z.infer<typeof formSchema>) => {
    const revenu = parseFloat(values.revenuAnnuel) || 0;
    const fortune = parseFloat(values.fortune || "0") || 0;
    const enfants = parseInt(values.nombreEnfants || "0") || 0;
    const pilier3 = parseFloat(values.deduction3emePilier || "0") || 0;
    const interets = parseFloat(values.interetsHypothecaires || "0") || 0;
    const autresDeductions = parseFloat(values.autresDeductions || "0") || 0;
    const chargesSociales = parseFloat(values.chargesSociales || "0") || 0;

    // Soustraire les charges sociales du revenu brut
    const revenuNetAvantDeductions = Math.max(0, revenu - chargesSociales);
    const deductionsTotal = pilier3 + interets + autresDeductions;
    const deductionEnfants = enfants * 6500;
    const deductionCouple = values.etatCivil === "marie" ? 2600 : 0;
    const revenuImposable = Math.max(0, revenuNetAvantDeductions - deductionsTotal - deductionEnfants - deductionCouple);
    const fortuneImposable = Math.max(0, fortune - 100000);

    // Impôt fédéral direct (IFD) avec barème officiel 2025
    const impotFederal = calculateFederalTax(revenuImposable);
    const cantonData = cantons.find(c => c.value === values.canton);
    const communeData = communesDisponibles.find(c => c.value === values.commune);
    let impotCantonal = 0;
    let impotCommunal = 0;

    // Calcul spécifique par canton
    let impotEcclesiastique = 0;
    if (values.canton === "GE") {
      const genevaResult = calculateGenevaTax(revenuImposable, values.etatCivil, communeData?.coefficientCommunal || 0.455, values.confession);
      impotCantonal = genevaResult.impotCantonal;
      impotCommunal = genevaResult.impotCommunal;
      impotEcclesiastique = genevaResult.impotEcclesiastique;
    } else if (values.canton === "VD") {
      // Barème officiel 2025 pour Vaud
      const impotRevenuBase = calculateVaudIncomeTax(revenuImposable);
      const impotFortuneBase = calculateVaudWealthTax(fortuneImposable);
      const impotBase = impotRevenuBase + impotFortuneBase;
      impotCantonal = impotBase;
      impotCommunal = impotBase * (communeData?.coefficientCommunal || 0.70);
      impotEcclesiastique = calculateEcclesiasticalTax(impotCantonal, values.canton, values.confession);
    } else {
      // Calcul simplifié pour les autres cantons
      const impotCantonalBase = revenuImposable * 0.065 + fortuneImposable * 0.002;
      impotCantonal = impotCantonalBase * (cantonData?.tauxCantonal || 1.00);
      const impotCommunalBase = revenuImposable * 0.025 + fortuneImposable * 0.001;
      impotCommunal = impotCommunalBase * (communeData?.coefficientCommunal || 1.00);
      impotEcclesiastique = calculateEcclesiasticalTax(impotCantonal, values.canton, values.confession);
    }
    const totalImpots = impotFederal + impotCantonal + impotCommunal + impotEcclesiastique;
    const tauxEffectif = revenu > 0 ? totalImpots / revenu * 100 : 0;

    // Calcul des impôts sans déduction 3ème pilier pour voir l'économie
    let totalImpotsSansPilier3 = totalImpots;
    let economiePilier3 = 0;
    if (pilier3 > 0) {
      const revenuImposableSansPilier3 = Math.max(0, revenuNetAvantDeductions - (deductionsTotal - pilier3) - deductionEnfants - deductionCouple);
      const impotFederalSansPilier3 = calculateFederalTax(revenuImposableSansPilier3);
      let impotCantonalSansPilier3 = 0;
      let impotCommunalSansPilier3 = 0;
      let impotEcclesiastiqueSansPilier3 = 0;
      if (values.canton === "GE") {
        const genevaResult = calculateGenevaTax(revenuImposableSansPilier3, values.etatCivil, communeData?.coefficientCommunal || 0.455, values.confession);
        impotCantonalSansPilier3 = genevaResult.impotCantonal;
        impotCommunalSansPilier3 = genevaResult.impotCommunal;
        impotEcclesiastiqueSansPilier3 = genevaResult.impotEcclesiastique;
      } else if (values.canton === "VD") {
        const impotRevenuBase = calculateVaudIncomeTax(revenuImposableSansPilier3);
        const impotFortuneBase = calculateVaudWealthTax(fortuneImposable);
        const impotBase = impotRevenuBase + impotFortuneBase;
        impotCantonalSansPilier3 = impotBase;
        impotCommunalSansPilier3 = impotBase * (communeData?.coefficientCommunal || 0.70);
        impotEcclesiastiqueSansPilier3 = calculateEcclesiasticalTax(impotCantonalSansPilier3, values.canton, values.confession);
      } else {
        const impotCantonalBase = revenuImposableSansPilier3 * 0.065 + fortuneImposable * 0.002;
        impotCantonalSansPilier3 = impotCantonalBase * (cantonData?.tauxCantonal || 1.00);
        const impotCommunalBase = revenuImposableSansPilier3 * 0.025 + fortuneImposable * 0.001;
        impotCommunalSansPilier3 = impotCommunalBase * (communeData?.coefficientCommunal || 1.00);
        impotEcclesiastiqueSansPilier3 = calculateEcclesiasticalTax(impotCantonalSansPilier3, values.canton, values.confession);
      }
      totalImpotsSansPilier3 = impotFederalSansPilier3 + impotCantonalSansPilier3 + impotCommunalSansPilier3 + impotEcclesiastiqueSansPilier3;
      economiePilier3 = totalImpotsSansPilier3 - totalImpots;
    }
    setResults({
      revenuImposable,
      fortuneImposable,
      deductionsTotal: chargesSociales + deductionsTotal + deductionEnfants + deductionCouple,
      impotFederal,
      impotCantonal,
      impotCommunal,
      impotEcclesiastique,
      totalImpots,
      tauxEffectif,
      economiePilier3,
      canton: cantonData?.label || "",
      commune: communeData?.label || "",
      coefficientCommunal: communeData?.coefficientCommunal || 1.00
    });
  };
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    calculateTax(values);
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Simulateur d'impôts </span>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Calculez vos impôts 2025
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Estimez précisément vos impôts fédéraux, cantonaux et communaux selon votre situation personnelle
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Formulaire */}
          <div className="md:col-span-2">
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
                      <FormField control={form.control} name="canton" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Canton de résidence *</FormLabel>
                            <Select onValueChange={value => {
                        field.onChange(value);
                        setCommunesDisponibles(communesParCanton[value] || []);
                        form.setValue("commune", "");
                      }} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un canton" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cantons.map(canton => <SelectItem key={canton.value} value={canton.value}>
                                    {canton.label}
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="commune" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Commune de résidence *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCanton}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une commune" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {communesDisponibles.map(commune => <SelectItem key={commune.value} value={commune.value}>
                                    {commune.label}
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="etatCivil" render={({
                      field
                    }) => <FormItem>
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
                                <SelectItem value="parent">Parent seul avec enfants</SelectItem>
                                <SelectItem value="divorce">Divorcé(e)</SelectItem>
                                <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="confession" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Confession</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Aucune" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="aucune">Aucune</SelectItem>
                                <SelectItem value="catholique">Catholique romaine</SelectItem>
                                <SelectItem value="protestant">Protestante / Réformée évangélique</SelectItem>
                                <SelectItem value="catholique-chretien">Catholique-chrétienne</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Revenus et fortune</h3>
                      
                      <FormField control={form.control} name="revenuAnnuel" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Revenu annuel brut (CHF) *</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="80'000" value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""} onChange={e => {
                          let value = e.target.value.replace(/'/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            value = value.replace(/^0+(?=\d)/, '');
                            field.onChange(value);
                          }
                        }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="fortune" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Fortune totale (CHF)</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="0" value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""} onChange={e => {
                          let value = e.target.value.replace(/'/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            value = value.replace(/^0+(?=\d)/, '');
                            field.onChange(value);
                          }
                        }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="nombreEnfants" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Nombre d'enfants à charge</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Déductions</h3>
                      
                      <FormField control={form.control} name="chargesSociales" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Charges sociales (CHF)</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="0" value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""} onChange={e => {
                          let value = e.target.value.replace(/'/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            value = value.replace(/^0+(?=\d)/, '');
                            field.onChange(value);
                          }
                        }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="deduction3emePilier" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>3ème pilier A (CHF)</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="7'258" value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""} onChange={e => {
                          let value = e.target.value.replace(/'/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            value = value.replace(/^0+(?=\d)/, '');
                            field.onChange(value);
                          }
                        }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="interetsHypothecaires" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Intérêts hypothécaires (CHF)</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="0" value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""} onChange={e => {
                          let value = e.target.value.replace(/'/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            value = value.replace(/^0+(?=\d)/, '');
                            field.onChange(value);
                          }
                        }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="autresDeductions" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Autres déductions (CHF)</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="0" value={field.value ? field.value.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : ""} onChange={e => {
                          let value = e.target.value.replace(/'/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            value = value.replace(/^0+(?=\d)/, '');
                            field.onChange(value);
                          }
                        }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
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
            {results && <Card className="bg-card border-border shadow-lg">
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

                    {results.impotEcclesiastique > 0 && <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Impôt ecclésiastique (culte)</span>
                        <span className="font-medium">CHF {results.impotEcclesiastique.toLocaleString()}</span>
                      </div>}
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
                    {results.economiePilier3 > 0 && <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-primary/20">
                        <span className="text-muted-foreground">Économie grâce au 3ème pilier</span>
                        <span className="font-semibold text-green-500">- CHF {results.economiePilier3.toLocaleString()}</span>
                      </div>}
                  </div>
                  
                  {user && (
                    <Button 
                      onClick={saveTaxData} 
                      disabled={isSaving}
                      className="w-full mt-4"
                      size="lg"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Enregistrement..." : "Sauvegarder dans mon profil"}
                    </Button>
                  )}
                </CardContent>
              </Card>}

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
                      Cotisez jusqu'à CHF 7'258 par an pour réduire votre revenu imposable
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
    </div>;
};
export default SimulateurImpots;