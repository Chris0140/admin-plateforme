import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Car, PawPrint, Wallet } from "lucide-react";

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
      icon: PawPrint,
      title: "Assurance Animaux",
      description: "Protégez vos compagnons avec la meilleure assurance",
      path: "/comparateur/assurance-animaux",
    },
    {
      icon: Wallet,
      title: "3ème Pilier",
      description: "Comparez les solutions de prévoyance",
      path: "/comparateur/troisieme-pilier",
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

          <div className="grid md:grid-cols-2 gap-6">
            {comparateurs.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:border-primary transition-all cursor-pointer group"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground">{item.description}</p>
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
