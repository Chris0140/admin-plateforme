import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, GraduationCap, Trash2, Save, Edit, X, Heart, HeartPulse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  { value: "M", label: "Garçon" },
  { value: "F", label: "Fille" },
  { value: "autre", label: "Autre" },
];

const parentLinkOptions = [
  { value: "principal", label: "Mon enfant" },
  { value: "conjoint", label: "Enfant du conjoint" },
  { value: "commun", label: "Enfant commun" },
];

export interface ChildProfileData {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  parent_link?: string;
  is_student?: boolean;
  is_disabled?: boolean;
  shared_custody?: boolean;
}

interface ChildProfileTabProps {
  childId: string;
  profileId: string | null;
  hasPartner: boolean;
  onChildDeleted: () => void;
  onChildSaved: () => void;
}

const ChildProfileTab = ({
  childId,
  profileId,
  hasPartner,
  onChildDeleted,
  onChildSaved,
}: ChildProfileTabProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [child, setChild] = useState<ChildProfileData>({
    id: childId,
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    parent_link: "principal",
    is_student: false,
    is_disabled: false,
    shared_custody: false,
  });

  useEffect(() => {
    if (childId) {
      fetchChild();
    }
  }, [childId]);

  const fetchChild = async () => {
    try {
      const { data, error } = await supabase
        .from("dependants")
        .select("*")
        .eq("id", childId)
        .single();

      if (error) throw error;

      if (data) {
        setChild({
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender || "",
          parent_link: data.parent_link || "principal",
          is_student: data.is_student || false,
          is_disabled: data.is_disabled || false,
          shared_custody: data.shared_custody || false,
        });
      }
    } catch (error) {
      console.error("Erreur chargement enfant:", error);
    }
  };

  const updateChild = (field: keyof ChildProfileData, value: string | boolean) => {
    setChild((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!child.first_name || !child.date_of_birth) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir au moins le prénom et la date de naissance",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("dependants")
        .update({
          first_name: child.first_name,
          last_name: child.last_name,
          date_of_birth: child.date_of_birth,
          gender: child.gender || null,
          parent_link: child.parent_link || "principal",
          is_student: child.is_student || false,
          is_disabled: child.is_disabled || false,
          shared_custody: child.shared_custody || false,
        })
        .eq("id", childId);

      if (error) throw error;

      toast({
        title: "Profil enregistré",
        description: "Les informations de l'enfant ont été sauvegardées",
      });
      setIsEditing(false);
      onChildSaved();
    } catch (error) {
      console.error("Erreur sauvegarde enfant:", error);
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
    try {
      await supabase
        .from("dependants")
        .delete()
        .eq("id", childId);

      toast({
        title: "Profil supprimé",
        description: "L'enfant a été retiré du foyer",
      });
      onChildDeleted();
    } catch (error) {
      console.error("Erreur suppression enfant:", error);
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

  const formatParentLink = (parentLink: string | undefined) => {
    if (!parentLink) return "Mon enfant";
    const found = parentLinkOptions.find((o) => o.value === parentLink);
    return found ? found.label : parentLink;
  };

  const getParentLinkBadgeVariant = (parentLink: string | undefined): "default" | "secondary" | "outline" => {
    switch (parentLink) {
      case "commun":
        return "default";
      case "conjoint":
        return "secondary";
      default:
        return "outline";
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(child.date_of_birth);

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
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {child.first_name || "Nouvel enfant"}
              {hasPartner && (
                <Badge variant={getParentLinkBadgeVariant(child.parent_link)}>
                  {formatParentLink(child.parent_link)}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {age !== null ? `${age} ans` : "Profil de l'enfant"}
            </CardDescription>
          </div>
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
              <SectionHeader icon={User} title="Informations personnelles" description="Données d'identité de l'enfant" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={child.first_name}
                    onChange={(e) => updateChild("first_name", e.target.value)}
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={child.last_name}
                    onChange={(e) => updateChild("last_name", e.target.value)}
                    placeholder="Nom"
                  />
                </div>
                <div>
                  <Label>Genre</Label>
                  <Select
                    onValueChange={(value) => updateChild("gender", value)}
                    value={child.gender || ""}
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
                    value={child.date_of_birth}
                    onChange={(e) => updateChild("date_of_birth", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Lien parental */}
            {hasPartner && (
              <>
                <div className="space-y-4">
                  <SectionHeader icon={Heart} title="Lien parental" description="Rattachement aux adultes du foyer" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Rattaché à</Label>
                      <Select
                        onValueChange={(value) => updateChild("parent_link", value)}
                        value={child.parent_link || "principal"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {parentLinkOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="shared_custody"
                        checked={child.shared_custody || false}
                        onCheckedChange={(checked) => updateChild("shared_custody", checked === true)}
                      />
                      <label
                        htmlFor="shared_custody"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Garde partagée
                      </label>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Situation */}
            <div className="space-y-4">
              <SectionHeader icon={GraduationCap} title="Situation" description="Statut actuel de l'enfant" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_student"
                    checked={child.is_student || false}
                    onCheckedChange={(checked) => updateChild("is_student", checked === true)}
                  />
                  <label
                    htmlFor="is_student"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Étudiant / En formation
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_disabled"
                    checked={child.is_disabled || false}
                    onCheckedChange={(checked) => updateChild("is_disabled", checked === true)}
                  />
                  <label
                    htmlFor="is_disabled"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    En situation de handicap
                  </label>
                </div>
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
                    Supprimer cet enfant
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement le profil de {child.first_name || "cet enfant"} du foyer.
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
              <SectionHeader icon={User} title="Informations personnelles" description="Données d'identité de l'enfant" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Prénom</h4>
                  <p className="text-foreground">{child.first_name || "Non renseigné"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Nom</h4>
                  <p className="text-foreground">{child.last_name || "Non renseigné"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Genre</h4>
                  <p className="text-foreground">{formatGender(child.gender)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</h4>
                  <p className="text-foreground">
                    {child.date_of_birth
                      ? new Date(child.date_of_birth).toLocaleDateString("fr-CH")
                      : "Non renseignée"}
                    {age !== null && ` (${age} ans)`}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Lien parental - Mode lecture */}
            {hasPartner && (
              <>
                <div className="space-y-4">
                  <SectionHeader icon={Heart} title="Lien parental" description="Rattachement aux adultes du foyer" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Rattaché à</h4>
                      <Badge variant={getParentLinkBadgeVariant(child.parent_link)}>
                        {formatParentLink(child.parent_link)}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Garde partagée</h4>
                      <p className="text-foreground">{child.shared_custody ? "Oui" : "Non"}</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Situation - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={GraduationCap} title="Situation" description="Statut actuel de l'enfant" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Étudiant / En formation</h4>
                  <p className="text-foreground">{child.is_student ? "Oui" : "Non"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">En situation de handicap</h4>
                  <p className="text-foreground">{child.is_disabled ? "Oui" : "Non"}</p>
                </div>
              </div>
            </div>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer cet enfant
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera définitivement le profil de {child.first_name || "cet enfant"} du foyer.
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

export default ChildProfileTab;
