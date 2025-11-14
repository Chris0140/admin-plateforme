import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { z } from "zod";

const formSchema = z.object({
  marque: z.string().min(1, "La marque est requise"),
  modele: z.string().min(1, "Le modèle est requis"),
  annee: z.string().min(4, "L'année est requise"),
  codePostal: z.string().min(4, "Le code postal est requis"),
  dateNaissance: z.date({ required_error: "La date de naissance est requise" }),
  permisDepuis: z.string().min(4, "L'année d'obtention du permis est requise"),
  couverture: z.string().min(1, "Le type de couverture est requis"),
  kilometrage: z.string().min(1, "Le kilométrage annuel est requis"),
});

const AssuranceVehicule = () => {
  const navigate = useNavigate();
  const [dateNaissance, setDateNaissance] = useState<Date>();
  const [formData, setFormData] = useState({
    marque: "",
    modele: "",
    annee: "",
    codePostal: "",
    permisDepuis: "",
    couverture: "",
    kilometrage: "",
    franchise: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      formSchema.parse({ ...formData, dateNaissance });
      console.log("Formulaire valide:", { ...formData, dateNaissance });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Erreurs de validation:", error.errors);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Comparer les assurances véhicule</CardTitle>
            <CardDescription>
              Trouvez la meilleure assurance auto adaptée à vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="marque">Marque du véhicule *</Label>
                  <Input
                    id="marque"
                    placeholder="Ex: BMW, Audi, VW..."
                    value={formData.marque}
                    onChange={(e) => setFormData({...formData, marque: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modele">Modèle *</Label>
                  <Input
                    id="modele"
                    placeholder="Ex: 320d, A4, Golf..."
                    value={formData.modele}
                    onChange={(e) => setFormData({...formData, modele: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annee">Année de mise en circulation *</Label>
                  <Input
                    id="annee"
                    type="number"
                    placeholder="2020"
                    value={formData.annee}
                    onChange={(e) => setFormData({...formData, annee: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codePostal">Code postal *</Label>
                  <Input
                    id="codePostal"
                    placeholder="1000"
                    value={formData.codePostal}
                    onChange={(e) => setFormData({...formData, codePostal: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateNaissance">Date de naissance *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateNaissance && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateNaissance ? format(dateNaissance, "dd/MM/yyyy") : "Sélectionnez une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateNaissance}
                        onSelect={setDateNaissance}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permisDepuis">Permis de conduire depuis *</Label>
                  <Input
                    id="permisDepuis"
                    type="number"
                    placeholder="2015"
                    value={formData.permisDepuis}
                    onChange={(e) => setFormData({...formData, permisDepuis: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="couverture">Type de couverture *</Label>
                  <Select value={formData.couverture} onValueChange={(value) => setFormData({...formData, couverture: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="responsabilite-civile">Responsabilité civile</SelectItem>
                      <SelectItem value="partielle">Partielle (RC + Casco partielle)</SelectItem>
                      <SelectItem value="complete">Complète (RC + Casco complète)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kilometrage">Kilométrage annuel *</Label>
                  <Select value={formData.kilometrage} onValueChange={(value) => setFormData({...formData, kilometrage: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moins-5000">Moins de 5'000 km</SelectItem>
                      <SelectItem value="5000-10000">5'000 - 10'000 km</SelectItem>
                      <SelectItem value="10000-15000">10'000 - 15'000 km</SelectItem>
                      <SelectItem value="15000-20000">15'000 - 20'000 km</SelectItem>
                      <SelectItem value="plus-20000">Plus de 20'000 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="franchise">Franchise (optionnel)</Label>
                  <Select value={formData.franchise} onValueChange={(value) => setFormData({...formData, franchise: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la franchise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200">200 CHF</SelectItem>
                      <SelectItem value="500">500 CHF</SelectItem>
                      <SelectItem value="1000">1'000 CHF</SelectItem>
                      <SelectItem value="2000">2'000 CHF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze">
                Comparer les offres
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AssuranceVehicule;
