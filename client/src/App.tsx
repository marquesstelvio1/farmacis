import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/Layout";
import LandingPage from "@/pages/LandingPage";
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
import { UserProvider } from "./UserContext";
import PharmacyConfig from "@/pages/PharmacyConfig";

interface RouterProps {
  handleLogin: (userData?: any) => void;
  handleShowRegister: () => void;
  handleShowLogin: () => void;
}

function Router({ handleLogin, handleShowRegister, handleShowLogin }: RouterProps) {
  const [, setLocation] = useLocation();

  // Check for redirect to checkout flag on mount
  useEffect(() => {
    const shouldRedirect = localStorage.getItem("redirectToCheckoutAfterLogin");
    if (shouldRedirect === "true") {
      localStorage.removeItem("redirectToCheckoutAfterLogin");
      setLocation("/checkout");
    }
  }, [setLocation]);

  return ( // Mantém o Layout aqui, pois o App.tsx é o ponto de entrada principal
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
        <Route path="/menu-de-configuracoes">
          <MenuConfiguracoes />
        </Route>
        <Route path="/farmacia/config" component={PharmacyConfig} />
        <Route path="/emergencia" component={EmergencyContacts} />
        <Route path="/info-medica" component={MedicalInfo} />
        <Route path="/suporte" component={Suporte} />
        <Route path="/login">
          <Login onLogin={handleLogin} onShowRegister={handleShowRegister} />
        </Route>
        <Route path="/register">
          <Register onRegister={handleShowLogin} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [, setLocation] = useLocation();

  const handleLogin = (userData?: any) => {
    localStorage.setItem("isAuthenticated", "true");
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("user-updated"));
    }

    const shouldRedirect = localStorage.getItem("redirectToCheckoutAfterLogin");
    if (shouldRedirect === "true") {
      localStorage.removeItem("redirectToCheckoutAfterLogin");
      setLocation("/checkout");
    } else {
      setLocation("/");
    }
  };

  const handleShowRegister = () => {
    setLocation("/register");
  };

  const handleShowLogin = () => {
    setLocation("/login");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider> {/* Envolve toda a aplicação com o UserProvider */}
        <TooltipProvider>
          <Router
            handleLogin={handleLogin}
            handleShowRegister={handleShowRegister}
            handleShowLogin={handleShowLogin}
          />
          <Toaster />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;