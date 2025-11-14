import { ArrowRight, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  savings: string;
  iconBg: string;
  link?: string;
}

const ServiceCard = ({ icon: Icon, title, description, savings, iconBg, link }: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <Card 
      className="bg-[image:var(--gradient-card)] border-border hover:border-primary transition-all duration-300 p-8 group cursor-pointer shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-bronze)]"
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-16 h-16 ${iconBg} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className="h-8 w-8 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground mb-6">{description}</p>

      {/* Savings */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-primary font-semibold">{savings}</span>
        <Button variant="ghost" size="icon" className="text-primary hover:text-bronze-light hover:bg-primary/10">
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};

export default ServiceCard;
