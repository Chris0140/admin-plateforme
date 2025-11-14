import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Settings, FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Account = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            Mon Compte
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Settings Card */}
            <Link to="/account/settings">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-card hover:shadow-bronze transition-all cursor-pointer group">
                <div className="bg-gradient-to-br from-bronze to-bronze-light rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Settings className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Paramètres du compte
                </h2>
                <p className="text-muted-foreground">
                  Modifiez vos informations personnelles
                </p>
              </div>
            </Link>

            {/* Documents Card */}
            <Link to="/account/documents">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-card hover:shadow-bronze transition-all cursor-pointer group">
                <div className="bg-gradient-to-br from-bronze to-bronze-light rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Mes documents
                </h2>
                <p className="text-muted-foreground">
                  Gérez vos documents PDF
                </p>
              </div>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="mt-8">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full md:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
