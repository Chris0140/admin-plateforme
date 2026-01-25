import { X, Edit, Trash2, FileUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { InsuranceContract, INSURANCE_TYPE_LABELS, deleteInsuranceContract } from "@/lib/insuranceCalculations";
import InsuranceContractForm from "./InsuranceContractForm";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface InsuranceDetailPanelProps {
  selectedType: string | null;
  subTypes?: InsuranceContract['insurance_type'][];
  typeLabel: string;
  contracts: InsuranceContract[];
  onClose: () => void;
  onRefresh: () => void;
}

const InsuranceDetailPanel = ({
  selectedType,
  subTypes,
  typeLabel,
  contracts,
  onClose,
  onRefresh,
}: InsuranceDetailPanelProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [activeSubType, setActiveSubType] = useState<string | null>(null);

  const handleDelete = async (contractId: string) => {
    const result = await deleteInsuranceContract(contractId);
    if (result.success) {
      toast({
        title: "Contrat supprimé",
        description: "Le contrat a été supprimé avec succès.",
      });
      onRefresh();
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Impossible de supprimer le contrat.",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setEditingContractId(null);
    onRefresh();
  };

  // Filter contracts based on type or subTypes
  const filteredContracts = useMemo(() => {
    if (subTypes && subTypes.length > 0) {
      // If we have subTypes and an active filter, use it
      if (activeSubType) {
        return contracts.filter(c => c.insurance_type === activeSubType);
      }
      // Otherwise show all subTypes
      return contracts.filter(c => subTypes.includes(c.insurance_type));
    }
    // Single type
    return contracts.filter(c => c.insurance_type === selectedType);
  }, [contracts, selectedType, subTypes, activeSubType]);

  const hasSubTypes = subTypes && subTypes.length > 1;

  const renderContractCard = (contract: InsuranceContract) => (
    <div
      key={contract.id}
      className="p-4 rounded-lg border bg-card space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{contract.company_name}</h4>
          {contract.contract_number && (
            <p className="text-xs text-muted-foreground">
              N° {contract.contract_number}
            </p>
          )}
          {hasSubTypes && (
            <Badge variant="outline" className="text-xs mt-1">
              {contract.insurance_type === 'health_basic' ? 'LAMal' : 'LCA'}
            </Badge>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {contract.annual_premium.toLocaleString('fr-CH')} CHF/an
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {contract.deductible && contract.deductible > 0 && (
          <div>
            <span className="text-muted-foreground">Franchise:</span>{" "}
            <span className="font-medium">{contract.deductible.toLocaleString('fr-CH')} CHF</span>
          </div>
        )}
        {contract.coverage_amount && contract.coverage_amount > 0 && (
          <div>
            <span className="text-muted-foreground">Couverture:</span>{" "}
            <span className="font-medium">{contract.coverage_amount.toLocaleString('fr-CH')} CHF</span>
          </div>
        )}
      </div>

      {contract.notes && (
        <p className="text-xs text-muted-foreground">{contract.notes}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditingContractId(contract.id)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </Button>
        <Button variant="outline" size="sm" disabled>
          <FileUp className="h-3 w-3 mr-1" />
          Document
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(contract.id)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{typeLabel}</h3>
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Sub-type tabs for health insurance */}
      {hasSubTypes && (
        <Tabs 
          value={activeSubType || 'all'} 
          onValueChange={(v) => setActiveSubType(v === 'all' ? null : v)}
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="health_basic">LAMal</TabsTrigger>
            <TabsTrigger value="health_complementary">LCA</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <Separator className="mb-4" />
      
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-2">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun contrat de ce type</p>
            </div>
          ) : (
            filteredContracts.map(renderContractCard)
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingContractId} onOpenChange={(open) => !open && setEditingContractId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le contrat</DialogTitle>
          </DialogHeader>
          <InsuranceContractForm
            contractId={editingContractId}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingContractId(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );

  if (!selectedType) return null;

  if (isMobile) {
    return (
      <Drawer open={!!selectedType} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>{typeLabel}</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="h-full animate-slide-in-right">
      {content}
    </div>
  );
};

export default InsuranceDetailPanel;
