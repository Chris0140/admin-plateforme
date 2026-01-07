import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, TrendingUp, Shield, Heart } from "lucide-react";
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

const WAITING_PERIOD_LABELS: Record<number, string> = {
  3: '3 mois',
  6: '6 mois',
  12: '12 mois',
  24: '24 mois',
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

  const showInsuranceFields = account.accountType === '3a_insurance' || account.accountType === '3b';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {account.institutionName}
              <Badge variant="secondary">
                {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              Taux de rendement: {account.returnRate}%
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(account.accountId)}
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
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer ce compte? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Capital actuel</p>
            <p className="text-lg font-semibold">
              {account.currentAmount.toLocaleString('fr-CH')} CHF
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Capital projeté à 65 ans</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              {account.projectedAmount.toLocaleString('fr-CH')} CHF
              <TrendingUp className="h-4 w-4 text-green-500" />
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cotisation annuelle</p>
            <p className="text-lg font-semibold">
              {account.annualContribution.toLocaleString('fr-CH')} CHF
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rente annuelle projetée</p>
            <p className="text-lg font-semibold">
              {account.projectedAnnualRent.toLocaleString('fr-CH')} CHF
            </p>
          </div>

          {account.deathCapital && account.deathCapital > 0 && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Capital décès
              </p>
              <p className="text-lg font-semibold">
                {account.deathCapital.toLocaleString('fr-CH')} CHF
              </p>
            </div>
          )}

          {showInsuranceFields && account.disabilityRentAnnual && account.disabilityRentAnnual > 0 && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Rente d'invalidité annuelle
              </p>
              <p className="text-lg font-semibold">
                {account.disabilityRentAnnual.toLocaleString('fr-CH')} CHF
              </p>
            </div>
          )}

          {showInsuranceFields && account.premiumExemptionWaitingPeriod && (
            <div>
              <p className="text-sm text-muted-foreground">Exonération des primes</p>
              <p className="text-sm font-medium">
                Délai: {WAITING_PERIOD_LABELS[account.premiumExemptionWaitingPeriod] || `${account.premiumExemptionWaitingPeriod} mois`}
              </p>
            </div>
          )}
        </div>

        {account.yearsToRetirement > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            Dans {account.yearsToRetirement} ans (à 65 ans)
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ThirdPillarAccountCard;