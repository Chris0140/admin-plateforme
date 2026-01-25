import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InsuranceContractForm from "./InsuranceContractForm";

interface InsuranceAddPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const InsuranceAddPanel = ({ open, onOpenChange, onSuccess }: InsuranceAddPanelProps) => {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-muted-foreground">Gestion</h3>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une assurance
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau contrat d'assurance</DialogTitle>
          </DialogHeader>
          <InsuranceContractForm
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InsuranceAddPanel;
