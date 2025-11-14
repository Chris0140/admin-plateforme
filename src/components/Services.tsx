import { Heart, PiggyBank, Car } from "lucide-react";
import ServiceCard from "./ServiceCard";

const Services = () => {
  const services = [
    {
      icon: Heart,
      title: "Assurance Maladie",
      description: "Comparez les primes et trouvez la meilleure couverture santé",
      savings: "Économisez jusqu'à 2'400 CHF/an",
      iconBg: "bg-red-600",
    },
    {
      icon: PiggyBank,
      title: "3ème Pilier",
      description: "Comparez les solutions 3A et optimisez vos économies fiscales",
      savings: "Économisez jusqu'à 2'000 CHF d'impôts/an",
      iconBg: "bg-emerald-600",
    },
    {
      icon: Car,
      title: "Assurance Véhicule",
      description: "Trouvez la meilleure assurance auto, moto ou vélo",
      savings: "Économisez jusqu'à 1'200 CHF/an",
      iconBg: "bg-blue-600",
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
