import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InsuranceTypeCubeProps {
  type: string;
  label: string;
  icon: LucideIcon;
  contractCount: number;
  totalPremium: number;
  isSelected: boolean;
  onClick: () => void;
}

const InsuranceTypeCube = ({
  type,
  label,
  icon: Icon,
  contractCount,
  totalPremium,
  isSelected,
  onClick,
}: InsuranceTypeCubeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
              "hover:scale-105 hover:shadow-lg cursor-pointer aspect-square",
              "bg-card text-card-foreground",
              isSelected
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border hover:border-primary/50"
            )}
          >
            <Icon className={cn(
              "h-10 w-10",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
            
            {/* Badge for contract count */}
            {contractCount > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {contractCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <p className="font-medium">{label}</p>
          {contractCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {contractCount} contrat{contractCount > 1 ? 's' : ''} • {totalPremium.toLocaleString('fr-CH')} CHF/an
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InsuranceTypeCube;
