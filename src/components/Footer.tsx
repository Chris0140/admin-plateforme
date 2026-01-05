import { Shield, Lock, Database, Star } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border/50 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Trust badges */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-8">Plateforme officielle certifiée</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3 glass px-6 py-3 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">FINMA</span>
            </div>
            <div className="flex items-center gap-3 glass px-6 py-3 rounded-full">
              <Lock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">SSL Sécurisé</span>
            </div>
            <div className="flex items-center gap-3 glass px-6 py-3 rounded-full">
              <Database className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Données protégées</span>
            </div>
            <div className="flex items-center gap-3 glass px-6 py-3 rounded-full">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">4.8/5 avis</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
