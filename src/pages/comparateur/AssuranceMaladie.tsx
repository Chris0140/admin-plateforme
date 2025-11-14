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
  sexe: z.string().min(1, "Le sexe est requis"),
  canton: z.string().min(1, "Le canton est requis"),
  franchise: z.string().min(1, "La franchise est requise"),
  modele: z.string().min(1, "Le modèle d'assurance est requis"),
  accidents: z.string().min(1, "Veuillez indiquer si vous souhaitez inclure les accidents"),
});

const AssuranceMaladie = () => {
  const navigate = useNavigate();
  const [dateNaissance, setDateNaissance] = useState<Date>();
  const [formData, setFormData] = useState({
    sexe: "",
    canton: "",
    franchise: "",
    modele: "",
    accidents: "",
  });

  const cantons = [
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", 
    "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"
  ];

  const franchises = ["300 CHF", "500 CHF", "1000 CHF", "1500 CHF", "2000 CHF", "2500 CHF"];

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
            <CardTitle className="text-3xl">Comparer les assurances maladie</CardTitle>
            <CardDescription>
              Trouvez la meilleure assurance maladie adaptée à vos besoins
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
                  <Label htmlFor="sexe">Sexe *</Label>
                  <Select value={formData.sexe} onValueChange={(value) => setFormData({...formData, sexe: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homme">Homme</SelectItem>
                      <SelectItem value="femme">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canton">Canton *</Label>
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
                  <Label htmlFor="franchise">Franchise annuelle *</Label>
                  <Select value={formData.franchise} onValueChange={(value) => setFormData({...formData, franchise: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la franchise" />
                    </SelectTrigger>
                    <SelectContent>
                      {franchises.map((franchise) => (
                        <SelectItem key={franchise} value={franchise}>{franchise}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modele">Modèle d'assurance *</Label>
                  <Select value={formData.modele} onValueChange={(value) => setFormData({...formData, modele: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="medecin-famille">Médecin de famille</SelectItem>
                      <SelectItem value="telmed">TelMed</SelectItem>
                      <SelectItem value="hmo">HMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accidents">Couverture accidents *</Label>
                  <Select value={formData.accidents} onValueChange={(value) => setFormData({...formData, accidents: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Inclure les accidents?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oui">Oui</SelectItem>
                      <SelectItem value="non">Non (couvert par l'employeur)</SelectItem>
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

export default AssuranceMaladie;
