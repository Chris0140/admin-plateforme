import { Calculator, Wallet, Scale } from "lucide-react";
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
    },
    {
      icon: Calculator,
      title: "Simulateur d'impôts",
      description: "Calculez vos impôts et optimisez votre fiscalité efficacement",
      savings: "Jusqu'à 3'000 CHF/an d'économies",
      iconBg: "bg-accent",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
