import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { InsuranceContract, INSURANCE_TYPE_LABELS, deleteInsuranceContract } from "@/lib/insuranceCalculations";
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

interface InsuranceContractCardProps {
  contract: InsuranceContract;
  onEdit: (contractId: string) => void;
  onDelete: () => void;
}

const InsuranceContractCard = ({ contract, onEdit, onDelete }: InsuranceContractCardProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    const result = await deleteInsuranceContract(contract.id);
    
    if (result.success) {
      toast({
        title: "Contrat supprimé",
        description: "Le contrat a été supprimé avec succès.",
      });
      onDelete();
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Impossible de supprimer le contrat.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              {contract.company_name}
              <Badge variant="secondary">
                {INSURANCE_TYPE_LABELS[contract.insurance_type]}
              </Badge>
            </CardTitle>
            {contract.contract_number && (
              <p className="text-sm text-muted-foreground mt-1">
                Contrat: {contract.contract_number}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(contract.id)}
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
                    Êtes-vous sûr de vouloir supprimer ce contrat? Cette action est irréversible.
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
            <p className="text-sm text-muted-foreground">Prime annuelle</p>
            <p className="text-lg font-semibold">
              {contract.annual_premium.toLocaleString('fr-CH')} CHF
            </p>
          </div>
          {contract.deductible && contract.deductible > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Franchise</p>
              <p className="text-lg font-semibold">
                {contract.deductible.toLocaleString('fr-CH')} CHF
              </p>
            </div>
          )}
          {contract.coverage_amount && contract.coverage_amount > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Couverture</p>
              <p className="text-lg font-semibold">
                {contract.coverage_amount.toLocaleString('fr-CH')} CHF
              </p>
            </div>
          )}
          {contract.death_capital && contract.death_capital > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Capital décès</p>
              <p className="text-lg font-semibold">
                {contract.death_capital.toLocaleString('fr-CH')} CHF
              </p>
            </div>
          )}
          {contract.disability_rent_annual && contract.disability_rent_annual > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Rente invalidité</p>
              <p className="text-lg font-semibold">
                {contract.disability_rent_annual.toLocaleString('fr-CH')} CHF/an
              </p>
            </div>
          )}
        </div>
        {contract.notes && (
          <p className="text-sm text-muted-foreground mt-4">{contract.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default InsuranceContractCard;