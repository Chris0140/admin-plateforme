import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X, User, Home, Briefcase, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ChildrenFormSection, { type ChildData } from "./ChildrenFormSection";
import type { AdultData } from "./AdultFormSection";

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

const profileInfoSchema = z.object({
  // Informations personnelles
  nom: z.string().trim().min(1, "Le nom est requis").max(100, "Le nom doit faire moins de 100 caractères"),
  prenom: z.string().trim().min(1, "Le prénom est requis").max(100, "Le prénom doit faire moins de 100 caractères"),
  gender: z.string().optional(),
  date_naissance: z.string().min(1, "La date de naissance est requise"),
  etat_civil: z.string().optional(),
  // Foyer
  nombre_adultes: z.number().min(0).max(1).optional(),
  household_relationship: z.string().optional(),
  nombre_enfants: z.number().min(0).max(20).optional(),
  // Situation professionnelle
  employment_status: z.string().optional(),
  profession: z.string().optional(),
  annual_income: z.number().min(0).optional(),
  // Coordonnées
  email: z.string().trim().email("Email invalide"),
  telephone: z.string().trim().max(20).optional(),
  adresse: z.string().trim().max(255).optional(),
  localite: z.string().trim().min(1, "La localité est requise").max(100),
});

export type ProfileInfoFormValues = z.infer<typeof profileInfoSchema>;

interface ProfileInformationsFormProps {
  profileId: string | null;
  defaultValues: ProfileInfoFormValues;
  isEditing: boolean;
  onEditToggle: (editing: boolean) => void;
  onSubmit: (values: ProfileInfoFormValues, childrenData: ChildData[], adultData: AdultData | null) => Promise<void>;
  hasPartner?: boolean;
}

const ProfileInformationsForm = ({
  profileId,
  defaultValues,
  isEditing,
  onEditToggle,
  onSubmit,
  hasPartner = false,
}: ProfileInformationsFormProps) => {
  const form = useForm<ProfileInfoFormValues>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues,
  });

  const childrenCount = form.watch("nombre_enfants") || 0;
  const adultsCount = form.watch("nombre_adultes") || 0;
  const [childrenData, setChildrenData] = React.useState<ChildData[]>([]);
  const [adultData, setAdultData] = React.useState<AdultData | null>(null);

  const handleSubmit = async (values: ProfileInfoFormValues) => {
    await onSubmit(values, childrenData, adultData);
  };

  const formatDisplayValue = (value: string | number | null | undefined, fallback = "Non renseigné") => {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
  };

  const formatGender = (gender: string | null | undefined) => {
    if (!gender) return "Non renseigné";
    const found = genderOptions.find(o => o.value === gender);
    return found ? found.label : gender;
  };

  const formatEtatCivil = (etatCivil: string | null | undefined) => {
    if (!etatCivil) return "Non renseigné";
    const found = etatCivilOptions.find(o => o.value === etatCivil);
    return found ? found.label : etatCivil;
  };

  const formatEmploymentStatus = (status: string | null | undefined) => {
    if (!status) return "Non renseigné";
    const found = employmentStatusOptions.find(o => o.value === status);
    return found ? found.label : status;
  };


  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return "Non renseigné";
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

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
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Gérez vos informations personnelles et familiales
          </CardDescription>
        </div>
        {!isEditing ? (
          <Button onClick={() => onEditToggle(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <Button onClick={() => onEditToggle(false)} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {/* SECTION 1: INFORMATIONS PERSONNELLES */}
              <div className="space-y-4">
                <SectionHeader icon={User} title="Informations personnelles" description="Vos données d'identité" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nom"
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
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jean" />
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
                    name="date_naissance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de naissance</FormLabel>
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

              {/* SECTION 2: FOYER */}
              <div className="space-y-4">
                <SectionHeader icon={Home} title="Foyer" description="Composition de votre foyer" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre_enfants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre d'enfants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value ?? 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Section enfants dynamique */}
                <ChildrenFormSection
                  profileId={profileId}
                  childrenCount={childrenCount}
                  onChildrenChange={setChildrenData}
                  isEditing={true}
                  hasPartner={hasPartner}
                />
              </div>

              <Separator />

              {/* SECTION 3: SITUATION PROFESSIONNELLE */}
              <div className="space-y-4">
                <SectionHeader icon={Briefcase} title="Situation professionnelle" description="Votre activité et revenus" />
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

              {/* SECTION 4: COORDONNÉES */}
              <div className="space-y-4">
                <SectionHeader icon={Phone} title="Coordonnées" description="Vos informations de contact" />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled className="bg-muted" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        L'email ne peut pas être modifié directement. Contactez le support pour le changer.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

              <Button type="submit" className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: INFORMATIONS PERSONNELLES - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={User} title="Informations personnelles" description="Vos données d'identité" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Nom</h4>
                  <p className="text-foreground">{formatDisplayValue(defaultValues.nom)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Prénom</h4>
                  <p className="text-foreground">{formatDisplayValue(defaultValues.prenom)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Genre</h4>
                  <p className="text-foreground">{formatGender(defaultValues.gender)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</h4>
                  <p className="text-foreground">
                    {defaultValues.date_naissance 
                      ? new Date(defaultValues.date_naissance).toLocaleDateString("fr-CH")
                      : "Non renseignée"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">État civil</h4>
                  <p className="text-foreground">{formatEtatCivil(defaultValues.etat_civil)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 2: FOYER - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={Home} title="Foyer" description="Composition de votre foyer" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Nombre d'enfants</h4>
                  <p className="text-foreground">{defaultValues.nombre_enfants || 0}</p>
                </div>
              </div>

              {/* Enfants en mode lecture */}
              <ChildrenFormSection
                profileId={profileId}
                childrenCount={defaultValues.nombre_enfants || 0}
                onChildrenChange={() => {}}
                isEditing={false}
                hasPartner={hasPartner}
              />
            </div>

            <Separator />

            {/* SECTION 3: SITUATION PROFESSIONNELLE - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={Briefcase} title="Situation professionnelle" description="Votre activité et revenus" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Statut</h4>
                  <p className="text-foreground">{formatEmploymentStatus(defaultValues.employment_status)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Profession</h4>
                  <p className="text-foreground">{formatDisplayValue(defaultValues.profession)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Revenu annuel</h4>
                  <p className="text-foreground">{formatCurrency(defaultValues.annual_income)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 4: COORDONNÉES - Mode lecture */}
            <div className="space-y-4">
              <SectionHeader icon={Phone} title="Coordonnées" description="Vos informations de contact" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                  <p className="text-foreground">{formatDisplayValue(defaultValues.email)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Téléphone</h4>
                  <p className="text-foreground">{formatDisplayValue(defaultValues.telephone)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Adresse</h4>
                  <p className="text-foreground">{formatDisplayValue(defaultValues.adresse, "Non renseignée")}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Localité</h4>
                  <p className="text-foreground">{formatDisplayValue(defaultValues.localite)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileInformationsForm;
