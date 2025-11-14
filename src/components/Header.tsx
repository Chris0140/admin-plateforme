import { Shield, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-xl p-2.5">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">admin.</h1>
              <p className="text-xs text-muted-foreground">Plateforme d'administration</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-primary font-medium hover:text-bronze-light transition-colors">
              Accueil
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Comparateur
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Simulation d'impôts
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Budget
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Mes documents
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Contact Info */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-foreground">0800 123 456</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-foreground">info@admin.ch</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
