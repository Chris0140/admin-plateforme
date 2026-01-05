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
      <div className="relative mb-12">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Votre tableau de bord financier</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            <span className="text-foreground">Bienvenue sur </span>
            <span className="text-gradient">admin.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
            Gérez votre patrimoine, optimisez vos finances et prenez le contrôle de votre avenir financier.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-semibold text-foreground">500K+</div>
                <div className="text-xs text-muted-foreground">utilisateurs</div>
              </div>
            </div>
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">4.8/5</div>
                <div className="text-xs text-muted-foreground">avis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Services */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Accès rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service, index) => (
            <Link key={index} to={service.link}>
              <Card className="glass border-border/50 h-full hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-5">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${service.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className={`h-5 w-5 ${service.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  <span className="text-xs font-medium text-primary">{service.savings}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Pourquoi admin. ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="glass border-primary/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-[image:var(--gradient-glow)] opacity-30" />
        <CardContent className="p-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Prêt à optimiser vos finances ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Commencez dès maintenant et découvrez combien vous pourriez économiser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/prevoyance">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6">
                  Explorer ma prévoyance
                </Button>
              </Link>
              <Link to="/comparateur">
                <Button variant="outline" className="glass border-border/50 hover:border-primary/50">
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
