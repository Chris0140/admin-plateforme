import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Users, FileCheck } from "lucide-react";

const relationshipOptions = [
  { 
    value: "marie", 
    label: "Marié(e)", 
    icon: Heart,
    description: "Vous êtes légalement marié(e)"
  },
  { 
    value: "concubinage", 
    label: "Concubinage", 
    icon: Users,
    description: "Vous vivez en couple sans être marié(e)"
  },
  { 
    value: "partenaire_enregistre", 
    label: "Partenaire enregistré", 
    icon: FileCheck,
    description: "Partenariat enregistré officiellement"
  },
];

interface AddHouseholdMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRelationship: (relationship: string) => void;
}

const AddHouseholdMemberDialog = ({
  open,
  onOpenChange,
  onSelectRelationship,
}: AddHouseholdMemberDialogProps) => {
  const handleSelect = (relationship: string) => {
    onSelectRelationship(relationship);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter au foyer</DialogTitle>
          <DialogDescription>
            Choisissez le type de lien avec cette personne
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {relationshipOptions.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => handleSelect(option.value)}
            >
              <option.icon className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddHouseholdMemberDialog;
