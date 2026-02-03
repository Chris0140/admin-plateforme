import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AdultData {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  employment_status?: string;
  profession?: string;
  annual_income?: number;
}

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

interface AdultFormSectionProps {
  profileId: string | null;
  adultsCount: number;
  onAdultChange: (adult: AdultData | null) => void;
  isEditing: boolean;
}

const AdultFormSection = ({
  profileId,
  adultsCount,
  onAdultChange,
  isEditing,
}: AdultFormSectionProps) => {
  const [adult, setAdult] = useState<AdultData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    employment_status: "",
    profession: "",
    annual_income: 0,
  });

  // Charger le conjoint existant
  useEffect(() => {
    if (profileId) {
      fetchAdult();
    }
  }, [profileId]);

  // Notifier le parent des changements
  useEffect(() => {
    if (adultsCount >= 1) {
      onAdultChange(adult);
    } else {
      onAdultChange(null);
    }
  }, [adult, adultsCount]);

  const fetchAdult = async () => {
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
        setAdult({
          id: dependant.id,
          first_name: dependant.first_name,
          last_name: dependant.last_name,
          date_of_birth: dependant.date_of_birth,
          gender: dependant.gender || "",
          employment_status: dependant.employment_status || "",
          profession: dependant.profession || "",
          annual_income: dependant.annual_income || 0,
        });
      }
    } catch (error) {
      console.error("Erreur chargement conjoint:", error);
    }
  };

  const updateAdult = (field: keyof AdultData, value: string | number) => {
    setAdult((prev) => ({ ...prev, [field]: value }));
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

  if (adultsCount === 0) {
    return null;
  }

  if (!isEditing) {
    // Mode lecture
    return (
      <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/20">
        <h4 className="font-medium">Profil du conjoint/partenaire</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Prénom</p>
            <p className="font-medium">{adult.first_name || "Non renseigné"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nom</p>
            <p className="font-medium">{adult.last_name || "Non renseigné"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Genre</p>
            <p className="font-medium">{formatGender(adult.gender)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date de naissance</p>
            <p className="font-medium">
              {adult.date_of_birth
                ? new Date(adult.date_of_birth).toLocaleDateString("fr-CH")
                : "Non renseignée"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Statut professionnel</p>
            <p className="font-medium">{formatEmploymentStatus(adult.employment_status)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profession</p>
            <p className="font-medium">{adult.profession || "Non renseignée"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Revenu annuel</p>
            <p className="font-medium">{formatCurrency(adult.annual_income)}</p>
          </div>
        </div>
      </div>
    );
  }

  // Mode édition
  return (
    <div className="space-y-6 mt-4 p-4 border rounded-lg bg-muted/20">
      <h4 className="font-medium">Profil du conjoint/partenaire</h4>

      {/* Informations personnelles */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Informations personnelles</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Prénom</Label>
            <Input
              value={adult.first_name}
              onChange={(e) => updateAdult("first_name", e.target.value)}
              placeholder="Prénom"
            />
          </div>
          <div>
            <Label>Nom</Label>
            <Input
              value={adult.last_name}
              onChange={(e) => updateAdult("last_name", e.target.value)}
              placeholder="Nom"
            />
          </div>
          <div>
            <Label>Genre</Label>
            <Select
              onValueChange={(value) => updateAdult("gender", value)}
              value={adult.gender || ""}
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
            <Label>Date de naissance</Label>
            <Input
              type="date"
              value={adult.date_of_birth}
              onChange={(e) => updateAdult("date_of_birth", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Situation professionnelle */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Situation professionnelle</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Statut</Label>
            <Select
              onValueChange={(value) => updateAdult("employment_status", value)}
              value={adult.employment_status || ""}
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
              value={adult.profession || ""}
              onChange={(e) => updateAdult("profession", e.target.value)}
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
            value={adult.annual_income || 0}
            onChange={(e) => updateAdult("annual_income", parseFloat(e.target.value) || 0)}
            placeholder="80000"
          />
        </div>
      </div>
    </div>
  );
};

export default AdultFormSection;
