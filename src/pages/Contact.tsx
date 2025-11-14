import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  telephone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1, "Le message est obligatoire").max(1000),
});

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = contactSchema.parse(formData);
      setLoading(true);

      // Simuler l'envoi du message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      // Réinitialiser le formulaire
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        message: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Contactez-nous
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une question ? Besoin d'aide ? Notre équipe est à votre disposition pour vous accompagner.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Information - Left Side */}
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">
                  Informations de Contact
                </h2>

                <div className="space-y-6">
                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-bronze to-bronze-light rounded-xl p-3 shadow-bronze">
                      <Phone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">Téléphone</h3>
                      <p className="text-muted-foreground text-lg">0800 123 456</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-bronze to-bronze-light rounded-xl p-3 shadow-bronze">
                      <Mail className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">Email</h3>
                      <p className="text-muted-foreground text-lg">info@admin.ch</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-bronze to-bronze-light rounded-xl p-3 shadow-bronze">
                      <MapPin className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">Adresse</h3>
                      <p className="text-muted-foreground text-lg">
                        Rue de la Confédération 12<br />
                        1204 Genève<br />
                        Suisse
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Horaires de Disponibilité
                </h2>
                <div className="space-y-3 text-lg">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Lundi - Vendredi:</span> 9h00 - 18h00
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Weekend:</span> Sur rendez-vous
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form - Right Side */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Formulaire de Contact
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-base">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange("nom", e.target.value)}
                    className="bg-background border-border/50 focus:border-primary h-12 text-base"
                    placeholder="Votre nom"
                  />
                  {errors.nom && <p className="text-sm text-destructive">{errors.nom}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="bg-background border-border/50 focus:border-primary h-12 text-base"
                    placeholder="votre@email.com"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-base">Téléphone (optionnel)</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleChange("telephone", e.target.value)}
                    className="bg-background border-border/50 focus:border-primary h-12 text-base"
                    placeholder="+41 00 000 00 00"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="bg-background border-border/50 focus:border-primary min-h-[180px] text-base resize-none"
                    placeholder="Votre message..."
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze shadow-bronze h-12 text-base font-semibold"
                >
                  {loading ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
