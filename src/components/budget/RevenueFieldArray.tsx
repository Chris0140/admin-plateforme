import { useFieldArray, Control } from "react-hook-form";
import { Plus, Trash2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface RevenueFieldArrayProps {
  control: Control<any>;
  name: string;
}

export function RevenueFieldArray({ control, name }: RevenueFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel className="text-base font-medium">Sources de revenus</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ source: "", amount: "" })}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter une source
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50"
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={control}
                name={`${name}.${index}.source`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <FormLabel className="text-xs text-muted-foreground">Source</FormLabel>}
                    <FormControl>
                      <Input
                        placeholder="Ex: Salaire principal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.${index}.amount`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <FormLabel className="text-xs text-muted-foreground">Montant</FormLabel>}
                    <FormControl>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="5000"
                          className="pl-10"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          CHF
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="mt-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border/50 rounded-xl">
          <Banknote className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune source de revenu ajoutée
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => append({ source: "", amount: "" })}
            className="mt-2"
          >
            Ajouter votre première source
          </Button>
        </div>
      )}
    </div>
  );
}
