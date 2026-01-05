import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Car, PawPrint, Wallet, Home, Bike, Plane, ChevronRight } from "lucide-react";

const Comparateur = () => {
  const navigate = useNavigate();

  const comparateurs = [
    {
      icon: Shield,
      title: "Assurance Maladie",
      description: "Comparez les assurances maladie et trouvez la meilleure couverture",
      path: "/comparateur/assurance-maladie",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      icon: Car,
      title: "Assurance Véhicule",
      description: "Trouvez la meilleure assurance pour votre véhicule",
      path: "/comparateur/assurance-vehicule",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Wallet,
      title: "3ème Pilier",
      description: "Comparez les solutions de prévoyance",
      path: "/comparateur/troisieme-pilier",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Home,
      title: "Assurance Inventaire Ménage",
      description: "Protégez vos biens avec la meilleure assurance",
      path: "/comparateur/assurance-inventaire-menage",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Bike,
      title: "Assurance Moto",
      description: "Trouvez la meilleure assurance pour votre moto",
      path: "/comparateur/assurance-moto",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Plane,
      title: "Assurance Voyage",
      description: "Voyagez l'esprit tranquille avec la meilleure couverture",
      path: "/comparateur/assurance-voyage",
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      icon: PawPrint,
      title: "Assurance Animaux",
      description: "Protégez vos compagnons avec la meilleure assurance",
      path: "/comparateur/assurance-animaux",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <AppLayout title="Comparateur" subtitle="Sélectionnez le type de comparaison que vous souhaitez effectuer">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparateurs.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="glass border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group overflow-hidden"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Comparateur;
