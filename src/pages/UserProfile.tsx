import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProfileInformationsForm, { type ProfileInfoFormValues } from "@/components/profile/ProfileInformationsForm";
import type { ChildData } from "@/components/profile/ChildrenFormSection";

interface Profile {
  nom: string;
  prenom: string;
  email: string;
  appellation: string;
  date_naissance: string;
  localite: string;
  adresse: string | null;
  telephone: string | null;
  etat_civil?: string | null;
  nombre_enfants?: number | null;
  gender?: string | null;
  nationality?: string | null;
  profession?: string | null;
  employer_name?: string | null;
  canton?: string | null;
  commune?: string | null;
  permit_type?: string | null;
  housing_status?: string | null;
  household_mode?: string | null;
  work_rate?: number | null;
  employment_status?: string | null;
  annual_income?: number | null;
}

interface PrevoyanceData {
  etat_civil?: string;
  nombre_enfants?: number;
}

const UserProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [prevoyanceData, setPrevoyanceData] = useState<PrevoyanceData>({
    etat_civil: "",
    nombre_enfants: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoadingData(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile(profileData);
        setProfileId(profileData.id);
        
        // Charger aussi les données de prévoyance pour état civil et nombre d'enfants
        const { data: prevoyanceDataForProfile } = await supabase
          .from("prevoyance_data")
          .select("etat_civil, nombre_enfants")
          .eq("user_id", user?.id)
          .maybeSingle();
        
        if (prevoyanceDataForProfile) {
          setPrevoyanceData({
            etat_civil: prevoyanceDataForProfile.etat_civil || "",
            nombre_enfants: prevoyanceDataForProfile.nombre_enfants || 0,
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos données",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleProfileInfoSubmit = async (values: ProfileInfoFormValues, childrenDataParam: ChildData[]) => {
    try {
      console.log('Sauvegarde profil via nouveau formulaire:', values);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          nom: values.nom,
          prenom: values.prenom,
          date_naissance: values.date_naissance,
          localite: values.localite,
          adresse: values.adresse || null,
          telephone: values.telephone || null,
          etat_civil: values.etat_civil || null,
          nombre_enfants: values.nombre_enfants || 0,
          gender: values.gender || null,
          profession: values.profession || null,
          employment_status: values.employment_status || null,
          annual_income: values.annual_income || 0,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      // Synchroniser avec prevoyance_data
      const { data: existingPrevoyance } = await supabase
        .from("prevoyance_data")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (existingPrevoyance) {
        await supabase
          .from("prevoyance_data")
          .update({
            etat_civil: values.etat_civil || null,
            nombre_enfants: values.nombre_enfants || 0,
          })
          .eq("user_id", user?.id);
      } else {
        await supabase
          .from("prevoyance_data")
          .insert({
            user_id: user?.id,
            etat_civil: values.etat_civil || null,
            nombre_enfants: values.nombre_enfants || 0,
            avs_1er_pilier: 0,
            lpp_2eme_pilier: 0,
            pilier_3a: 0,
            pilier_3b: 0,
          });
      }

      // Sauvegarder les enfants
      if (profileId && childrenDataParam.length > 0) {
        await supabase
          .from("dependants")
          .delete()
          .eq("profile_id", profileId)
          .eq("relationship", "enfant");

        const childrenToInsert = childrenDataParam
          .filter(c => c.first_name && c.last_name && c.date_of_birth)
          .map(c => ({
            profile_id: profileId,
            first_name: c.first_name,
            last_name: c.last_name,
            date_of_birth: c.date_of_birth,
            relationship: "enfant",
          }));
        
        if (childrenToInsert.length > 0) {
          await supabase.from("dependants").insert(childrenToInsert);
        }
      } else if (profileId) {
        await supabase
          .from("dependants")
          .delete()
          .eq("profile_id", profileId)
          .eq("relationship", "enfant");
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès",
      });

      setEditingProfile(false);
      await fetchUserData();
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Profil utilisateur</h1>
            <p className="text-muted-foreground">
              Retrouvez et modifiez toutes vos informations personnelles
            </p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileInformationsForm
                profileId={profileId}
                defaultValues={{
                  nom: profile?.nom || "",
                  prenom: profile?.prenom || "",
                  email: profile?.email || "",
                  date_naissance: profile?.date_naissance || "",
                  localite: profile?.localite || "",
                  adresse: profile?.adresse || "",
                  telephone: profile?.telephone || "",
                  etat_civil: profile?.etat_civil || prevoyanceData.etat_civil || "",
                  nombre_enfants: profile?.nombre_enfants || prevoyanceData.nombre_enfants || 0,
                  gender: profile?.gender || "",
                  profession: profile?.profession || "",
                  employment_status: profile?.employment_status || "",
                  annual_income: profile?.annual_income || 0,
                }}
                isEditing={editingProfile}
                onEditToggle={setEditingProfile}
                onSubmit={handleProfileInfoSubmit}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
