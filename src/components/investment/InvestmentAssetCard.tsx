import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvestmentAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker_symbol: string | null;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string | null;
  currency: string;
  platform: string | null;
  notes: string | null;
}

interface InvestmentAssetCardProps {
  asset: InvestmentAsset;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const assetTypeLabels: Record<string, string> = {
  actions: "Actions",
  etf: "ETF",
  crypto: "Crypto",
  obligations: "Obligations",
  immobilier: "Immobilier",
  fonds: "Fonds",
  autres: "Autres",
};

const assetTypeColors: Record<string, string> = {
  actions: "bg-blue-500/10 text-blue-500",
  etf: "bg-purple-500/10 text-purple-500",
  crypto: "bg-orange-500/10 text-orange-500",
  obligations: "bg-green-500/10 text-green-500",
  immobilier: "bg-amber-500/10 text-amber-500",
  fonds: "bg-cyan-500/10 text-cyan-500",
  autres: "bg-gray-500/10 text-gray-500",
};

const InvestmentAssetCard = ({ asset, onEdit, onDelete }: InvestmentAssetCardProps) => {
  const { toast } = useToast();

  const investedValue = asset.quantity * asset.purchase_price;
  const currentValue = asset.quantity * (asset.current_price || asset.purchase_price);
  const gainLoss = currentValue - investedValue;
  const percentageChange = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("investment_assets")
        .update({ is_active: false })
        .eq("id", asset.id);

      if (error) throw error;

      toast({
        title: "Actif supprimé",
        description: "L'actif a été supprimé avec succès.",
      });
      onDelete();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'actif.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            {asset.asset_name}
            {asset.ticker_symbol && (
              <span className="text-sm font-normal text-muted-foreground">({asset.ticker_symbol})</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={assetTypeColors[asset.asset_type] || assetTypeColors.autres}>
              {assetTypeLabels[asset.asset_type] || asset.asset_type}
            </Badge>
            {asset.platform && (
              <span className="text-xs text-muted-foreground">{asset.platform}</span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass border-border">
            <DropdownMenuItem onClick={() => onEdit(asset.id)} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Quantité</p>
            <p className="font-medium text-foreground">{asset.quantity.toLocaleString("fr-CH")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Prix d'achat</p>
            <p className="font-medium text-foreground">
              {asset.purchase_price.toLocaleString("fr-CH", { minimumFractionDigits: 2 })} {asset.currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Prix actuel</p>
            <p className="font-medium text-foreground">
              {(asset.current_price || asset.purchase_price).toLocaleString("fr-CH", { minimumFractionDigits: 2 })} {asset.currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valeur totale</p>
            <p className="font-medium text-foreground">
              {currentValue.toLocaleString("fr-CH", { minimumFractionDigits: 2 })} {asset.currency}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {gainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`font-semibold ${gainLoss >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {gainLoss >= 0 ? "+" : ""}{gainLoss.toLocaleString("fr-CH", { minimumFractionDigits: 2 })} {asset.currency}
            </span>
          </div>
          <span className={`text-sm ${percentageChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {percentageChange >= 0 ? "+" : ""}{percentageChange.toFixed(2)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentAssetCard;
