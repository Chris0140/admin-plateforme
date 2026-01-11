import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  Shield, 
  PiggyBank, 
  Calculator, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft,
  Scale,
  User,
  TrendingUp,
  Menu,
  LineChart,
  Briefcase,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import adminLogo from "@/assets/admin-logo.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Synthèse", href: "/dashboard" },
  { icon: Wallet, label: "Budget", href: "/budget" },
  { icon: TrendingUp, label: "Prévoyance", href: "/prevoyance" },
  { icon: Shield, label: "Assurances", href: "/assurances" },
  { icon: Scale, label: "Comparateur", href: "/comparateur" },
  { icon: Building2, label: "Immobilier", href: "/immobilier" },
  { icon: LineChart, label: "Investissement", href: "/investissement" },
  { icon: Calculator, label: "Impôts", href: "/simulateur-impots" },
  { icon: Briefcase, label: "Service", href: "/service" },
];

const bottomNavItems: NavItem[] = [
  { icon: FileText, label: "Documents", href: "/account/documents" },
  { icon: User, label: "Profil", href: "/profil" },
  { icon: Settings, label: "Paramètres", href: "/account/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/");
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" && location.pathname === "/") return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col glass-strong border-r border-border/50 transition-all duration-300",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={adminLogo} alt="Admin Logo" className="h-8 w-8 object-contain" />
          {!collapsed && (
            <span className="text-lg font-bold text-foreground">
              admin<span className="text-primary">.</span>
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors",
                isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {!collapsed && item.badge && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom navigation */}
      <div className="py-4 px-3 border-t border-border/50 space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              isActive(item.href)
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors",
                isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}

        {/* Logout button */}
        {user && (
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 transition-colors text-muted-foreground group-hover:text-destructive" />
            {!collapsed && <span className="truncate">Déconnexion</span>}
          </button>
        )}
      </div>

      {/* User info */}
      {user && !collapsed && (
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default AppSidebar;
