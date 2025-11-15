import { Users, Building2, Clock } from "lucide-react";
const Hero = () => {
  return <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-50"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-card rounded-2xl border-2 border-primary mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-foreground rounded-lg"></div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Gérez votre admin{" "}
            <span className="text-primary">autrement</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Comparez et optimisez vos assurances, gérez vos finances personnelles et anticipez vos impôts
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">500K+</div>
                <div className="text-sm text-muted-foreground">utilisateurs</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">150+</div>
                <div className="text-sm text-muted-foreground">assureurs</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">2 min</div>
                <div className="text-sm text-muted-foreground">comparaison</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;