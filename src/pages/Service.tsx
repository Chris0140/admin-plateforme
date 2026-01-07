import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Shield, 
  Calculator, 
  Building2, 
  Heart,
  Car,
  Briefcase,
  Scale,
  PiggyBank,
  Users,
  ChevronRight,
  Trophy
} from "lucide-react";

// Types de services disponibles
const serviceTypes = [
  { id: "courtier-assurance", label: "Courtier en assurance", icon: Shield },
  { id: "fiscaliste", label: "Fiscaliste", icon: Calculator },
  { id: "conseiller-prevoyance", label: "Conseiller en prévoyance", icon: PiggyBank },
  { id: "gestionnaire-patrimoine", label: "Gestionnaire de patrimoine", icon: Briefcase },
];

// Catégories de spécialités
const specialties = [
  { id: "assurance-maladie", label: "Assurance maladie", icon: Heart },
  { id: "assurance-menage", label: "Assurance ménage", icon: Building2 },
  { id: "assurance-voiture", label: "Assurance voiture", icon: Car },
  { id: "prevoyance-3eme-pilier", label: "Prévoyance 3ème pilier", icon: PiggyBank },
  { id: "assurance-pro", label: "Assurances professionnelles", icon: Briefcase },
  { id: "protection-juridique", label: "Protection juridique", icon: Scale },
  { id: "responsabilite-civile", label: "Responsabilité civile", icon: Shield },
  { id: "fiscalite", label: "Fiscalité", icon: Calculator },
];

// Cantons suisses romands
const cantons = [
  { id: "vaud", name: "Vaud", listings: 12 },
  { id: "geneve", name: "Genève", listings: 18 },
  { id: "valais", name: "Valais", listings: 7 },
  { id: "fribourg", name: "Fribourg", listings: 7 },
  { id: "neuchatel", name: "Neuchâtel", listings: 3 },
  { id: "jura", name: "Jura", listings: 2 },
];

// Professionnels fictifs pour démonstration
const professionals = [
  {
    id: 1,
    name: "Cabinet Dupont & Associés",
    type: "Courtier en assurance",
    specialty: "Assurance maladie",
    canton: "Genève",
    rating: 4.8,
    reviews: 24,
    phone: "+41 22 715 17 45",
    verified: true,
  },
  {
    id: 2,
    name: "Fiduciaire Romande SA",
    type: "Fiscaliste",
    specialty: "Fiscalité",
    canton: "Vaud",
    rating: 4.9,
    reviews: 31,
    phone: "+41 21 312 45 67",
    verified: true,
  },
  {
    id: 3,
    name: "Prévoyance Conseil Sàrl",
    type: "Conseiller en prévoyance",
    specialty: "Prévoyance 3ème pilier",
    canton: "Valais",
    rating: 4.7,
    reviews: 18,
    phone: "+41 27 322 11 22",
    verified: true,
  },
  {
    id: 4,
    name: "Assurance Plus Genève",
    type: "Courtier en assurance",
    specialty: "Assurance voiture",
    canton: "Genève",
    rating: 4.6,
    reviews: 42,
    phone: "+41 22 789 00 11",
    verified: false,
  },
  {
    id: 5,
    name: "Expert Fiscal Neuchâtel",
    type: "Fiscaliste",
    specialty: "Fiscalité",
    canton: "Neuchâtel",
    rating: 4.8,
    reviews: 15,
    phone: "+41 32 724 55 66",
    verified: true,
  },
  {
    id: 6,
    name: "Patrimoine Conseil SA",
    type: "Gestionnaire de patrimoine",
    specialty: "Prévoyance 3ème pilier",
    canton: "Fribourg",
    rating: 4.9,
    reviews: 28,
    phone: "+41 26 322 33 44",
    verified: true,
  },
];

const Service = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCanton, setSelectedCanton] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const filteredProfessionals = professionals.filter((pro) => {
    const matchesSearch = pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCanton = !selectedCanton || pro.canton.toLowerCase() === selectedCanton.toLowerCase();
    const matchesType = !selectedType || pro.type.toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesCanton && matchesType;
  });

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-16 px-6 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Les meilleurs professionnels de Suisse Romande
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Trouvez un <span className="text-gradient">expert</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              à côté de chez vous !
            </p>

            {/* Search Box */}
            <Card className="glass-strong max-w-3xl mx-auto">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4 text-left">
                  Je cherche un professionnel :
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ex: assurance maladie, fiscaliste..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-input border-border"
                    />
                  </div>
                  
                  <Select value={selectedCanton} onValueChange={setSelectedCanton}>
                    <SelectTrigger className="bg-input border-border">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Votre canton" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les cantons</SelectItem>
                      {cantons.map((canton) => (
                        <SelectItem key={canton.id} value={canton.name}>
                          {canton.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Specialties Section */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
              Rechercher par spécialité
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specialties.map((specialty) => (
                <button
                  key={specialty.id}
                  onClick={() => setSearchQuery(specialty.label)}
                  className="flex items-center gap-3 p-4 rounded-xl glass hover:bg-muted/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <specialty.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{specialty.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Cantons Section */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Un expert à côté de chez vous
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {cantons.map((canton) => (
                <button
                  key={canton.id}
                  onClick={() => setSelectedCanton(canton.name)}
                  className="group relative overflow-hidden rounded-xl aspect-[4/3] glass hover:border-primary/50 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <MapPin className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-foreground">{canton.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {canton.listings} professionnels
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Professionals List */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                {selectedCanton || selectedType || searchQuery 
                  ? "Résultats de recherche" 
                  : "Les derniers professionnels inscrits"}
              </h2>
              <Badge variant="secondary">
                {filteredProfessionals.length} résultat{filteredProfessionals.length > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProfessionals.map((pro) => (
                <Card key={pro.id} className="glass hover:border-primary/50 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {pro.name}
                          </h3>
                          {pro.verified && (
                            <Badge variant="default" className="text-xs">
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{pro.type}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{pro.specialty}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{pro.canton}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="text-foreground font-medium">{pro.rating}</span>
                        <span className="text-muted-foreground">({pro.reviews} avis)</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="h-4 w-4 mr-2" />
                        Appeler
                      </Button>
                      <Button size="sm" className="flex-1">
                        Voir le profil
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProfessionals.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun professionnel trouvé pour cette recherche.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Vous êtes courtier ou fiscaliste ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Rejoignez notre réseau et augmentez votre visibilité auprès de milliers de clients potentiels.
            </p>
            <Button size="lg" className="glow">
              <Building2 className="h-5 w-5 mr-2" />
              Ajouter votre société
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Service;
