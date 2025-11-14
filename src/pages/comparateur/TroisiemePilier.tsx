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
  dateNaissance: z.date({ required_error: "La date de naissance est requise" }),
  situation: z.string().min(1, "La situation professionnelle est requise"),
  canton: z.string().min(1, "Le canton est requis"),
  revenuAnnuel: z.string().min(1, "Le revenu annuel est requis"),
  montantAnnuel: z.string().min(1, "Le montant de cotisation est requis"),
  typeSolution: z.string().min(1, "Le type de solution est requis"),
});

const TroisiemePilier = () => {
  const navigate = useNavigate();
  const [dateNaissance, setDateNaissance] = useState<Date>();
  const [formData, setFormData] = useState({
    situation: "",
    canton: "",
    revenuAnnuel: "",
    montantAnnuel: "",
    typeSolution: "",
    objectif: "",
  });

  const cantons = [
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", 
    "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"
  ];

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
            <CardTitle className="text-3xl">Comparer les 3ème pilier</CardTitle>
            <CardDescription>
              Optimisez votre prévoyance et économisez sur vos impôts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
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
                  <Label htmlFor="situation">Situation professionnelle *</Label>
                  <Select value={formData.situation} onValueChange={(value) => setFormData({...formData, situation: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salarie">Salarié</SelectItem>
                      <SelectItem value="independant">Indépendant</SelectItem>
                      <SelectItem value="sans-activite">Sans activité lucrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canton">Canton de domicile *</Label>
                  <Select value={formData.canton} onValueChange={(value) => setFormData({...formData, canton: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre canton" />
                    </SelectTrigger>
                    <SelectContent>
                      {cantons.map((canton) => (
                        <SelectItem key={canton} value={canton}>{canton}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenuAnnuel">Revenu annuel brut *</Label>
                  <Select value={formData.revenuAnnuel} onValueChange={(value) => setFormData({...formData, revenuAnnuel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moins-50000">Moins de 50'000 CHF</SelectItem>
                      <SelectItem value="50000-75000">50'000 - 75'000 CHF</SelectItem>
                      <SelectItem value="75000-100000">75'000 - 100'000 CHF</SelectItem>
                      <SelectItem value="100000-150000">100'000 - 150'000 CHF</SelectItem>
                      <SelectItem value="plus-150000">Plus de 150'000 CHF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montantAnnuel">Montant de cotisation annuel *</Label>
                  <Select value={formData.montantAnnuel} onValueChange={(value) => setFormData({...formData, montantAnnuel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1'000 CHF</SelectItem>
                      <SelectItem value="2000">2'000 CHF</SelectItem>
                      <SelectItem value="3000">3'000 CHF</SelectItem>
                      <SelectItem value="4000">4'000 CHF</SelectItem>
                      <SelectItem value="5000">5'000 CHF</SelectItem>
                      <SelectItem value="6000">6'000 CHF</SelectItem>
                      <SelectItem value="7000">7'000 CHF (maximum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeSolution">Type de solution *</Label>
                  <Select value={formData.typeSolution} onValueChange={(value) => setFormData({...formData, typeSolution: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compte">Compte d'épargne 3a</SelectItem>
                      <SelectItem value="assurance">Assurance vie 3a</SelectItem>
                      <SelectItem value="titres">Solutions en titres 3a</SelectItem>
                      <SelectItem value="mixte">Solution mixte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="objectif">Objectif principal (optionnel)</Label>
                  <Select value={formData.objectif} onValueChange={(value) => setFormData({...formData, objectif: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre objectif" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retraite">Préparer la retraite</SelectItem>
                      <SelectItem value="achat-immobilier">Achat immobilier</SelectItem>
                      <SelectItem value="economie-impots">Économiser sur les impôts</SelectItem>
                      <SelectItem value="independant">Devenir indépendant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Le saviez-vous ?</strong> En 2024, vous pouvez déduire jusqu'à 7'056 CHF de votre revenu imposable avec un 3ème pilier.
                </p>
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

export default TroisiemePilier;
