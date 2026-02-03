import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, Users, FileCheck, Link2 } from "lucide-react";

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
  onOpenLinkDialog?: () => void;
}

const AddHouseholdMemberDialog = ({
  open,
  onOpenChange,
  onSelectRelationship,
  onOpenLinkDialog,
}: AddHouseholdMemberDialogProps) => {
  const handleSelect = (relationship: string) => {
    onSelectRelationship(relationship);
    onOpenChange(false);
  };

  const handleOpenLink = () => {
    if (onOpenLinkDialog) {
      onOpenLinkDialog();
    }
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

          <div className="relative my-2">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OU
            </span>
          </div>

          <Button
            variant="secondary"
            className="w-full justify-start h-auto py-4 px-4"
            onClick={handleOpenLink}
          >
            <Link2 className="h-5 w-5 mr-3 text-primary" />
            <div className="text-left">
              <div className="font-medium">Lier un compte existant</div>
              <div className="text-sm text-muted-foreground">Votre partenaire a déjà un compte</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddHouseholdMemberDialog;
