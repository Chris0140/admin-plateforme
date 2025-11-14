import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import AccountSettings from "./pages/AccountSettings";
import AccountSecurity from "./pages/AccountSecurity";
import AccountDocuments from "./pages/AccountDocuments";
import NotFound from "./pages/NotFound";
import SimulateurImpots from "./pages/SimulateurImpots";
import Comparateur from "./pages/Comparateur";
import AssuranceMaladie from "./pages/comparateur/AssuranceMaladie";
import AssuranceVehicule from "./pages/comparateur/AssuranceVehicule";
import TroisiemePilier from "./pages/comparateur/TroisiemePilier";
import AssuranceAnimaux from "./pages/comparateur/AssuranceAnimaux";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/account/settings" element={<AccountSettings />} />
            <Route path="/account/security" element={<AccountSecurity />} />
            <Route path="/account/documents" element={<AccountDocuments />} />
            <Route path="/comparateur" element={<Comparateur />} />
            <Route path="/comparateur/assurance-maladie" element={<AssuranceMaladie />} />
            <Route path="/comparateur/assurance-vehicule" element={<AssuranceVehicule />} />
            <Route path="/comparateur/troisieme-pilier" element={<TroisiemePilier />} />
            <Route path="/comparateur/assurance-animaux" element={<AssuranceAnimaux />} />
            <Route path="/simulateur-impots" element={<SimulateurImpots />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
