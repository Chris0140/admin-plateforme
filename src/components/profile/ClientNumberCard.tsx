import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Users, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClientNumberCardProps {
  clientNumber: string | null;
  householdRole: string | null;
  linkedToClient: string | null;
  linkedPartnerName?: string | null;
}

const ClientNumberCard = ({
  clientNumber,
  householdRole,
  linkedToClient,
  linkedPartnerName,
}: ClientNumberCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!clientNumber) return;
    
    try {
      await navigator.clipboard.writeText(clientNumber);
      setCopied(true);
      toast({
        title: "Numéro copié",
        description: "Le numéro client a été copié dans le presse-papier",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le numéro",
        variant: "destructive",
      });
    }
  };

  const isLinkedPartner = householdRole === "linked_partner" && linkedToClient;
  const isTitulaire = householdRole === "titulaire" || !householdRole;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Numéro client
          </CardTitle>
          {isTitulaire && (
            <Badge variant="default">Titulaire</Badge>
          )}
          {isLinkedPartner && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Compte lié
            </Badge>
          )}
        </div>
        <CardDescription>
          {isTitulaire
            ? "Partagez ce numéro avec votre conjoint pour lier vos comptes"
            : `Votre compte est lié au foyer ${linkedToClient}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-md px-4 py-3 font-mono text-lg tracking-wider">
            {clientNumber || "—"}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            disabled={!clientNumber}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isLinkedPartner && linkedPartnerName && (
          <p className="text-sm text-muted-foreground mt-3">
            Titulaire du foyer : <span className="font-medium">{linkedPartnerName}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientNumberCard;
