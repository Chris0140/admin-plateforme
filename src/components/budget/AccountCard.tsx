import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, PiggyBank, MoreHorizontal, Settings, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: {
    id: string;
    account_type: string;
    bank_name: string;
    revenue_type: string;
    accounting_day: number;
    is_active: boolean;
  };
  onEdit: (accountId: string) => void;
  onDelete: (accountId: string) => void;
  isDeleting?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (accountId: string, selected: boolean) => void;
  showSelection?: boolean;
}

export function AccountCard({ 
  account, 
  onEdit, 
  onDelete, 
  isDeleting,
  isSelected = false,
  onSelectionChange,
  showSelection = false,
}: AccountCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const Icon = account.account_type === "courant" ? CreditCard : PiggyBank;

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case "courant":
        return "Compte Courant";
      case "epargne":
        return "Compte Épargne";
      default:
        return "Compte";
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown or checkbox
    if ((e.target as HTMLElement).closest('[data-dropdown]') || 
        (e.target as HTMLElement).closest('[data-checkbox]')) {
      return;
    }
    navigate(`/budget/dashboard/${account.id}`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange?.(account.id, checked);
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete(account.id);
  };

  return (
    <>
      <Card
        className={cn(
          "relative group cursor-pointer transition-all duration-300",
          "hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
          "border-2",
          isSelected && "border-primary bg-primary/5"
        )}
        onClick={handleCardClick}
      >
        {/* Selection Checkbox */}
        {showSelection && (
          <div
            data-checkbox
            className="absolute top-3 left-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              className="h-5 w-5 border-2"
            />
          </div>
        )}

        {/* Dropdown Menu */}
        <div
          data-dropdown
          className="absolute top-3 right-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(account.id)}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres du compte
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {account.bank_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {getAccountTypeName(account.account_type)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {account.revenue_type === "regulier" ? "Revenus réguliers" : "Revenus variables"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Jour {account.accounting_day}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les transactions liées à ce
              compte seront effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
