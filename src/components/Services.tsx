import { Calculator, Wallet, Scale } from "lucide-react";
import ServiceCard from "./ServiceCard";

const Services = () => {
  const services = [
    {
      icon: Calculator,
      title: "Simulateur d'impôts",
      description: "Calculez vos impôts et découvrez comment optimiser votre fiscalité",
      savings: "Économisez jusqu'à 3'000 CHF/an",
      iconBg: "bg-blue-600",
    },
    {
      icon: Wallet,
      title: "Budget",
      description: "Gérez votre budget personnel et planifiez vos finances",
      savings: "Contrôlez vos dépenses efficacement",
      iconBg: "bg-emerald-600",
    },
    {
      icon: Scale,
      title: "Comparateur",
      description: "Comparez les assurances et trouvez les meilleures offres",
      savings: "Économisez jusqu'à 2'400 CHF/an",
      iconBg: "bg-purple-600",
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
