import { useState, useEffect } from "react";
import { Plus, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InsuranceContractForm from "./InsuranceContractForm";
import InsuranceDocumentUpload from "./InsuranceDocumentUpload";
import { InsuranceDocument, loadContractDocuments } from "@/lib/insuranceDocuments";

interface InsuranceAddPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  selectedType: string | null;
  selectedTypeLabel: string;
  selectedContractId: string | null;
  onBack: () => void;
}

const InsuranceAddPanel = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  selectedType,
  selectedTypeLabel,
  selectedContractId,
  onBack,
}: InsuranceAddPanelProps) => {
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  const loadDocuments = async () => {
    if (selectedContractId) {
      const docs = await loadContractDocuments(selectedContractId);
      setDocuments(docs);
    } else {
      setDocuments([]);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedContractId]);

  // Mode sélection active - affiche le type sélectionné et l'upload de documents
  if (selectedType) {
    return (
      <div className="flex flex-col gap-4 h-full">
        {/* Header avec type sélectionné */}
        <div className="space-y-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux catégories
          </Button>
          
          <Badge variant="secondary" className="w-full justify-center py-2">
            <FileText className="h-4 w-4 mr-2" />
            {selectedTypeLabel}
          </Badge>
        </div>

        <Separator />

        {/* Bouton ajouter une nouvelle assurance */}
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau contrat
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

        <Separator />

        {/* Section upload de documents */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Documents</h3>
          <InsuranceDocumentUpload
            contractId={selectedContractId}
            documents={documents}
            onDocumentsChange={loadDocuments}
          />
        </div>
      </div>
    );
  }

  // Mode par défaut - juste le bouton ajouter
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
