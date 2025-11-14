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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-16 text-center bg-gradient-to-r from-bronze via-bronze-light to-bronze bg-clip-text text-transparent">
            Mon Compte
          </h1>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Settings Card */}
            <Link to="/account/settings" className="group">
              <div className="text-center space-y-6 p-8 rounded-3xl hover:bg-card/30 transition-all duration-300">
                <div className="mx-auto bg-gradient-to-br from-bronze to-bronze-light rounded-2xl p-8 w-fit shadow-bronze group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  <Settings className="h-12 w-12 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-3 group-hover:text-bronze-light transition-colors">
                    Paramètres du compte
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Modifiez vos informations personnelles
                  </p>
                </div>
              </div>
            </Link>

            {/* Documents Card */}
            <Link to="/account/documents" className="group">
              <div className="text-center space-y-6 p-8 rounded-3xl hover:bg-card/30 transition-all duration-300">
                <div className="mx-auto bg-gradient-to-br from-bronze to-bronze-light rounded-2xl p-8 w-fit shadow-bronze group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  <FileText className="h-12 w-12 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-3 group-hover:text-bronze-light transition-colors">
                    Mes documents
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Gérez vos documents PDF
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="text-center">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="lg"
              className="text-base hover:bg-card/50"
            >
              <LogOut className="h-5 w-5 mr-2" />
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
