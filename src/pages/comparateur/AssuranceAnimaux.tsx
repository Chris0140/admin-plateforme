import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { z } from "zod";

const formSchema = z.object({
  typeAnimal: z.string().min(1, "Le type d'animal est requis"),
  race: z.string().min(1, "La race est requise"),
  age: z.string().min(1, "L'âge est requis"),
  codePostal: z.string().min(4, "Le code postal est requis"),
  couverture: z.string().min(1, "Le type de couverture est requis"),
});

const AssuranceAnimaux = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    typeAnimal: "",
    race: "",
    age: "",
    codePostal: "",
    couverture: "",
    franchise: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      formSchema.parse(formData);
      console.log("Formulaire valide:", formData);
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
          onClick={() => navigate("/comparateur")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Comparer les assurances animaux</CardTitle>
            <CardDescription>
              Protégez votre animal de compagnie avec la meilleure assurance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="typeAnimal">Type d'animal *</Label>
                  <Select value={formData.typeAnimal} onValueChange={(value) => setFormData({...formData, typeAnimal: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chien">Chien</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="cheval">Cheval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="race">Race *</Label>
                  <Input
                    id="race"
                    placeholder="Ex: Labrador, Persan..."
                    value={formData.race}
                    onChange={(e) => setFormData({...formData, race: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Âge de l'animal *</Label>
                  <Select value={formData.age} onValueChange={(value) => setFormData({...formData, age: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moins-1">Moins de 1 an</SelectItem>
                      <SelectItem value="1-3">1 - 3 ans</SelectItem>
                      <SelectItem value="3-7">3 - 7 ans</SelectItem>
                      <SelectItem value="7-10">7 - 10 ans</SelectItem>
                      <SelectItem value="plus-10">Plus de 10 ans</SelectItem>
                    </SelectContent>
                  </Select>
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="couverture">Type de couverture *</Label>
                  <Select value={formData.couverture} onValueChange={(value) => setFormData({...formData, couverture: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base (accidents)</SelectItem>
                      <SelectItem value="maladie">Maladie et accidents</SelectItem>
                      <SelectItem value="complete">Complète (maladie, accidents, prévention)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="franchise">Franchise annuelle (optionnel)</Label>
                  <Select value={formData.franchise} onValueChange={(value) => setFormData({...formData, franchise: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la franchise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 CHF</SelectItem>
                      <SelectItem value="100">100 CHF</SelectItem>
                      <SelectItem value="200">200 CHF</SelectItem>
                      <SelectItem value="500">500 CHF</SelectItem>
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

export default AssuranceAnimaux;
