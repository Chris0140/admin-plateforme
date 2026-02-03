import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase, Trash2, Save, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const genderOptions = [
  { value: "M", label: "Homme" },
  { value: "F", label: "Femme" },
  { value: "autre", label: "Autre" },
];

const employmentStatusOptions = [
  { value: "employe", label: "Employé" },
  { value: "independant", label: "Indépendant" },
  { value: "sans_activite", label: "Sans activité" },
];

const householdRelationshipLabels: Record<string, string> = {
  marie: "Marié(e)",
  concubinage: "Concubinage",
  partenaire_enregistre: "Partenaire enregistré",
};

export interface PartnerData {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  employment_status?: string;
  profession?: string;
  annual_income?: number;
}

interface PartnerProfileTabProps {
  profileId: string | null;
  userId: string | undefined;
  householdRelationship: string;
  onPartnerDeleted: () => void;
  onPartnerSaved: () => void;
}

const PartnerProfileTab = ({
  profileId,
  userId,
  householdRelationship,
  onPartnerDeleted,
  onPartnerSaved,
}: PartnerProfileTabProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [partner, setPartner] = useState<PartnerData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    employment_status: "",
    profession: "",
    annual_income: 0,
  });

  useEffect(() => {
    if (profileId) {
      fetchPartner();
    }
  }, [profileId]);

  const fetchPartner = async () => {
    if (!profileId) return;

    try {
      const { data: dependant, error } = await supabase
        .from("dependants")
        .select("*")
        .eq("profile_id", profileId)
        .eq("relationship", "conjoint")
        .maybeSingle();

      if (error) throw error;

      if (dependant) {
        setPartner({
          id: dependant.id,
          first_name: dependant.first_name,
          last_name: dependant.last_name,
          date_of_birth: dependant.date_of_birth,
          gender: dependant.gender || "",
          employment_status: dependant.employment_status || "",
          profession: dependant.profession || "",
          annual_income: dependant.annual_income || 0,
        });
      } else {
        // Nouveau partenaire, activer le mode édition
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Erreur chargement partenaire:", error);
    }
  };

  const updatePartner = (field: keyof PartnerData, value: string | number) => {
    setPartner((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profileId || !partner.first_name || !partner.date_of_birth) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir au moins le prénom et la date de naissance",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (partner.id) {
        // Mise à jour
        const { error } = await supabase
          .from("dependants")
          .update({
            first_name: partner.first_name,
            last_name: partner.last_name,
            date_of_birth: partner.date_of_birth,
            gender: partner.gender || null,
            employment_status: partner.employment_status || null,
            profession: partner.profession || null,
            annual_income: partner.annual_income || 0,
          })
          .eq("id", partner.id);

        if (error) throw error;
      } else {
        // Création
        const { data, error } = await supabase
          .from("dependants")
          .insert({
            profile_id: profileId,
            first_name: partner.first_name,
            last_name: partner.last_name,
            date_of_birth: partner.date_of_birth,
            gender: partner.gender || null,
            relationship: "conjoint",
            employment_status: partner.employment_status || null,
            profession: partner.profession || null,
            annual_income: partner.annual_income || 0,
          })
          .select()
          .single();

        if (error) throw error;
        setPartner((prev) => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Profil enregistré",
        description: "Les informations du partenaire ont été sauvegardées",
      });
      setIsEditing(false);
      onPartnerSaved();
    } catch (error) {
      console.error("Erreur sauvegarde partenaire:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profileId || !userId) return;

    try {
      // Supprimer le dependant
      await supabase
        .from("dependants")
        .delete()
        .eq("profile_id", profileId)
        .eq("relationship", "conjoint");

      // Réinitialiser les champs du profil
      await supabase
        .from("profiles")
        .update({
          nombre_adultes: 0,
          household_relationship: null,
        })
        .eq("user_id", userId);

      toast({
        title: "Profil supprimé",
        description: "Le conjoint/partenaire a été retiré du foyer",
      });
      onPartnerDeleted();
    } catch (error) {
      console.error("Erreur suppression partenaire:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le profil",
      });
    }
  };

  const formatGender = (gender: string | undefined) => {
    if (!gender) return "Non renseigné";
    const found = genderOptions.find((o) => o.value === gender);
    return found ? found.label : gender;
  };

  const formatEmploymentStatus = (status: string | undefined) => {
    if (!status) return "Non renseigné";
    const found = employmentStatusOptions.find((o) => o.value === status);
    return found ? found.label : status;
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value || value === 0) return "Non renseigné";
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const SectionHeader = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {householdRelationshipLabels[householdRelationship] || "Conjoint/Partenaire"}
          </CardTitle>
          <CardDescription>
            Informations de votre conjoint ou partenaire
          </CardDescription>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(false)} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-8">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <SectionHeader icon={User} title="Informations personnelles" description="Données d'identité du partenaire" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={partner.first_name}
                    onChange={(e) => updatePartner("first_name", e.target.value)}
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={partner.last_name}
                    onChange={(e) => updatePartner("last_name", e.target.value)}
                    placeholder="Nom"
                  />
                </div>
                <div>
                  <Label>Genre</Label>
                  <Select
                    onValueChange={(value) => updatePartner("gender", value)}
                    value={partner.gender || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date de naissance *</Label>
                  <Input
                    type="date"
                    value={partner.date_of_birth}
                    onChange={(e) => updatePartner("date_of_birth", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Situation professionnelle */}
            <div className="space-y-4">
              <SectionHeader icon={Briefcase} title="Situation professionnelle" description="Activité et revenus du partenaire" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Statut</Label>
                  <Select
                    onValueChange={(value) => updatePartner("employment_status", value)}
                    value={partner.employment_status || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Profession</Label>
                  <Input
                    value={partner.profession || ""}
                    onChange={(e) => updatePartner("profession", e.target.value)}
                    placeholder="Ex: Ingénieur"
                  />
                </div>
              </div>
              <div>
                <Label>Revenu annuel (CHF)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={partner.annual_income || 0}
                  onChange={(e) => updatePartner("annual_income", parseFloat(e.target.value) || 0)}
                  placeholder="80000"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1 sm:flex-none">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer ce profil
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement le profil du conjoint/partenaire du foyer.
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Informations personnelles - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={User} title="Informations personnelles" description="Données d'identité du partenaire" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Prénom</h4>
                  <p className="text-foreground">{partner.first_name || "Non renseigné"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Nom</h4>
                  <p className="text-foreground">{partner.last_name || "Non renseigné"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Genre</h4>
                  <p className="text-foreground">{formatGender(partner.gender)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</h4>
                  <p className="text-foreground">
                    {partner.date_of_birth
                      ? new Date(partner.date_of_birth).toLocaleDateString("fr-CH")
                      : "Non renseignée"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Situation professionnelle - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={Briefcase} title="Situation professionnelle" description="Activité et revenus du partenaire" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Statut</h4>
                  <p className="text-foreground">{formatEmploymentStatus(partner.employment_status)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Profession</h4>
                  <p className="text-foreground">{partner.profession || "Non renseignée"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Revenu annuel</h4>
                  <p className="text-foreground">{formatCurrency(partner.annual_income)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ce profil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera définitivement le profil du conjoint/partenaire du foyer.
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerProfileTab;
