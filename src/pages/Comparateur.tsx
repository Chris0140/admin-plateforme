import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Car, PawPrint, Wallet, Home, Bike, Plane } from "lucide-react";

const Comparateur = () => {
  const navigate = useNavigate();

  const comparateurs = [
    {
      icon: Shield,
      title: "Assurance Maladie",
      description: "Comparez les assurances maladie et trouvez la meilleure couverture",
      path: "/comparateur/assurance-maladie",
    },
    {
      icon: Car,
      title: "Assurance Véhicule",
      description: "Trouvez la meilleure assurance pour votre véhicule",
      path: "/comparateur/assurance-vehicule",
    },
    {
      icon: Wallet,
      title: "3ème Pilier",
      description: "Comparez les solutions de prévoyance",
      path: "/comparateur/troisieme-pilier",
    },
    {
      icon: Home,
      title: "Assurance Inventaire Ménage",
      description: "Protégez vos biens avec la meilleure assurance",
      path: "/comparateur/assurance-inventaire-menage",
    },
    {
      icon: Bike,
      title: "Assurance Moto",
      description: "Trouvez la meilleure assurance pour votre moto",
      path: "/comparateur/assurance-moto",
    },
    {
      icon: Plane,
      title: "Assurance Voyage",
      description: "Voyagez l'esprit tranquille avec la meilleure couverture",
      path: "/comparateur/assurance-voyage",
    },
    {
      icon: PawPrint,
      title: "Assurance Animaux",
      description: "Protégez vos compagnons avec la meilleure assurance",
      path: "/comparateur/assurance-animaux",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Choisissez votre comparateur
            </h1>
            <p className="text-muted-foreground text-lg">
              Sélectionnez le type de comparaison que vous souhaitez effectuer
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {comparateurs.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={index}
                  className="p-4 md:p-6 hover:border-primary transition-all cursor-pointer group"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">{item.description}</p>
                    </div>
                    <Button className="w-full">
                      Comparer
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Comparateur;
