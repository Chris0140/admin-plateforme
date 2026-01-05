import { ArrowRight, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  savings: string;
  iconBg: string;
  link?: string;
}

const ServiceCard = ({ icon: Icon, title, description, savings, link }: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div 
      className="group relative glass rounded-2xl p-8 cursor-pointer transition-all duration-500 hover:border-primary/50 hover:shadow-[var(--shadow-gold)]"
      onClick={handleClick}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          <Icon className="h-7 w-7 text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-gradient transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>

        {/* Savings & Arrow */}
        <div className="flex items-center justify-between pt-5 border-t border-border/50">
          <span className="text-sm font-medium text-primary">{savings}</span>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary transition-all duration-300 group-hover:translate-x-1">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
