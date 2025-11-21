import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

const profileSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  date_naissance: z.string().min(1, "La date de naissance est requise"),
  canton: z.string().min(1, "Le canton est requis"),
  telephone: z.string().regex(/^(\+41|0)[0-9]{9}$/, "Format de téléphone suisse invalide").optional().or(z.literal("")),
});

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    date_naissance: "",
    canton: "",
    telephone: "",
    phone_verified: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (profile) {
        setFormData({
          prenom: profile.prenom || "",
          nom: profile.nom || "",
          email: profile.email || "",
          date_naissance: profile.date_naissance || "",
          canton: profile.canton || "",
          telephone: profile.telephone || "",
          phone_verified: profile.phone_verified || false,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement du profil:", error);
    }
  };

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
      const validatedData = profileSchema.parse(formData);

      const { error } = await supabase
        .from("profiles")
        .update({
          prenom: validatedData.prenom,
          nom: validatedData.nom,
          date_naissance: validatedData.date_naissance,
          canton: validatedData.canton,
          telephone: validatedData.telephone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès"
      });
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
          description: error.message || "Une erreur est survenue",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleChange("prenom", e.target.value)}
                    placeholder="Jean"
                  />
                  {errors.prenom && (
                    <p className="text-sm text-destructive mt-1">{errors.prenom}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange("nom", e.target.value)}
                    placeholder="Dupont"
                  />
                  {errors.nom && (
                    <p className="text-sm text-destructive mt-1">{errors.nom}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  placeholder="jean.dupont@exemple.ch"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'email ne peut pas être modifié directement. Contactez le support pour le changer.
                </p>
              </div>

              <div>
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={(e) => handleChange("date_naissance", e.target.value)}
                />
                {errors.date_naissance && (
                  <p className="text-sm text-destructive mt-1">{errors.date_naissance}</p>
                )}
              </div>

              <div>
                <Label htmlFor="canton">Canton de domicile</Label>
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
                {errors.canton && (
                  <p className="text-sm text-destructive mt-1">{errors.canton}</p>
                )}
              </div>

              <div>
                <Label htmlFor="telephone">Numéro de téléphone</Label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      id="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => handleChange("telephone", e.target.value)}
                      placeholder="+41791234567 ou 0791234567"
                    />
                    {errors.telephone && (
                      <p className="text-sm text-destructive mt-1">{errors.telephone}</p>
                    )}
                  </div>
                  {formData.phone_verified ? (
                    <Badge variant="default" className="mt-2">Vérifié</Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-2">Non vérifié</Badge>
                  )}
                </div>
                {!formData.phone_verified && (
                  <p className="text-xs text-muted-foreground mt-1">
                    La vérification par SMS sera disponible prochainement
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
