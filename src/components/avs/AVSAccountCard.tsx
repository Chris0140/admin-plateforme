import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertTriangle } from "lucide-react";
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

const MARITAL_STATUS_LABELS: Record<string, string> = {
  'celibataire': 'Célibataire',
  'marie': 'Marié(e)',
  'divorce': 'Divorcé(e)',
  'veuf': 'Veuf/Veuve',
};

const AVSAccountCard = ({ account, onEdit, onDelete }: AVSAccountCardProps) => {
  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const yearsMissing = 44 - (account.years_contributed || 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {account.owner_name}
              {!account.is_active && (
                <Badge variant="secondary">Inactif</Badge>
              )}
            </CardTitle>
            {account.avs_number && (
              <CardDescription className="mt-1">
                N° AVS: {account.avs_number}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(account)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">État civil</p>
            <p className="text-lg font-semibold">
              {account.marital_status 
                ? MARITAL_STATUS_LABELS[account.marital_status] || account.marital_status 
                : "Non renseigné"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Revenu déterminant</p>
            <p className="text-lg font-semibold">
              {account.average_annual_income_determinant
                ? `${formatCHF(account.average_annual_income_determinant)} CHF`
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
        </div>

        {yearsMissing > 0 && (
          <div className="flex gap-2 p-3 mt-4 bg-destructive/10 border border-destructive/30 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {yearsMissing} année(s) de lacune.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AVSAccountCard;
