import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

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

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "login");
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  const [signupData, setSignupData] = useState({
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

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLoginChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSignupChange = (field: string, value: string) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = loginSchema.parse(loginData);
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: error.message === "Invalid login credentials" 
            ? "Email ou mot de passe incorrect" 
            : error.message,
        });
        return;
      }

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue",
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = signupSchema.parse(signupData);
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

  if (authLoading) {
    return <div>Chargement...</div>;
  }

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
          <h2 className="text-3xl font-bold text-foreground mb-2">Bienvenue</h2>
          <p className="text-muted-foreground">
            Connectez-vous ou créez un compte
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Créer un compte</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleLoginChange("email", e.target.value)}
                    className="bg-background"
                    placeholder="votre@email.com"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">
                    Mot de passe <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => handleLoginChange("password", e.target.value)}
                    className="bg-background"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze"
                >
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
              <form onSubmit={handleSignup} className="space-y-6">
                {/* Appellation Buttons */}
                <div className="space-y-2">
                  <Label>
                    Civilité <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={() => handleSignupChange("appellation", "M.")}
                      variant={signupData.appellation === "M." ? "default" : "outline"}
                      className={
                        signupData.appellation === "M."
                          ? "flex-1 bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze"
                          : "flex-1"
                      }
                    >
                      Monsieur
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSignupChange("appellation", "Mme")}
                      variant={signupData.appellation === "Mme" ? "default" : "outline"}
                      className={
                        signupData.appellation === "Mme"
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
                  <div className="space-y-2">
                    <Label htmlFor="nom">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nom"
                      value={signupData.nom}
                      onChange={(e) => handleSignupChange("nom", e.target.value)}
                      className="bg-background"
                    />
                    {errors.nom && <p className="text-sm text-destructive">{errors.nom}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prenom">
                      Prénom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="prenom"
                      value={signupData.prenom}
                      onChange={(e) => handleSignupChange("prenom", e.target.value)}
                      className="bg-background"
                    />
                    {errors.prenom && (
                      <p className="text-sm text-destructive">{errors.prenom}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => handleSignupChange("email", e.target.value)}
                      className="bg-background"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">
                      Mot de passe <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => handleSignupChange("password", e.target.value)}
                      className="bg-background"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_naissance">
                      Date de naissance <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="date_naissance"
                      type="date"
                      value={signupData.date_naissance}
                      onChange={(e) => handleSignupChange("date_naissance", e.target.value)}
                      className="bg-background"
                    />
                    {errors.date_naissance && (
                      <p className="text-sm text-destructive">{errors.date_naissance}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localite">
                      Localité <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="localite"
                      value={signupData.localite}
                      onChange={(e) => handleSignupChange("localite", e.target.value)}
                      className="bg-background"
                    />
                    {errors.localite && (
                      <p className="text-sm text-destructive">{errors.localite}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adresse">Adresse (optionnel)</Label>
                    <Input
                      id="adresse"
                      value={signupData.adresse}
                      onChange={(e) => handleSignupChange("adresse", e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone (optionnel)</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={signupData.telephone}
                      onChange={(e) => handleSignupChange("telephone", e.target.value)}
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
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
