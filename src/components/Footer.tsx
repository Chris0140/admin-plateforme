import { Shield, Lock, Database } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-card/30">
      <div className="container mx-auto px-4">
        {/* Trust badges */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-6">Plateforme officielle certifiée</p>
          <div className="flex flex-wrap justify-center gap-12">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">FINMA SUPERVISÉ</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">SSL SÉCURISÉ</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">DONNÉES PROTÉGÉES</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
