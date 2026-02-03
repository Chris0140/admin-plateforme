import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase, Phone, Trash2, Save, Edit, X } from "lucide-react";
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

const etatCivilOptions = [
  { value: "celibataire", label: "Célibataire" },
  { value: "marie", label: "Marié(e)" },
  { value: "divorce", label: "Divorcé(e)" },
  { value: "veuf", label: "Veuf/Veuve" },
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

const partnerFormSchema = z.object({
  last_name: z.string().trim().max(100).optional(),
  first_name: z.string().trim().min(1, "Le prénom est requis").max(100),
  gender: z.string().optional(),
  date_of_birth: z.string().min(1, "La date de naissance est requise"),
  etat_civil: z.string().optional(),
  employment_status: z.string().optional(),
  profession: z.string().optional(),
  annual_income: z.number().min(0).optional(),
  telephone: z.string().trim().max(20).optional(),
  adresse: z.string().trim().max(255).optional(),
  localite: z.string().trim().max(100).optional(),
});

type PartnerFormValues = z.infer<typeof partnerFormSchema>;

interface ChildInfo {
  id: string;
  first_name: string;
  last_name: string;
  parent_link?: string;
}

interface PartnerProfileTabProps {
  profileId: string | null;
  userId: string | undefined;
  householdRelationship: string;
  onPartnerDeleted: () => void;
  onPartnerSaved: () => void;
  mainUserName?: string;
  childrenInfo?: ChildInfo[];
}

const PartnerProfileTab = ({
  profileId,
  userId,
  householdRelationship,
  onPartnerDeleted,
  onPartnerSaved,
  mainUserName = "",
  childrenInfo = [],
}: PartnerProfileTabProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "",
      etat_civil: "",
      employment_status: "",
      profession: "",
      annual_income: 0,
      telephone: "",
      adresse: "",
      localite: "",
    },
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
        setPartnerId(dependant.id);
        form.reset({
          first_name: dependant.first_name,
          last_name: dependant.last_name,
          date_of_birth: dependant.date_of_birth,
          gender: dependant.gender || "",
          etat_civil: "",
          employment_status: dependant.employment_status || "",
          profession: dependant.profession || "",
          annual_income: dependant.annual_income || 0,
          telephone: "",
          adresse: "",
          localite: "",
        });
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Erreur chargement partenaire:", error);
    }
  };

  const handleSave = async (values: PartnerFormValues) => {
    if (!profileId) return;

    setIsSaving(true);
    try {
      if (partnerId) {
        const { error } = await supabase
          .from("dependants")
          .update({
            first_name: values.first_name,
            last_name: values.last_name || "",
            date_of_birth: values.date_of_birth,
            gender: values.gender || null,
            employment_status: values.employment_status || null,
            profession: values.profession || null,
            annual_income: values.annual_income || 0,
          })
          .eq("id", partnerId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("dependants")
          .insert({
            profile_id: profileId,
            first_name: values.first_name,
            last_name: values.last_name || "",
            date_of_birth: values.date_of_birth,
            gender: values.gender || null,
            relationship: "conjoint",
            employment_status: values.employment_status || null,
            profession: values.profession || null,
            annual_income: values.annual_income || 0,
          })
          .select()
          .single();

        if (error) throw error;
        setPartnerId(data.id);
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
      await supabase
        .from("dependants")
        .delete()
        .eq("profile_id", profileId)
        .eq("relationship", "conjoint");

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

  const formatEtatCivil = (etatCivil: string | undefined) => {
    if (!etatCivil) return "Non renseigné";
    const found = etatCivilOptions.find((o) => o.value === etatCivil);
    return found ? found.label : etatCivil;
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

  const values = form.watch();

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-8">
              {/* SECTION 1: INFORMATIONS PERSONNELLES */}
              <div className="space-y-4">
                <SectionHeader icon={User} title="Informations personnelles" description="Données d'identité du partenaire" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dupont" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Marie" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de naissance *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="etat_civil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>État civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {etatCivilOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* SECTION 2: SITUATION PROFESSIONNELLE */}
              <div className="space-y-4">
                <SectionHeader icon={Briefcase} title="Situation professionnelle" description="Activité et revenus du partenaire" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employmentStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profession</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Ingénieur" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="annual_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenu annuel (CHF)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value ?? 0}
                          placeholder="80000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* SECTION 3: COORDONNÉES */}
              <div className="space-y-4">
                <SectionHeader icon={Phone} title="Coordonnées" description="Informations de contact du partenaire" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} placeholder="+41 79 123 45 67" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Rue de la Gare 1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="localite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localité</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1000 Lausanne" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" disabled={isSaving} className="flex-1 sm:flex-none">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="flex-1 sm:flex-none">
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
            </form>
          </Form>
        ) : (
          <div className="space-y-8">
            {/* SECTION ENFANTS LIÉS */}
            {childrenInfo.filter(c => c.parent_link === "conjoint" || c.parent_link === "commun").length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Enfants liés à ce profil</h4>
                <div className="flex flex-wrap gap-2">
                  {childrenInfo
                    .filter(c => c.parent_link === "conjoint" || c.parent_link === "commun")
                    .map((child) => (
                      <span key={child.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
                        {child.first_name} {child.last_name}
                        <span className="text-xs opacity-70">
                          ({child.parent_link === "commun" ? "commun" : "mon enfant"})
                        </span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* SECTION 1: INFORMATIONS PERSONNELLES - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={User} title="Informations personnelles" description="Données d'identité du partenaire" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Nom</h4>
                  <p className="text-foreground">{values.last_name || "Non renseigné"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Prénom</h4>
                  <p className="text-foreground">{values.first_name || "Non renseigné"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Genre</h4>
                  <p className="text-foreground">{formatGender(values.gender)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</h4>
                  <p className="text-foreground">
                    {values.date_of_birth
                      ? new Date(values.date_of_birth).toLocaleDateString("fr-CH")
                      : "Non renseignée"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">État civil</h4>
                  <p className="text-foreground">{formatEtatCivil(values.etat_civil)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 2: SITUATION PROFESSIONNELLE - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={Briefcase} title="Situation professionnelle" description="Activité et revenus du partenaire" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Statut</h4>
                  <p className="text-foreground">{formatEmploymentStatus(values.employment_status)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Profession</h4>
                  <p className="text-foreground">{values.profession || "Non renseignée"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Revenu annuel</h4>
                  <p className="text-foreground">{formatCurrency(values.annual_income)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 3: COORDONNÉES - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={Phone} title="Coordonnées" description="Informations de contact du partenaire" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Téléphone</h4>
                  <p className="text-foreground">{values.telephone || "Non renseigné"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Adresse</h4>
                  <p className="text-foreground">{values.adresse || "Non renseignée"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Localité</h4>
                  <p className="text-foreground">{values.localite || "Non renseignée"}</p>
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
