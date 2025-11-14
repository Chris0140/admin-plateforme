import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const profileSchema = z.object({
  appellation: z.string().min(1, "L'appellation est obligatoire"),
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  prenom: z.string().trim().min(1, "Le prénom est obligatoire").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  date_naissance: z.string().min(1, "La date de naissance est obligatoire"),
  localite: z.string().trim().min(1, "La localité est obligatoire").max(100),
  adresse: z.string().trim().max(200).optional(),
  telephone: z.string().trim().max(20).optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const AccountSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    appellation: "",
    nom: "",
    prenom: "",
    email: "",
    date_naissance: "",
    localite: "",
    adresse: "",
    telephone: "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signup");
      return;
    }

    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger votre profil",
        });
        return;
      }

      if (data) {
        setFormData({
          appellation: data.appellation || "",
          nom: data.nom || "",
          prenom: data.prenom || "",
          email: data.email || "",
          date_naissance: data.date_naissance || "",
          localite: data.localite || "",
          adresse: data.adresse || "",
          telephone: data.telephone || "",
        });
      }
    };

    fetchProfile();
  }, [user, authLoading, navigate, toast]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    try {
      const validatedData = passwordSchema.parse(passwordData);
      
      if (!validatedData.newPassword || validatedData.newPassword.length === 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez entrer un nouveau mot de passe",
        });
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: validatedData.newPassword,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour le mot de passe: " + error.message,
        });
        return;
      }

      toast({
        title: "Mot de passe mis à jour !",
        description: "Votre mot de passe a été modifié avec succès.",
      });

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setPasswordErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = profileSchema.parse(formData);
      setLoading(true);

      if (!user) return;

      // Mettre à jour l'email dans auth uniquement s'il a changé
      if (validatedData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: validatedData.email,
        });

        if (authError) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de mettre à jour l'email: " + authError.message,
          });
          // Continuer la sauvegarde du profil même si l'email n'a pas pu être mis à jour
        }
      }

      // Upsert du profil en base (crée si inexistant, met à jour sinon)
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          appellation: validatedData.appellation,
          nom: validatedData.nom,
          prenom: validatedData.prenom,
          email: validatedData.email,
          date_naissance: validatedData.date_naissance,
          localite: validatedData.localite,
          adresse: validatedData.adresse || "",
          telephone: validatedData.telephone || "",
        }, { onConflict: 'user_id' });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Profil mis à jour !",
        description: "Vos informations ont été modifiées avec succès.",
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

  if (authLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Retour à l'accueil</span>
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-8">
            Paramètres du compte
          </h1>

          {/* Section Informations personnelles */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Informations personnelles
            </h2>
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
              <div className="space-y-2 md:col-span-2">
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
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </form>
          </div>

          {/* Section Sécurité */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Sécurité du compte
            </h2>
            
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pour modifier votre email de connexion, modifiez-le dans la section "Informations personnelles" ci-dessus.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    className="bg-background"
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le nouveau mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    className="bg-background"
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !passwordData.newPassword}
                className="w-full bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze"
              >
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettings;
