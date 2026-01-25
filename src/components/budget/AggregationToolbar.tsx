import { Calculator, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AggregationToolbarProps {
  selectedCount: number;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onCalculate: () => void;
  onClear: () => void;
}

const months = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

export function AggregationToolbar({
  selectedCount,
  month,
  year,
  onMonthChange,
  onYearChange,
  onCalculate,
  onClear,
}: AggregationToolbarProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium">
          {selectedCount} compte{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Select value={month.toString()} onValueChange={(v) => onMonthChange(parseInt(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onCalculate} className="gap-2">
        <Calculator className="h-4 w-4" />
        Calculer
      </Button>

      <Button variant="ghost" size="icon" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
