import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, Globe, Building2, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioCard } from "./RadioCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  residenceStatus: z.enum(["resident", "frontalier"], {
    required_error: "Veuillez sélectionner votre statut de résidence",
  }),
  professionalStatus: z.enum(["employe", "independant"], {
    required_error: "Veuillez sélectionner votre statut professionnel",
  }),
  jobTitle: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const LOCAL_PROFILE_KEY = "budget_profile_guest";

export function ProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      residenceStatus: undefined,
      professionalStatus: undefined,
      jobTitle: "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      if (user) {
        // Authenticated user: save to Supabase
        const { error } = await supabase.from("budget_profiles").insert({
          user_id: user.id,
          first_name: values.firstName,
          last_name: values.lastName,
          residence_status: values.residenceStatus,
          professional_status: values.professionalStatus,
          job_title: values.jobTitle || null,
          onboarding_completed: true,
        });

        if (error) throw error;
      } else {
        // Guest user: save to localStorage
        const guestProfile = {
          id: crypto.randomUUID(),
          user_id: "guest",
          first_name: values.firstName,
          last_name: values.lastName,
          residence_status: values.residenceStatus,
          professional_status: values.professionalStatus,
          job_title: values.jobTitle || null,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(guestProfile));
      }

      toast({
        title: "Profil créé",
        description: "Passons à la configuration de votre compte",
      });
      navigate("/budget/accounts");
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer votre profil",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Identity Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Identité</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Residence Status Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">
            Statut de résidence
          </h3>
          <FormField
            control={form.control}
            name="residenceStatus"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RadioCard
                      icon={Home}
                      title="Résident Suisse"
                      description="Je vis et travaille en Suisse"
                      selected={field.value === "resident"}
                      onClick={() => field.onChange("resident")}
                    />
                    <RadioCard
                      icon={Globe}
                      title="Frontalier"
                      description="Je travaille en Suisse mais vis à l'étranger"
                      selected={field.value === "frontalier"}
                      onClick={() => field.onChange("frontalier")}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Professional Status Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">
            Statut professionnel
          </h3>
          <FormField
            control={form.control}
            name="professionalStatus"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RadioCard
                      icon={Building2}
                      title="Employé"
                      description="Je suis salarié d'une entreprise"
                      selected={field.value === "employe"}
                      onClick={() => field.onChange("employe")}
                    />
                    <RadioCard
                      icon={Briefcase}
                      title="Indépendant"
                      description="Je travaille à mon compte"
                      selected={field.value === "independant"}
                      onClick={() => field.onChange("independant")}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Job Title (conditional) */}
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intitulé du poste (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Développeur, Comptable..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Continuer"
          )}
        </Button>
      </form>
    </Form>
  );
}
