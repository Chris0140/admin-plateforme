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
          <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl shadow-sm">
            <h4 className="text-base font-semibold text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Rentes estimées
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background rounded-lg p-4 border-2 border-primary/20 shadow-sm hover:border-primary/40 transition-colors">
                <p className="font-semibold text-foreground text-sm mb-1">Rente vieillesse</p>
                <p className="text-2xl font-bold text-primary">{formatCHF(pensionResults.old_age_rent_annual)}<span className="text-xs font-medium text-muted-foreground ml-1">/an</span></p>
                <p className="text-sm text-muted-foreground mt-1">{formatCHF(pensionResults.old_age_rent_monthly)}/mois</p>
              </div>
              <div className="bg-background rounded-lg p-4 border-2 border-orange-200 shadow-sm hover:border-orange-300 transition-colors">
                <p className="font-semibold text-foreground text-sm mb-1">Rente invalidité</p>
                <p className="text-2xl font-bold text-orange-600">{formatCHF(pensionResults.disability_rent_annual)}<span className="text-xs font-medium text-muted-foreground ml-1">/an</span></p>
                <p className="text-sm text-muted-foreground mt-1">{formatCHF(pensionResults.disability_rent_monthly)}/mois</p>
              </div>
              <div className="bg-background rounded-lg p-4 border-2 border-purple-200 shadow-sm hover:border-purple-300 transition-colors">
                <p className="font-semibold text-foreground text-sm mb-1">Rente veuve/veuf</p>
                <p className="text-2xl font-bold text-purple-600">{formatCHF(pensionResults.widow_rent_annual)}<span className="text-xs font-medium text-muted-foreground ml-1">/an</span></p>
                <p className="text-sm text-muted-foreground mt-1">{formatCHF(pensionResults.widow_rent_monthly)}/mois</p>
              </div>
              <div className="bg-background rounded-lg p-4 border-2 border-teal-200 shadow-sm hover:border-teal-300 transition-colors">
                <p className="font-semibold text-foreground text-sm mb-1">Rente enfant</p>
                <p className="text-2xl font-bold text-teal-600">{formatCHF(pensionResults.child_rent_annual)}<span className="text-xs font-medium text-muted-foreground ml-1">/an</span></p>
                <p className="text-sm text-muted-foreground mt-1">{formatCHF(pensionResults.child_rent_monthly)}/mois</p>
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
