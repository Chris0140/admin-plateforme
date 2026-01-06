import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Landmark } from "lucide-react";
import { ThirdPillarProjection } from "@/lib/thirdPillarCalculations";
import { deleteThirdPillarAccount } from "@/lib/thirdPillarCalculations";
import { useToast } from "@/hooks/use-toast";
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

interface ThirdPillarAccountCardProps {
  account: ThirdPillarProjection;
  onEdit: (accountId: string) => void;
  onDelete: () => void;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  '3a_bank': '3a Bancaire',
  '3a_insurance': '3a Assurance',
  '3b': '3b',
};

const ThirdPillarAccountCard = ({ account, onEdit, onDelete }: ThirdPillarAccountCardProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    const result = await deleteThirdPillarAccount(account.accountId);
    
    if (result.success) {
      toast({
        title: "Compte supprimé",
        description: "Le compte a été supprimé avec succès.",
      });
      onDelete();
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Impossible de supprimer le compte.",
        variant: "destructive",
      });
    }
  };

  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' CHF';
  };

  const showInsuranceFields = account.accountType === '3a_insurance' || account.accountType === '3b';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{account.institutionName}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(account.accountId)}
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
                  <AlertDialogTitle>Supprimer ce compte 3ème pilier ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les données de ce compte seront définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType} • Taux: {account.returnRate}%
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capital actuel et cotisation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Capital actuel</p>
            <p className="text-lg font-semibold">{formatCHF(account.currentAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cotisation annuelle</p>
            <p className="text-lg font-semibold">{formatCHF(account.annualContribution)}</p>
          </div>
        </div>

        {/* Capital projeté */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Capital projeté à 65 ans</p>
          <p className="text-xl font-bold text-green-600">
            {formatCHF(account.projectedAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Rente annuelle: {formatCHF(account.projectedAnnualRent)}
          </p>
        </div>

        {/* Invalidité & Décès */}
        {showInsuranceFields && (account.deathCapital || account.disabilityRentAnnual) && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            {account.disabilityRentAnnual && account.disabilityRentAnnual > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Rente invalidité</p>
                <p className="text-sm font-semibold">
                  {formatCHF(account.disabilityRentAnnual / 12)}<span className="text-xs">/mois</span>
                </p>
              </div>
            )}
            {account.deathCapital && account.deathCapital > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Capital décès</p>
                <p className="text-sm font-semibold">{formatCHF(account.deathCapital)}</p>
              </div>
            )}
          </div>
        )}

        {/* Années jusqu'à la retraite */}
        {account.yearsToRetirement > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Dans {account.yearsToRetirement} ans (à 65 ans)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThirdPillarAccountCard;
