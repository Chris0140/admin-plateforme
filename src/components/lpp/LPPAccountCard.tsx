import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Building2 } from "lucide-react";
import { formatCHF } from "@/lib/lppCalculations";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
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

type LPPAccount = Database['public']['Tables']['lpp_accounts']['Row'];

interface LPPAccountCardProps {
  account: LPPAccount;
  onEdit: (account: LPPAccount) => void;
  onRefresh: () => void;
}

export function LPPAccountCard({ account, onEdit, onRefresh }: LPPAccountCardProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('lpp_accounts')
        .delete()
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Compte supprimé",
        description: "Le compte LPP a été supprimé avec succès"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{account.provider_name}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(account)}
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
                  <AlertDialogTitle>Supprimer ce compte LPP ?</AlertDialogTitle>
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
        {account.plan_name && (
          <p className="text-sm text-muted-foreground">{account.plan_name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Savings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Avoir actuel</p>
            <p className="text-lg font-semibold">{formatCHF(account.current_retirement_savings || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Projeté à 65 ans</p>
            <p className="text-lg font-semibold">{formatCHF(account.projected_savings_at_65 || 0)}</p>
          </div>
        </div>

        {/* Retirement Rent */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Rente de vieillesse à 65 ans</p>
          <p className="text-xl font-bold text-green-600">
            {formatCHF((account.projected_retirement_rent_at_65 || 0) / 12)}<span className="text-sm font-normal">/mois</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCHF(account.projected_retirement_rent_at_65 || 0)} par an
          </p>
        </div>

        {/* Disability & Death */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Rente invalidité</p>
            <p className="text-sm font-semibold">
              {formatCHF((account.disability_rent_annual || 0) / 12)}<span className="text-xs">/mois</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capital décès</p>
            <p className="text-sm font-semibold">
              {formatCHF((account.death_capital || 0) + (account.additional_death_capital || 0))}
            </p>
          </div>
        </div>

        {/* Last Certificate Date */}
        {account.last_certificate_date && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Dernier certificat : {new Date(account.last_certificate_date).toLocaleDateString('fr-CH')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
