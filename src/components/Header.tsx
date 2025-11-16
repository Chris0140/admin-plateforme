import { Settings, FileText, LogOut, ChevronDown, Heart, Car, Bike, Shield, Plane, Home, PawPrint, PiggyBank, Menu, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import adminLogo from "@/assets/admin-logo.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
const Header = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [comparateurOpen, setComparateurOpen] = useState(false);
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !"
      });
      navigate("/");
    }
  };
  return <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={adminLogo} alt="Admin Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-foreground">admin.</h1>
              <p className="text-xs text-muted-foreground">Plateforme d'administration</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/budget" className="text-foreground hover:text-primary transition-colors font-medium">
              Budget
            </Link>
            <Link to="/simulateur-impots" className="text-foreground hover:text-primary transition-colors font-medium">
              Simulateur d'impôts
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">
                Comparateur
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 bg-card/95 backdrop-blur-md border-border shadow-lg z-50 p-2">
                <DropdownMenuItem asChild>
                  <Link to="/comparateur/assurance-maladie" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10">
                      <Heart className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="font-medium">Assurance maladie</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/comparateur/assurance-vehicule" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                      <Car className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-medium">Assurance Véhicule</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10">
                      <Bike className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="font-medium">Assurance Moto</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
                      <Shield className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="font-medium">Protection juridique</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10">
                      <Plane className="h-4 w-4 text-sky-500" />
                    </div>
                    <span className="font-medium">Assurance voyage</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
                      <Home className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">Inventaire du ménage et RC privée</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/comparateur/assurance-animaux" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
                      <PawPrint className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="font-medium">Assurance animaux</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/comparateur/troisieme-pilier" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                      <PiggyBank className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="font-medium">3ème pilier</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link to="/account/documents" className="text-foreground hover:text-primary transition-colors font-medium">
              Mes documents
            </Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            {user && (
              <Link to="/profil" className="text-foreground hover:text-primary transition-colors font-medium">
                Profil utilisateur
              </Link>
            )}
          </nav>

          {/* Account Button/Menu - Desktop */}
          <div className="hidden lg:flex items-center">
            {loading ? <Button disabled className="bg-gradient-to-r from-bronze to-bronze-light">
                Chargement...
              </Button> : user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze">
                    Mon compte
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/account/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres du compte</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/documents" className="flex items-center cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Mes documents</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Link to="/auth">
                <Button className="bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze">
                  Connexion / Inscription
                </Button>
              </Link>}
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link 
                    to="/budget" 
                    className="text-foreground hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Budget
                  </Link>
                  
                  <Link 
                    to="/simulateur-impots" 
                    className="text-foreground hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Simulateur d'impôts
                  </Link>

                  {/* Comparateur Section */}
                  <Collapsible open={comparateurOpen} onOpenChange={setComparateurOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-foreground hover:text-primary transition-colors font-medium py-2">
                      <span>Comparateur</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${comparateurOpen ? 'rotate-90' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pl-4 mt-2">
                      <Link 
                        to="/comparateur/assurance-maladie" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>Assurance maladie</span>
                      </Link>
                      <Link 
                        to="/comparateur/assurance-vehicule" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Car className="h-4 w-4 text-blue-500" />
                        <span>Assurance Véhicule</span>
                      </Link>
                      <a 
                        href="#" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Bike className="h-4 w-4 text-orange-500" />
                        <span>Assurance Moto</span>
                      </a>
                      <a 
                        href="#" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Protection Juridique</span>
                      </a>
                      <a 
                        href="#" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="h-4 w-4 text-purple-500" />
                        <span>Inventaire ménage & RC</span>
                      </a>
                      <a 
                        href="#" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Plane className="h-4 w-4 text-sky-500" />
                        <span>Assurance voyage</span>
                      </a>
                      <a 
                        href="#" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <PawPrint className="h-4 w-4 text-amber-500" />
                        <span>Assurance animal</span>
                      </a>
                      <Link 
                        to="/comparateur/troisieme-pilier" 
                        className="flex items-center gap-3 py-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <PiggyBank className="h-4 w-4 text-pink-500" />
                        <span>3ème Pilier</span>
                      </Link>
                    </CollapsibleContent>
                  </Collapsible>

                  <Link 
                    to="/account/documents"
                    className="text-foreground hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mes documents
                  </Link>
                  <Link 
                    to="/contact" 
                    className="text-foreground hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                  
                  {user && (
                    <Link 
                      to="/profil" 
                      className="text-foreground hover:text-primary transition-colors font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profil utilisateur
                    </Link>
                  )}

                  {/* Auth Section */}
                  <div className="pt-4 border-t border-border mt-4">
                    {loading ? (
                      <Button disabled className="w-full bg-gradient-to-r from-bronze to-bronze-light">
                        Chargement...
                      </Button>
                    ) : user ? (
                      <div className="space-y-2">
                        <Link 
                          to="/account/settings" 
                          className="flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Paramètres du compte</span>
                        </Link>
                        <Link 
                          to="/account/documents" 
                          className="flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Mes documents</span>
                        </Link>
                        <button 
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }} 
                          className="w-full flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md transition-colors text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    ) : (
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-bronze to-bronze-light hover:from-bronze-dark hover:to-bronze">
                          Connexion / Inscription
                        </Button>
                      </Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;