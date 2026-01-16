import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadioCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function RadioCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
  disabled = false,
}: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300",
        "min-h-[140px] w-full text-center",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary animate-pulse" />
      )}
      <div
        className={cn(
          "flex items-center justify-center h-12 w-12 rounded-xl transition-colors",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className={cn(
          "font-semibold text-base",
          selected ? "text-foreground" : "text-foreground/80"
        )}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}
