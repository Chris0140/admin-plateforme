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

const securitySchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
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

const AccountSecurity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
      }));
    }
  }, [user, authLoading, navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = securitySchema.parse(formData);
      setLoading(true);

      if (!user) return;

      let emailUpdated = false;
      let passwordUpdated = false;

      // Mettre à jour l'email s'il a changé
      if (validatedData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: validatedData.email,
        });

        if (emailError) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de mettre à jour l'email: " + emailError.message,
          });
        } else {
          emailUpdated = true;
          
          // Mettre à jour l'email dans la table profiles
          await supabase
            .from("profiles")
            .update({ email: validatedData.email })
            .eq("user_id", user.id);
        }
      }

      // Mettre à jour le mot de passe s'il est fourni
      if (validatedData.newPassword && validatedData.newPassword.length > 0) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: validatedData.newPassword,
        });

        if (passwordError) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de mettre à jour le mot de passe: " + passwordError.message,
          });
        } else {
          passwordUpdated = true;
        }
      }

      if (emailUpdated || passwordUpdated) {
        let description = "";
        if (emailUpdated && passwordUpdated) {
          description = "Votre email et mot de passe ont été modifiés avec succès.";
        } else if (emailUpdated) {
          description = "Votre email a été modifié avec succès.";
        } else if (passwordUpdated) {
          description = "Votre mot de passe a été modifié avec succès.";
        }

        toast({
          title: "Modifications enregistrées !",
          description,
        });

        // Réinitialiser les champs de mot de passe
        setFormData((prev) => ({
          ...prev,
          newPassword: "",
          confirmPassword: "",
        }));
      } else if (!emailUpdated && !passwordUpdated && !validatedData.newPassword) {
        toast({
          variant: "destructive",
          title: "Aucune modification",
          description: "Veuillez modifier votre email ou entrer un nouveau mot de passe.",
        });
      }
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
        <div className="max-w-2xl mx-auto">
          <Link
            to="/account/settings"
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Retour aux paramètres</span>
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-2">
            Sécurité du compte
          </h1>
          <p className="text-muted-foreground mb-8">
            Modifiez votre email de connexion et votre mot de passe
          </p>

          <div className="bg-card border border-border rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email de connexion <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="bg-background"
                  placeholder="votre@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cet email sera utilisé pour vous connecter à votre compte
                </p>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Changer le mot de passe
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Laissez vide si vous ne souhaitez pas modifier votre mot de passe
                </p>

                {/* Nouveau mot de passe */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="newPassword">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value)}
                    className="bg-background"
                    placeholder="Minimum 8 caractères"
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le nouveau mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="bg-background"
                    placeholder="Répétez le mot de passe"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSecurity;
