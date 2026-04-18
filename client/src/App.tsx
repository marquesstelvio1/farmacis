import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/Layout";
import LandingPage from "@/pages/LandingPage";
import Home from "@/pages/Home";
import ExploreMap from "@/pages/ExploreMap";
import Catalog from "@/pages/Catalog";
import Pharmacies from "@/pages/Pharmacies";
import Identify from "@/pages/Identify";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Checkout from "@/pages/Checkout";
import UserOrders from "@/pages/UserOrders";
import Clinics from "@/pages/Clinics";
import Professionals from "@/pages/Professionals";
import AdminProfessionals from "@/pages/AdminProfessionals";
import ProfessionalDashboard from "@/pages/ProfessionalDashboard";
import ProfessionalLogin from "@/pages/ProfessionalLogin";
import Insurance from "@/pages/Insurance";
import ProductDetail from "@/pages/ProductDetail";
// import DeliveryLocationPage from "@/pages/DeliveryLocationPage"; // Removed as it's now a modal
import MedicalInfo from "@/pages/MedicalInfo";
import AccountSettings from "@/pages/Settings";
import EmergencyContacts from "@/pages/EmergencyContacts";
import MenuConfiguracoes from "@/pages/MenuConfiguracoes";
import Suporte from "@/pages/Suporte";
import { PharmacyComments } from "@/pages/PharmacyComments";

interface RouterProps {
  onLogout: () => void;
}

function Router({ onLogout: _onLogout }: RouterProps) {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/explorar" component={ExploreMap} />
        <Route path="/catalogo" component={Catalog} />
        <Route path="/produto/:id" component={ProductDetail} />
        <Route path="/farmacias" component={Pharmacies} />
        <Route path="/farmacia/:pharmacyId/comentarios" component={PharmacyComments} />
        <Route path="/clinicas" component={Clinics} />
        <Route path="/profissionais" component={Professionals} />
        <Route path="/seguradoras" component={Insurance} />
        <Route path="/admin/profissionais" component={AdminProfessionals} />
        <Route path="/profissional/dashboard">
          <ProfessionalDashboard />
        </Route>
        <Route path="/profissional/login" component={ProfessionalLogin} />
        <Route path="/identificar" component={Identify} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/pedidos" component={UserOrders} />
        <Route path="/configuracoes" component={AccountSettings} />
        <Route path="/menu-de-configuracoes" component={MenuConfiguracoes} />
        <Route path="/emergencia" component={EmergencyContacts} />
        <Route path="/info-medica" component={MedicalInfo} />
        <Route path="/suporte" component={Suporte} />
        <Route path="/login" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("isAuthenticated") : null;
    return saved === "true";
  });
  const [showRegister, setShowRegister] = useState(false);
  // Mova chamadas de hooks que dependem de contexto para dentro dos componentes filhos (como Router)
  // ou garanta que o Provider esteja no main.tsx

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleShowLogin = () => {
    setShowRegister(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isAuthenticated ? (
          <Router
            onLogout={handleLogout}
          />
        ) : showRegister ? (
          <Register onRegister={handleShowLogin} />
        ) : (
          <Login onLogin={handleLogin} onShowRegister={handleShowRegister} />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
