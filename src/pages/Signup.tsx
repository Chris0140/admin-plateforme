import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Eye, EyeOff } from "lucide-react";

const cantons = [
  { value: "GE", label: "Genève (GE)" },
  { value: "VD", label: "Vaud (VD)" },
  { value: "VS", label: "Valais (VS)" },
  { value: "FR", label: "Fribourg (FR)" },
  { value: "NE", label: "Neuchâtel (NE)" },
  { value: "JU", label: "Jura (JU)" },
  { value: "BE", label: "Berne (BE)" },
  { value: "ZH", label: "Zurich (ZH)" },
  { value: "LU", label: "Lucerne (LU)" },
  { value: "UR", label: "Uri (UR)" },
  { value: "SZ", label: "Schwyz (SZ)" },
  { value: "OW", label: "Obwald (OW)" },
  { value: "NW", label: "Nidwald (NW)" },
  { value: "GL", label: "Glaris (GL)" },
  { value: "ZG", label: "Zoug (ZG)" },
  { value: "SO", label: "Soleure (SO)" },
  { value: "BS", label: "Bâle-Ville (BS)" },
  { value: "BL", label: "Bâle-Campagne (BL)" },
  { value: "SH", label: "Schaffhouse (SH)" },
  { value: "AR", label: "Appenzell Rhodes-Extérieures (AR)" },
  { value: "AI", label: "Appenzell Rhodes-Intérieures (AI)" },
  { value: "SG", label: "Saint-Gall (SG)" },
  { value: "GR", label: "Grisons (GR)" },
  { value: "AG", label: "Argovie (AG)" },
  { value: "TG", label: "Thurgovie (TG)" },
  { value: "TI", label: "Tessin (TI)" }
];

const signupSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  date_naissance: z.string().min(1, "La date de naissance est requise"),
  canton: z.string().min(1, "Le canton est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().regex(/^(\+41|0)[0-9]{9}$/, "Format de téléphone suisse invalide (ex: +41791234567 ou 0791234567)"),
  password: z.string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[!@#$%^&*]/, "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    date_naissance: "",
    canton: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedData = signupSchema.parse(formData);

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            prenom: validatedData.prenom,
            nom: validatedData.nom,
            date_naissance: validatedData.date_naissance,
            canton: validatedData.canton,
            telephone: validatedData.telephone,
            localite: "",
            appellation: "Monsieur"
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Compte créé avec succès",
        description: "Veuillez confirmer votre adresse e-mail pour finaliser votre inscription. Un email de vérification a été envoyé."
      });

      navigate("/login");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue lors de la création du compte",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center text-base">
              Accédez à votre espace budget, prévoyance et impôts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleChange("prenom", e.target.value)}
                    placeholder="Jean"
                  />
                  {errors.prenom && <p className="text-sm text-destructive mt-1">{errors.prenom}</p>}
                </div>

                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange("nom", e.target.value)}
                    placeholder="Dupont"
                  />
                  {errors.nom && <p className="text-sm text-destructive mt-1">{errors.nom}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_naissance">Date de naissance *</Label>
                  <Input
                    id="date_naissance"
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => handleChange("date_naissance", e.target.value)}
                  />
                  {errors.date_naissance && <p className="text-sm text-destructive mt-1">{errors.date_naissance}</p>}
                </div>

                <div>
                  <Label htmlFor="canton">Canton de domicile *</Label>
                  <Select value={formData.canton} onValueChange={(value) => handleChange("canton", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un canton" />
                    </SelectTrigger>
                    <SelectContent>
                      {cantons.map((canton) => (
                        <SelectItem key={canton.value} value={canton.value}>
                          {canton.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.canton && <p className="text-sm text-destructive mt-1">{errors.canton}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Adresse e-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="jean.dupont@exemple.ch"
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="telephone">Numéro de téléphone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  placeholder="+41791234567 ou 0791234567"
                />
                {errors.telephone && <p className="text-sm text-destructive mt-1">{errors.telephone}</p>}
              </div>

              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>Le mot de passe doit contenir au moins :</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>12 caractères</li>
                    <li>1 lettre minuscule</li>
                    <li>1 lettre majuscule</li>
                    <li>1 chiffre</li>
                    <li>1 caractère spécial (!@#$%^&*)</li>
                  </ul>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création en cours..." : "Créer mon compte"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
