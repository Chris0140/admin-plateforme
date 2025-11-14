import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-primary rounded-xl p-2.5">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">admin.</h1>
              <p className="text-xs text-muted-foreground">Plateforme d'administration</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-primary font-medium hover:text-bronze-light transition-colors">
              Accueil
            </Link>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Comparateur
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Simulation d'impôts
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Budget
            </a>
            {user ? (
              <Link to="/account/documents" className="text-foreground hover:text-primary transition-colors">
                Mes documents
              </Link>
            ) : (
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Mes documents
              </a>
            )}
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          {/* Account Button */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <Button disabled className="bg-gradient-to-r from-bronze to-bronze-light">
                Chargement...
              </Button>
            ) : user ? (
              <Link to="/account">
                <Button className="bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze">
                  Mon compte
                </Button>
              </Link>
            ) : (
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze">
                  Créer un compte
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
