import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
        "hover:scale-105 hover:shadow-lg cursor-pointer min-h-[120px]",
        "bg-card text-card-foreground",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/50"
      )}
    >
      <Icon className={cn(
        "h-8 w-8 mb-2",
        isSelected ? "text-primary" : "text-muted-foreground"
      )} />
      <span className="text-sm font-medium text-center leading-tight">{label}</span>
      {contractCount > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{contractCount}</span> contrat{contractCount > 1 ? 's' : ''}
        </div>
      )}
      {totalPremium > 0 && (
        <div className="text-xs text-primary font-medium">
          {totalPremium.toLocaleString('fr-CH')} CHF/an
        </div>
      )}
    </button>
  );
};

export default InsuranceTypeCube;
