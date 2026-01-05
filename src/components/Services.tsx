import { Calculator, Wallet, Scale, FileText, TrendingUp, Shield, PieChart, Landmark } from "lucide-react";
import ServiceCard from "./ServiceCard";

const Services = () => {
  const services = [
    {
      icon: Scale,
      title: "Comparateur",
      description: "Comparez vos assurances et trouvez les offres les plus avantageuses pour économiser",
      savings: "Jusqu'à 2'400 CHF/an",
      iconBg: "bg-primary",
      link: "/comparateur",
    },
    {
      icon: Wallet,
      title: "Budget",
      description: "Gérez votre budget et planifiez vos finances en toute simplicité",
      savings: "Maîtrisez vos dépenses",
      iconBg: "bg-secondary",
      link: "/budget",
    },
    {
      icon: Calculator,
      title: "Simulateur d'impôts",
      description: "Calculez vos impôts et optimisez votre fiscalité efficacement",
      savings: "Jusqu'à 3'000 CHF/an",
      iconBg: "bg-accent",
      link: "/simulateur-impots",
    },
    {
      icon: FileText,
      title: "Mes documents",
      description: "Stockez et gérez tous vos documents importants en toute sécurité",
      savings: "Accès instantané",
      iconBg: "bg-primary",
      link: "/account/documents",
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Suivi en temps réel",
      description: "Visualisez l'évolution de votre patrimoine instantanément"
    },
    {
      icon: Shield,
      title: "Sécurité bancaire",
      description: "Vos données sont protégées avec un chiffrement de niveau bancaire"
    },
    {
      icon: PieChart,
      title: "Analyses détaillées",
      description: "Comprenez votre répartition d'actifs en un coup d'œil"
    },
    {
      icon: Landmark,
      title: "Multi-établissements",
      description: "Connectez tous vos comptes bancaires et courtiers"
    },
  ];

  return (
    <>
      {/* Main services section */}
      <section className="py-24 bg-background relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Suivez votre patrimoine.{" "}
              <span className="text-gradient">Simplifiez tout.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Une suite complète pour gérer, optimiser et visualiser vos finances
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* Features section - Finary style */}
      <section className="py-24 bg-card/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin.{" "}
              <span className="text-gradient">Rien de plus.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Finary style */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-glow)] opacity-50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Prêt à reprendre le contrôle ?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Rejoignez des milliers d'utilisateurs qui gèrent déjà mieux leur argent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-gold)] hover:shadow-[0_10px_60px_-10px_hsl(38_90%_55%_/_0.4)] transition-all duration-300"
              >
                Commencer gratuitement
              </a>
              <a 
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl glass text-foreground hover:border-primary/50 transition-all duration-300"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;
