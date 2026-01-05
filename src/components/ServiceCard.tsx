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
      className="group relative glass rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:border-primary/50 hover:shadow-[var(--shadow-gold)] overflow-hidden"
      onClick={handleClick}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Savings & Arrow */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <span className="text-xs font-medium text-primary">{savings}</span>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary transition-all duration-300 group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
