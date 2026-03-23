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
import Identify from "@/pages/Identify";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Checkout from "@/pages/Checkout";
import PaymentMethods from "@/pages/PaymentMethods";
import UserOrders from "@/pages/UserOrders";
import PharmacyAdmin from "@/pages/PharmacyAdmin";
import DeliveryLocationPage from "@/pages/DeliveryLocationPage";
import { useCart } from "@/hooks/use-cart";

interface RouterProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

function Router({ isAuthenticated, onLogout }: RouterProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={() => <Login onLogin={() => { }} onShowRegister={() => { }} />} />
        <Route component={() => <Login onLogin={() => { }} onShowRegister={() => { }} />} />
      </Switch>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/identificar" component={Identify} />
        <Route path="/escolher-local" component={DeliveryLocationPage} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/pagamentos" component={PaymentMethods} />
        <Route path="/pedidos" component={UserOrders} />
        <Route path="/farmacia/admin" component={PharmacyAdmin} />
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
          <Router isAuthenticated={isAuthenticated} onLogout={handleLogout} />
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
