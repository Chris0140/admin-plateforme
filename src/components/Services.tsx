import { Calculator, Wallet, Scale, FileText } from "lucide-react";
import ServiceCard from "./ServiceCard";

const Services = () => {
  const services = [
    {
      icon: Scale,
      title: "Comparateur",
      description: "Comparez vos assurances et trouvez les offres les plus avantageuses",
      savings: "Jusqu'à 2'400 CHF/an d'économies",
      iconBg: "bg-primary",
      link: "/comparateur",
    },
    {
      icon: Wallet,
      title: "Budget",
      description: "Gérez votre budget et planifiez vos finances en toute simplicité",
      savings: "Maîtrisez vos dépenses au quotidien",
      iconBg: "bg-secondary",
      link: "/budget",
    },
    {
      icon: Calculator,
      title: "Simulateur d'impôts",
      description: "Calculez vos impôts et optimisez votre fiscalité efficacement",
      savings: "Jusqu'à 3'000 CHF/an d'économies",
      iconBg: "bg-accent",
      link: "/simulateur-impots",
    },
    {
      icon: FileText,
      title: "Mes documents",
      description: "Stockez et gérez tous vos documents importants en toute sécurité",
      savings: "Accès rapide à vos documents",
      iconBg: "bg-primary",
      link: "/account/documents",
    },
  ];

  return (
    <section className="py-24 bg-background relative">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tous vos outils <span className="text-gradient">financiers</span>
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
  );
};

export default Services;
