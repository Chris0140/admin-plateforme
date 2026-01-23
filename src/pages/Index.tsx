import { AppLayout } from "@/components/AppLayout";
import { Users, Star, TrendingUp, Calculator, Wallet, Scale, FileText, Shield, PieChart, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const services = [
    {
      icon: Scale,
      title: "Comparateur",
      description: "Comparez vos assurances et trouvez les offres les plus avantageuses",
      savings: "Jusqu'à 2'400 CHF/an",
      link: "/comparateur",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Wallet,
      title: "Budget",
      description: "Gérez votre budget et planifiez vos finances",
      savings: "Maîtrisez vos dépenses",
      link: "/budget",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Calculator,
      title: "Simulateur d'impôts",
      description: "Calculez et optimisez votre fiscalité",
      savings: "Jusqu'à 3'000 CHF/an",
      link: "/simulateur-impots",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: FileText,
      title: "Mes documents",
      description: "Stockez vos documents importants en sécurité",
      savings: "Accès instantané",
      link: "/account/documents",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const features = [
    { icon: TrendingUp, title: "Suivi en temps réel", description: "Visualisez l'évolution de votre patrimoine" },
    { icon: Shield, title: "Sécurité bancaire", description: "Vos données sont protégées" },
    { icon: PieChart, title: "Analyses détaillées", description: "Comprenez votre répartition d'actifs" },
    { icon: Landmark, title: "Multi-établissements", description: "Connectez tous vos comptes" },
  ];

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative mb-8 md:mb-12">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full glass mb-4 md:mb-6">
            <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            <span className="text-xs md:text-sm font-medium text-foreground/80">Votre tableau de bord financier</span>
          </div>

          {/* Main heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-4 md:mb-6">
            <span className="text-foreground">Bienvenue sur </span>
            <span className="text-gradient">TG Fulgence</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-6 md:mb-8">
            Gérez votre patrimoine, optimisez vos finances et prenez le contrôle de votre avenir financier.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="glass rounded-xl px-4 md:px-5 py-2.5 md:py-3 flex items-center gap-2 md:gap-3">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <div>
                <div className="text-xs md:text-sm font-semibold text-foreground">500K+</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">utilisateurs</div>
              </div>
            </div>
            <div className="glass rounded-xl px-4 md:px-5 py-2.5 md:py-3 flex items-center gap-2 md:gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 md:h-3 md:w-3 fill-primary text-primary" />
                ))}
              </div>
              <div>
                <div className="text-xs md:text-sm font-semibold text-foreground">4.8/5</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">avis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Services */}
      <div className="mb-8 md:mb-12">
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6">Accès rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {services.map((service, index) => (
            <Link key={index} to={service.link}>
              <Card className="glass border-border/50 h-full hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-4 md:p-5">
                  <div className={`inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl ${service.bgColor} mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className={`h-4 w-4 md:h-5 md:w-5 ${service.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  <span className="text-[10px] md:text-xs font-medium text-primary">{service.savings}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-8 md:mb-12">
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6">Pourquoi admin. ?</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 mb-3 md:mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm md:text-base text-foreground mb-1 md:mb-2">{feature.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="glass border-primary/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-[image:var(--gradient-glow)] opacity-30" />
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">
              Prêt à optimiser vos finances ?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              Commencez dès maintenant et découvrez combien vous pourriez économiser.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link to="/prevoyance">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 md:px-6 text-sm md:text-base">
                  Explorer ma prévoyance
                </Button>
              </Link>
              <Link to="/comparateur">
                <Button variant="outline" className="w-full sm:w-auto glass border-border/50 hover:border-primary/50 text-sm md:text-base">
                  Comparer mes assurances
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Index;
