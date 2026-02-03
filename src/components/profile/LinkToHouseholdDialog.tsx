import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface LinkToHouseholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkSuccess: () => void;
  currentProfileId: string;
}

const LinkToHouseholdDialog = ({
  open,
  onOpenChange,
  onLinkSuccess,
  currentProfileId,
}: LinkToHouseholdDialogProps) => {
  const { user } = useAuth();
  const [clientNumber, setClientNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">("idle");
  const [titulaireName, setTitulaireName] = useState<string | null>(null);

  const validateClientNumber = async (number: string) => {
    if (!number || number.length < 5) {
      setValidationState("idle");
      setTitulaireName(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, prenom, nom, client_number, linked_to_client")
        .eq("client_number", number.toUpperCase())
        .single();

      if (error || !data) {
        setValidationState("invalid");
        setTitulaireName(null);
        return;
      }

      // Check if this is not the user's own profile
      if (data.id === currentProfileId) {
        setValidationState("invalid");
        setTitulaireName(null);
        toast({
          title: "Erreur",
          description: "Vous ne pouvez pas lier votre propre numéro client",
          variant: "destructive",
        });
        return;
      }

      // Check if the target profile already has a linked partner
      const { data: linkedPartners } = await supabase
        .from("profiles")
        .select("id")
        .eq("linked_to_client", number.toUpperCase());

      if (linkedPartners && linkedPartners.length > 0) {
        setValidationState("invalid");
        setTitulaireName(null);
        toast({
          title: "Erreur",
          description: "Ce compte a déjà un partenaire lié",
          variant: "destructive",
        });
        return;
      }

      setValidationState("valid");
      setTitulaireName(`${data.prenom} ${data.nom}`);
    } catch (err) {
      setValidationState("invalid");
      setTitulaireName(null);
    }
  };

  const handleInputChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setClientNumber(formatted);
    
    // Debounced validation
    const timeoutId = setTimeout(() => {
      validateClientNumber(formatted);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const handleLink = async () => {
    if (!user || validationState !== "valid") return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          linked_to_client: clientNumber.toUpperCase(),
          household_role: "linked_partner",
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Liaison réussie",
        description: `Votre compte est maintenant lié au foyer de ${titulaireName}`,
      });

      onLinkSuccess();
      onOpenChange(false);
      setClientNumber("");
      setValidationState("idle");
      setTitulaireName(null);
    } catch (err) {
      console.error("Error linking account:", err);
      toast({
        title: "Erreur",
        description: "Impossible de lier votre compte. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setClientNumber("");
    setValidationState("idle");
    setTitulaireName(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Lier à un foyer
          </DialogTitle>
          <DialogDescription>
            Entrez le numéro client de votre conjoint pour lier vos comptes et
            partager les données du foyer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-number">Numéro client du titulaire</Label>
            <div className="relative">
              <Input
                id="client-number"
                placeholder="CLI-00000"
                value={clientNumber}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`font-mono ${
                  validationState === "valid"
                    ? "border-green-500 focus-visible:ring-green-500"
                    : validationState === "invalid"
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
              />
              {validationState === "valid" && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
              {validationState === "invalid" && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
              )}
            </div>
          </div>

          {validationState === "valid" && titulaireName && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-sm">
              <p className="text-green-800 dark:text-green-200">
                Titulaire trouvé : <strong>{titulaireName}</strong>
              </p>
              <p className="text-green-600 dark:text-green-400 mt-1">
                En liant votre compte, vous aurez accès aux données partagées du
                foyer.
              </p>
            </div>
          )}

          {validationState === "invalid" && clientNumber.length >= 5 && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Numéro client invalide ou non disponible pour liaison.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleLink}
            disabled={validationState !== "valid" || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lier mon compte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkToHouseholdDialog;
