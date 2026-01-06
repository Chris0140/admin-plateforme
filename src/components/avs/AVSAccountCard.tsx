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
    <Card className={account.is_active ? "" : "opacity-60"}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div 
            className="flex-1 cursor-pointer" 
            onClick={() => onEdit(account)}
          >
            <CardTitle className="text-lg">{account.owner_name}</CardTitle>
            {account.avs_number && (
              <p className="text-sm text-muted-foreground">N° AVS: {account.avs_number}</p>
            )}
          </div>
          <div className="flex gap-2">
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
        {account.marital_status && (
          <p className="text-sm text-muted-foreground capitalize">{account.marital_status}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rentes estimées - En premier */}
        {pensionResults && (
          <>
            {/* Rente vieillesse - Principale */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Rente de vieillesse</p>
              <p className="text-xl font-bold text-primary">
                {formatCHF(pensionResults.old_age_rent_monthly)}<span className="text-sm font-normal text-muted-foreground">/mois</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCHF(pensionResults.old_age_rent_annual)} par an
              </p>
            </div>

            {/* Invalidité & Survivants */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Rente invalidité</p>
                <p className="text-sm font-semibold">
                  {formatCHF(pensionResults.disability_rent_monthly)}<span className="text-xs text-muted-foreground">/mois</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rente veuve/veuf</p>
                <p className="text-sm font-semibold">
                  {formatCHF(pensionResults.widow_rent_monthly)}<span className="text-xs text-muted-foreground">/mois</span>
                </p>
              </div>
            </div>

            {/* Rente enfant */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Rente enfant</p>
                <p className="text-sm font-semibold">
                  {formatCHF(pensionResults.child_rent_monthly)}<span className="text-xs text-muted-foreground">/mois</span>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Informations du compte */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Revenu déterminant</p>
            <p className="text-sm font-semibold">
              {account.average_annual_income_determinant
                ? formatCHF(account.average_annual_income_determinant)
                : "Non renseigné"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Années cotisées</p>
            <p className="text-sm font-semibold">
              {account.years_contributed || 0} / 44
            </p>
          </div>
        </div>

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
