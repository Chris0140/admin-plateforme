import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FixedExpenseCardProps {
  expense: {
    id: string;
    name: string;
    category: string;
    amount: number;
    frequency: string;
    notes?: string;
    is_active?: boolean;
  };
  onEdit: (expense: any) => void;
  onDelete: (id: string) => void;
}

const FixedExpenseCard = ({ expense, onEdit, onDelete }: FixedExpenseCardProps) => {
  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const monthlyAmount = expense.frequency === 'annuel' ? expense.amount / 12 : expense.amount;
  const annualAmount = expense.frequency === 'mensuel' ? expense.amount * 12 : expense.amount;

  return (
    <Card className={expense.is_active ? "" : "opacity-60"}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{expense.name}</CardTitle>
              {!expense.is_active && (
                <Badge variant="secondary" className="text-xs">Inactif</Badge>
              )}
            </div>
            <Badge variant="outline" className="text-xs">{expense.category}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(expense)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La dépense "{expense.name}" sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(expense.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Mensuel</p>
            <p className="text-xl font-semibold">{formatCHF(monthlyAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Annuel</p>
            <p className="text-xl font-semibold">{formatCHF(annualAmount)}</p>
          </div>
        </div>
        {expense.notes && (
          <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
            {expense.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FixedExpenseCard;
