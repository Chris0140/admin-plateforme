import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Wallet, Calculator, FileText, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Profile {
  nom: string;
  prenom: string;
  email: string;
  appellation: string;
  date_naissance: string;
  localite: string;
  adresse: string | null;
  telephone: string | null;
}

interface Document {
  id: string;
  file_name: string;
  category: string;
  subcategory: string | null;
  file_size: number;
  uploaded_at: string;
}

const UserProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Budget data from localStorage
  const [budgetData, setBudgetData] = useState({
    periodType: "",
    revenuBrut: "",
    chargesSociales: "",
    depensesLogement: "",
    depensesTransport: "",
    depensesAlimentation: "",
    autresDepenses: "",
    avs1erPilier: "",
    lpp2emePilier: "",
    pilier3a: "",
    pilier3b: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      loadBudgetData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoadingData(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user?.id)
        .order("uploaded_at", { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadBudgetData = () => {
    const budgetPeriodType = localStorage.getItem("budgetPeriodType") || "mensuel";
    const budgetRevenuBrut = localStorage.getItem("budgetRevenuBrut") || "";
    const budgetChargesSociales = localStorage.getItem("budgetChargesSociales") || "";
    const budgetDepensesLogement = localStorage.getItem("budgetDepensesLogement") || "";
    const budgetDepensesTransport = localStorage.getItem("budgetDepensesTransport") || "";
    const budgetDepensesAlimentation = localStorage.getItem("budgetDepensesAlimentation") || "";
    const budgetAutresDepenses = localStorage.getItem("budgetAutresDepenses") || "";
    const budgetAvs1erPilier = localStorage.getItem("budgetAvs1erPilier") || "";
    const budgetLpp2emePilier = localStorage.getItem("budgetLpp2emePilier") || "";
    const budgetPilier3a = localStorage.getItem("budgetPilier3a") || "";
    const budgetPilier3b = localStorage.getItem("budgetPilier3b") || "";

    setBudgetData({
      periodType: budgetPeriodType,
      revenuBrut: budgetRevenuBrut,
      chargesSociales: budgetChargesSociales,
      depensesLogement: budgetDepensesLogement,
      depensesTransport: budgetDepensesTransport,
      depensesAlimentation: budgetDepensesAlimentation,
      autresDepenses: budgetAutresDepenses,
      avs1erPilier: budgetAvs1erPilier,
      lpp2emePilier: budgetLpp2emePilier,
      pilier3a: budgetPilier3a,
      pilier3b: budgetPilier3b,
    });
  };

  const formatCurrency = (value: string) => {
    if (!value || value === "") return "Non renseigné";
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const revenuNet = parseFloat(budgetData.revenuBrut || "0") - parseFloat(budgetData.chargesSociales || "0");
  const totalDepenses =
    parseFloat(budgetData.depensesLogement || "0") +
    parseFloat(budgetData.depensesTransport || "0") +
    parseFloat(budgetData.depensesAlimentation || "0") +
    parseFloat(budgetData.autresDepenses || "0");
  const soldeBudget = revenuNet - totalDepenses;

  const totalPrevoyance =
    parseFloat(budgetData.avs1erPilier || "0") +
    parseFloat(budgetData.lpp2emePilier || "0") +
    parseFloat(budgetData.pilier3a || "0") +
    parseFloat(budgetData.pilier3b || "0");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Profil utilisateur</h1>
            <p className="text-muted-foreground">
              Retrouvez toutes vos informations personnelles et données enregistrées
            </p>
          </div>

          <Tabs defaultValue="informations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="informations">
                <User className="h-4 w-4 mr-2" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="budget">
                <Wallet className="h-4 w-4 mr-2" />
                Budget
              </TabsTrigger>
              <TabsTrigger value="impots">
                <Calculator className="h-4 w-4 mr-2" />
                Impôts
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Informations personnelles */}
            <TabsContent value="informations">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Vos données d'identification et coordonnées
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Appellation</h3>
                        <p className="text-foreground">{profile.appellation}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Nom</h3>
                        <p className="text-foreground">{profile.nom}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Prénom</h3>
                        <p className="text-foreground">{profile.prenom}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                        <p className="text-foreground">{profile.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</h3>
                        <p className="text-foreground">{formatDate(profile.date_naissance)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Localité</h3>
                        <p className="text-foreground">{profile.localite}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Adresse</h3>
                        <p className="text-foreground">{profile.adresse || "Non renseignée"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Téléphone</h3>
                        <p className="text-foreground">{profile.telephone || "Non renseigné"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucune information disponible</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget */}
            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget personnel</CardTitle>
                  <CardDescription>
                    Vue {budgetData.periodType === "mensuel" ? "mensuelle" : "annuelle"} de votre budget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Revenus</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenu brut</p>
                        <p className="text-xl font-semibold">{formatCurrency(budgetData.revenuBrut)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Charges sociales</p>
                        <p className="text-xl font-semibold">{formatCurrency(budgetData.chargesSociales)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Revenu net</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(revenuNet.toString())}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dépenses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Logement</p>
                        <p className="text-xl font-semibold">{formatCurrency(budgetData.depensesLogement)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transport</p>
                        <p className="text-xl font-semibold">{formatCurrency(budgetData.depensesTransport)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alimentation</p>
                        <p className="text-xl font-semibold">{formatCurrency(budgetData.depensesAlimentation)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Autres dépenses</p>
                        <p className="text-xl font-semibold">{formatCurrency(budgetData.autresDepenses)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Total des dépenses</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalDepenses.toString())}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Solde</p>
                    <p className={`text-3xl font-bold ${soldeBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(soldeBudget.toString())}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prévoyance retraite</CardTitle>
                  <CardDescription>
                    Votre épargne retraite par pilier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">1er Pilier (AVS)</p>
                      <p className="text-xl font-semibold">{formatCurrency(budgetData.avs1erPilier)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">2ème Pilier (LPP)</p>
                      <p className="text-xl font-semibold">{formatCurrency(budgetData.lpp2emePilier)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">3ème Pilier A</p>
                      <p className="text-xl font-semibold">{formatCurrency(budgetData.pilier3a)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">3ème Pilier B</p>
                      <p className="text-xl font-semibold">{formatCurrency(budgetData.pilier3b)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Total prévoyance</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrevoyance.toString())}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Impôts */}
            <TabsContent value="impots">
              <Card>
                <CardHeader>
                  <CardTitle>Données fiscales</CardTitle>
                  <CardDescription>
                    Informations utilisées pour la simulation d'impôts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Les données du simulateur d'impôts ne sont pas actuellement sauvegardées.
                    Effectuez une nouvelle simulation dans la page dédiée pour calculer vos impôts.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Mes documents</CardTitle>
                  <CardDescription>
                    {documents.length} document{documents.length !== 1 ? "s" : ""} enregistré{documents.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="capitalize">{doc.category}</span>
                                {doc.subcategory && (
                                  <>
                                    <span>•</span>
                                    <span>{doc.subcategory}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>•</span>
                                <span>{formatDate(doc.uploaded_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun document enregistré</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
