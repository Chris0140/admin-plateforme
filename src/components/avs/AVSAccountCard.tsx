import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
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

interface AVSAccountCardProps {
  account: {
    id: string;
    owner_name: string;
    avs_number?: string;
    marital_status?: string;
    average_annual_income_determinant?: number;
    years_contributed?: number;
    is_active?: boolean;
  };
  onEdit: (account: any) => void;
  onDelete: (id: string) => void;
}

const AVSAccountCard = ({ account, onEdit, onDelete }: AVSAccountCardProps) => {
  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const yearsMissing = 44 - (account.years_contributed || 0);
  const rentCoefficient = Math.round(((account.years_contributed || 0) / 44) * 100);

  return (
    <Card className={account.is_active ? "" : "opacity-60"}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{account.owner_name}</CardTitle>
            {account.avs_number && (
              <p className="text-sm text-muted-foreground">N° AVS: {account.avs_number}</p>
            )}
            {account.marital_status && (
              <p className="text-sm text-muted-foreground capitalize">État civil: {account.marital_status}</p>
            )}
            {!account.is_active && (
              <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                Inactif
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(account)}
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
                    Cette action est irréversible. Le compte AVS "{account.owner_name}" sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(account.id)}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Revenu déterminant</p>
            <p className="text-lg font-semibold">
              {account.average_annual_income_determinant
                ? formatCHF(account.average_annual_income_determinant)
                : "Non renseigné"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Années cotisées</p>
            <p className="text-lg font-semibold">
              {account.years_contributed || 0} / 44
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Années manquantes</p>
            <p className="text-lg font-semibold">
              {yearsMissing}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Coefficient</p>
            <p className="text-lg font-semibold">
              {rentCoefficient}%
            </p>
          </div>
        </div>

        {yearsMissing > 0 && (
          <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md mt-4">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {yearsMissing} année(s) de lacune
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AVSAccountCard;
