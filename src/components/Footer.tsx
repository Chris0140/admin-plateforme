import { Shield, Lock, Database, Star, Smartphone, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-20 border-t border-border/50 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Main footer content */}
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">admin<span className="text-primary">.</span></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              L'application qui vous aide à mieux gérer votre argent et optimiser vos finances.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-1">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <Monitor className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Produits</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/budget" className="text-sm text-muted-foreground hover:text-primary transition-colors">Budget</Link>
              <Link to="/prevoyance" className="text-sm text-muted-foreground hover:text-primary transition-colors">Prévoyance</Link>
              <Link to="/simulateur-impots" className="text-sm text-muted-foreground hover:text-primary transition-colors">Simulateur d'impôts</Link>
              <Link to="/comparateur" className="text-sm text-muted-foreground hover:text-primary transition-colors">Comparateur</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Ressources</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Guides</a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Légal</h4>
            <nav className="flex flex-col gap-3">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Mentions légales</a>
            </nav>
          </div>
        </div>

        {/* Trust badges */}
        <div className="border-t border-border/50 pt-12">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-8">
            <div className="flex items-center gap-3 glass px-5 py-3 rounded-full">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">FINMA</span>
            </div>
            <div className="flex items-center gap-3 glass px-5 py-3 rounded-full">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">SSL Sécurisé</span>
            </div>
            <div className="flex items-center gap-3 glass px-5 py-3 rounded-full">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Données Suisse</span>
            </div>
            <div className="flex items-center gap-3 glass px-5 py-3 rounded-full">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="text-sm font-medium text-foreground">4.8/5 avis</span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Admin. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
