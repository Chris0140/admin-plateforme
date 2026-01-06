import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateAVSFromScale, AVSCalculationResult } from "@/lib/avsCalculations";
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
  const [pensionResults, setPensionResults] = useState<AVSCalculationResult | null>(null);

  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' CHF';
  };

  const yearsMissing = 44 - (account.years_contributed || 0);

  useEffect(() => {
    const calculatePension = async () => {
      if (account.average_annual_income_determinant && account.average_annual_income_determinant > 0) {
        try {
          const result = await calculateAVSFromScale(
            account.average_annual_income_determinant,
            account.years_contributed || 44
          );
          setPensionResults(result);
        } catch (error) {
          console.error("Erreur calcul rente:", error);
          setPensionResults(null);
        }
      }
    };
    calculatePension();
  }, [account.average_annual_income_determinant, account.years_contributed]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{account.owner_name}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(account)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce compte AVS ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les données de ce compte seront définitivement supprimées.
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
        {account.avs_number && (
          <p className="text-sm text-muted-foreground">N° AVS: {account.avs_number}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations principales */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Revenu déterminant</p>
            <p className="text-lg font-semibold">
              {account.average_annual_income_determinant
                ? formatCHF(account.average_annual_income_determinant)
                : "Non renseigné"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">État civil</p>
            <p className="text-lg font-semibold">
              {account.marital_status 
                ? MARITAL_STATUS_LABELS[account.marital_status] || account.marital_status 
                : "Non renseigné"}
            </p>
          </div>
        </div>

        {/* Rente vieillesse */}
        {pensionResults && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Rente de vieillesse</p>
            <p className="text-xl font-bold text-green-600">
              {formatCHF(pensionResults.old_age_rent_monthly)}<span className="text-sm font-normal">/mois</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCHF(pensionResults.old_age_rent_annual)} par an
            </p>
          </div>
        )}

        {/* Années cotisées */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Années cotisées</p>
            <p className="text-sm font-semibold">{account.years_contributed || 0} / 44</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Années manquantes</p>
            <p className="text-sm font-semibold">{yearsMissing}</p>
          </div>
        </div>

        {/* Alerte lacunes */}
        {yearsMissing > 0 && (
          <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
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
