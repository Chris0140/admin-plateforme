import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import AccountSettings from "./pages/AccountSettings";
import AccountSecurity from "./pages/AccountSecurity";
import AccountDocuments from "./pages/AccountDocuments";
import ThirdPillar from "./pages/ThirdPillar";
import Insurance from "./pages/Insurance";
import Investissement from "./pages/Investissement";
import Prevoyance from "./pages/Prevoyance";
import AVS from "./pages/prevoyance/AVS";
import NotFound from "./pages/NotFound";
import SimulateurImpots from "./pages/SimulateurImpots";
import Comparateur from "./pages/Comparateur";
import AssuranceMaladie from "./pages/comparateur/AssuranceMaladie";
import AssuranceVehicule from "./pages/comparateur/AssuranceVehicule";
import TroisiemePilier from "./pages/comparateur/TroisiemePilier";
import AssuranceAnimaux from "./pages/comparateur/AssuranceAnimaux";
import Budget from "./pages/Budget";
import Synthese from "./pages/Synthese";
import UserProfile from "./pages/UserProfile";
import LPPAccounts from "./pages/LPPAccounts";
import Admin from "./pages/Admin";
import Service from "./pages/Service";
import { AdminRoute } from "./components/AdminRoute";

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
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/account/settings" element={<AccountSettings />} />
            <Route path="/account/security" element={<AccountSecurity />} />
            <Route path="/account/documents" element={<AccountDocuments />} />
            <Route path="/profil" element={<UserProfile />} />
            <Route path="/comparateur" element={<Comparateur />} />
            <Route path="/comparateur/assurance-maladie" element={<AssuranceMaladie />} />
            <Route path="/comparateur/assurance-vehicule" element={<AssuranceVehicule />} />
            <Route path="/comparateur/troisieme-pilier" element={<TroisiemePilier />} />
            <Route path="/comparateur/assurance-animaux" element={<AssuranceAnimaux />} />
            <Route path="/simulateur-impots" element={<SimulateurImpots />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/dashboard" element={<Synthese />} />
            <Route path="/prevoyance" element={<Prevoyance />} />
            <Route path="/prevoyance/avs" element={<AVS />} />
            <Route path="/prevoyance/lpp" element={<LPPAccounts />} />
            <Route path="/prevoyance/3e-pilier" element={<ThirdPillar />} />
            <Route path="/assurances" element={<Insurance />} />
            <Route path="/investissement" element={<Investissement />} />
            <Route path="/service" element={<Service />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
