import { Users, Building2, Clock, TrendingUp } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[image:var(--gradient-glow)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Votre tableau de bord financier</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            <span className="text-foreground">Gérez votre admin</span>{" "}
            <span className="text-gradient">autrement</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed">
            Comparez et optimisez vos assurances, gérez vos finances personnelles et anticipez vos impôts
          </p>

          {/* Stats - Finary style cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">500K+</div>
              <div className="text-sm text-muted-foreground">utilisateurs actifs</div>
            </div>
            
            <div className="glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">150+</div>
              <div className="text-sm text-muted-foreground">assureurs partenaires</div>
            </div>
            
            <div className="glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">2 min</div>
              <div className="text-sm text-muted-foreground">pour comparer</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
