import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
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

const AVSAccountCard = ({ account, onEdit, onDelete }: AVSAccountCardProps) => {
  const [pensionResults, setPensionResults] = useState<AVSCalculationResult | null>(null);

  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
    <Card 
      className={`cursor-pointer transition-shadow hover:shadow-md ${account.is_active ? "" : "opacity-60"}`}
      onClick={() => onEdit(account)}
    >
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
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
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
        </div>

        {/* Pension Results */}
        {pensionResults && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Rentes estimées</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-md p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Rente vieillesse</p>
                <p className="text-xl font-bold text-primary">{formatCHF(pensionResults.old_age_rent_monthly)}</p>
                <p className="text-xs text-muted-foreground">/mois • {formatCHF(pensionResults.old_age_rent_annual)}/an</p>
              </div>
              <div className="bg-background rounded-md p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Rente invalidité</p>
                <p className="text-xl font-bold text-primary">{formatCHF(pensionResults.disability_rent_monthly)}</p>
                <p className="text-xs text-muted-foreground">/mois • {formatCHF(pensionResults.disability_rent_annual)}/an</p>
              </div>
              <div className="bg-background rounded-md p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Rente veuve/veuf</p>
                <p className="text-xl font-bold text-primary">{formatCHF(pensionResults.widow_rent_monthly)}</p>
                <p className="text-xs text-muted-foreground">/mois • {formatCHF(pensionResults.widow_rent_annual)}/an</p>
              </div>
              <div className="bg-background rounded-md p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Rente enfant</p>
                <p className="text-xl font-bold text-primary">{formatCHF(pensionResults.child_rent_monthly)}</p>
                <p className="text-xs text-muted-foreground">/mois • {formatCHF(pensionResults.child_rent_annual)}/an</p>
              </div>
            </div>
          </div>
        )}

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
