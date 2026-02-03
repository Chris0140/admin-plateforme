import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, UserPlus, Loader2, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProfileInformationsForm, { type ProfileInfoFormValues } from "@/components/profile/ProfileInformationsForm";
import PartnerProfileTab from "@/components/profile/PartnerProfileTab";
import ChildProfileTab from "@/components/profile/ChildProfileTab";
import AddHouseholdMemberDialog from "@/components/profile/AddHouseholdMemberDialog";
import type { ChildData } from "@/components/profile/ChildrenFormSection";
import type { AdultData } from "@/components/profile/AdultFormSection";

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
  nombre_adultes?: number | null;
  household_relationship?: string | null;
  gender?: string | null;
  profession?: string | null;
  employment_status?: string | null;
  annual_income?: number | null;
}

interface PrevoyanceData {
  etat_civil?: string;
  nombre_enfants?: number;
}

interface ChildDependant {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  parent_link?: string;
}

interface PartnerDependant {
  id: string;
  first_name: string;
  last_name: string;
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
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("mon-profil");
  const [children, setChildren] = useState<ChildDependant[]>([]);
  const [partnerData, setPartnerData] = useState<PartnerDependant | null>(null);
  const hasPartner = (profile?.nombre_adultes || 0) >= 1;

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
        
        // Charger les enfants
        const { data: childrenData } = await supabase
          .from("dependants")
          .select("id, first_name, last_name, date_of_birth, parent_link")
          .eq("profile_id", profileData.id)
          .eq("relationship", "enfant");
        
        if (childrenData) {
          setChildren(childrenData);
        }

        // Charger le conjoint
        const { data: partnerDataResult } = await supabase
          .from("dependants")
          .select("id, first_name, last_name")
          .eq("profile_id", profileData.id)
          .eq("relationship", "conjoint")
          .maybeSingle();
        
        if (partnerDataResult) {
          setPartnerData(partnerDataResult);
        } else {
          setPartnerData(null);
        }
        
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

  const handleAddMember = async (relationship: string) => {
    if (!user?.id) return;

    try {
      // Mettre à jour le profil avec le nouveau membre
      await supabase
        .from("profiles")
        .update({
          nombre_adultes: 1,
          household_relationship: relationship,
        })
        .eq("user_id", user.id);

      // Rafraîchir les données
      await fetchUserData();
      
      // Basculer vers l'onglet du partenaire
      setActiveTab("conjoint");
      
      toast({
        title: "Membre ajouté",
        description: "Vous pouvez maintenant remplir les informations du partenaire",
      });
    } catch (error) {
      console.error("Erreur ajout membre:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le membre",
      });
    }
  };

  const handlePartnerDeleted = () => {
    setActiveTab("mon-profil");
    fetchUserData();
  };

  const handlePartnerSaved = () => {
    fetchUserData();
  };

  const handleChildDeleted = () => {
    setActiveTab("mon-profil");
    fetchUserData();
  };

  const handleChildSaved = () => {
    fetchUserData();
  };

  const handleProfileInfoSubmit = async (
    values: ProfileInfoFormValues, 
    childrenDataParam: ChildData[],
    adultDataParam: AdultData | null
  ) => {
    try {
      console.log('Sauvegarde profil:', values);
      
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
          nombre_adultes: values.nombre_adultes || 0,
          household_relationship: values.household_relationship || null,
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

      // Gérer le conjoint/partenaire
      if (profileId) {
        // Supprimer l'ancien conjoint si nombre_adultes = 0
        if ((values.nombre_adultes || 0) === 0) {
          await supabase
            .from("dependants")
            .delete()
            .eq("profile_id", profileId)
            .eq("relationship", "conjoint");
        } else if (adultDataParam && adultDataParam.first_name && adultDataParam.date_of_birth) {
          // Upsert le conjoint
          const { data: existingAdult } = await supabase
            .from("dependants")
            .select("id")
            .eq("profile_id", profileId)
            .eq("relationship", "conjoint")
            .maybeSingle();

          if (existingAdult) {
            await supabase
              .from("dependants")
              .update({
                first_name: adultDataParam.first_name,
                last_name: adultDataParam.last_name,
                date_of_birth: adultDataParam.date_of_birth,
                gender: adultDataParam.gender || null,
                employment_status: adultDataParam.employment_status || null,
                profession: adultDataParam.profession || null,
                annual_income: adultDataParam.annual_income || 0,
              })
              .eq("id", existingAdult.id);
          } else {
            await supabase
              .from("dependants")
              .insert({
                profile_id: profileId,
                first_name: adultDataParam.first_name,
                last_name: adultDataParam.last_name,
                date_of_birth: adultDataParam.date_of_birth,
                gender: adultDataParam.gender || null,
                relationship: "conjoint",
                employment_status: adultDataParam.employment_status || null,
                profession: adultDataParam.profession || null,
                annual_income: adultDataParam.annual_income || 0,
              });
          }
        }
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
            parent_link: c.parent_link || "principal",
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-card/50 backdrop-blur border-b rounded-none h-auto p-0 gap-0 mb-6 flex-wrap">
              <TabsTrigger 
                value="mon-profil" 
                className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all"
              >
                <User className="h-4 w-4 mr-2" />
                Mon profil
              </TabsTrigger>
              
              {hasPartner && (
                <TabsTrigger 
                  value="conjoint"
                  className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Conjoint/Partenaire
                </TabsTrigger>
              )}
              
              {children.map((child) => (
                <TabsTrigger 
                  key={child.id}
                  value={`enfant-${child.id}`}
                  className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all"
                >
                  <Baby className="h-4 w-4 mr-2" />
                  {child.first_name || "Enfant"}
                </TabsTrigger>
              ))}
              
              {!hasPartner && (
                <Button
                  variant="ghost"
                  className="h-12 px-6 rounded-none text-muted-foreground hover:text-foreground"
                  onClick={() => setAddMemberDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter au foyer
                </Button>
              )}
            </TabsList>

            <TabsContent value="mon-profil" className="mt-0">
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
                  nombre_adultes: profile?.nombre_adultes || 0,
                  household_relationship: profile?.household_relationship || "",
                  gender: profile?.gender || "",
                  profession: profile?.profession || "",
                  employment_status: profile?.employment_status || "",
                  annual_income: profile?.annual_income || 0,
                }}
                isEditing={editingProfile}
                onEditToggle={setEditingProfile}
                onSubmit={handleProfileInfoSubmit}
                hasPartner={hasPartner}
                partnerInfo={partnerData}
                childrenInfo={children}
                mainUserName={profile?.prenom || ""}
              />
            </TabsContent>

            {hasPartner && (
              <TabsContent value="conjoint" className="mt-0">
                <PartnerProfileTab
                  profileId={profileId}
                  userId={user?.id}
                  householdRelationship={profile?.household_relationship || ""}
                  onPartnerDeleted={handlePartnerDeleted}
                  onPartnerSaved={handlePartnerSaved}
                  mainUserName={profile?.prenom || ""}
                  childrenInfo={children}
                />
              </TabsContent>
            )}

            {children.map((child) => (
              <TabsContent key={child.id} value={`enfant-${child.id}`} className="mt-0">
                <ChildProfileTab
                  childId={child.id}
                  profileId={profileId}
                  hasPartner={hasPartner}
                  onChildDeleted={handleChildDeleted}
                  onChildSaved={handleChildSaved}
                  mainUserName={profile?.prenom || ""}
                  partnerName={partnerData?.first_name || ""}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />

      <AddHouseholdMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        onSelectRelationship={handleAddMember}
      />
    </div>
  );
};

export default UserProfile;
