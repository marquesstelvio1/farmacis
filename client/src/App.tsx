import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
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
// import DeliveryLocationPage from "@/pages/DeliveryLocationPage"; // Removed as it's now a modal
import MedicalInfo from "@/pages/MedicalInfo";
import AccountSettings from "@/pages/Settings";
import EmergencyContacts from "@/pages/EmergencyContacts";
import { EmergencyButton } from "@/components/EmergencyButton";
import { useCart } from "@/hooks/use-cart";

interface RouterProps {
  onLogout: () => void;
}

function Router({ onLogout }: RouterProps) {
  return (
    <Layout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/catalogo" component={Catalog} />
        <Route path="/farmacias" component={Pharmacies} />
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
        <Route path="/emergencia" component={EmergencyContacts} />
        <Route path="/info-medica" component={MedicalInfo} />
        <Route path="/login" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [showRegister, setShowRegister] = useState(false);
  const { clearCart } = useCart();

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    clearCart();
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
        {isAuthenticated && <EmergencyButton />}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
