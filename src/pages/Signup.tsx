import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ArrowLeft } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  appellation: z.string().min(1, "L'appellation est obligatoire"),
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  prenom: z.string().trim().min(1, "Le prénom est obligatoire").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  date_naissance: z.string().min(1, "La date de naissance est obligatoire"),
  localite: z.string().trim().min(1, "La localité est obligatoire").max(100),
  adresse: z.string().trim().max(200).optional(),
  telephone: z.string().trim().max(20).optional(),
});

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    appellation: "",
    nom: "",
    prenom: "",
    email: "",
    password: "",
    date_naissance: "",
    localite: "",
    adresse: "",
    telephone: "",
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
      const validatedData = signupSchema.parse(formData);
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            appellation: validatedData.appellation,
            nom: validatedData.nom,
            prenom: validatedData.prenom,
            date_naissance: validatedData.date_naissance,
            localite: validatedData.localite,
            adresse: validatedData.adresse || "",
            telephone: validatedData.telephone || "",
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Compte créé avec succès !",
        description: "Vous êtes maintenant connecté.",
      });
      navigate("/");
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Link
        to="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Retour</span>
      </Link>
      
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary rounded-xl p-2.5">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">admin.</h1>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Créer un compte</h2>
          <p className="text-muted-foreground">
            Remplissez le formulaire pour créer votre compte
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appellation Buttons */}
            <div className="space-y-2">
              <Label>
                Civilité <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => handleChange("appellation", "M.")}
                  variant={formData.appellation === "M." ? "default" : "outline"}
                  className={
                    formData.appellation === "M."
                      ? "flex-1 bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze"
                      : "flex-1"
                  }
                >
                  Monsieur
                </Button>
                <Button
                  type="button"
                  onClick={() => handleChange("appellation", "Mme")}
                  variant={formData.appellation === "Mme" ? "default" : "outline"}
                  className={
                    formData.appellation === "Mme"
                      ? "flex-1 bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze"
                      : "flex-1"
                  }
                >
                  Madame
                </Button>
              </div>
              {errors.appellation && (
                <p className="text-sm text-destructive">{errors.appellation}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  className="bg-background"
                />
                {errors.nom && <p className="text-sm text-destructive">{errors.nom}</p>}
              </div>

              {/* Prénom */}
              <div className="space-y-2">
                <Label htmlFor="prenom">
                  Prénom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => handleChange("prenom", e.target.value)}
                  className="bg-background"
                />
                {errors.prenom && (
                  <p className="text-sm text-destructive">{errors.prenom}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="bg-background"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="bg-background"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Date de naissance */}
              <div className="space-y-2">
                <Label htmlFor="date_naissance">
                  Date de naissance <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={(e) => handleChange("date_naissance", e.target.value)}
                  className="bg-background"
                />
                {errors.date_naissance && (
                  <p className="text-sm text-destructive">{errors.date_naissance}</p>
                )}
              </div>

              {/* Localité */}
              <div className="space-y-2">
                <Label htmlFor="localite">
                  Localité <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="localite"
                  value={formData.localite}
                  onChange={(e) => handleChange("localite", e.target.value)}
                  className="bg-background"
                />
                {errors.localite && (
                  <p className="text-sm text-destructive">{errors.localite}</p>
                )}
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse (optionnel)</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleChange("adresse", e.target.value)}
                  className="bg-background"
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone (optionnel)</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze"
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
