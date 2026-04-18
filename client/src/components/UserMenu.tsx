import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Settings, Package, Heart, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: number;
  name: string;
  email: string;
}

interface UserMenuProps {
  onLogout: () => void;
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_BEFORE_LOGOUT = 30 * 1000; // 30 seconds

export function UserMenu({ onLogout }: UserMenuProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    onLogout();
    setLocation("/login");
  }, [onLogout, setLocation]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowLogoutWarning(false);
    warningTimerRef.current = setTimeout(() => setShowLogoutWarning(true), INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);
    inactivityTimerRef.current = setTimeout(() => handleLogout(), INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    const handleActivity = () => resetInactivityTimer();
    activityEvents.forEach((event) => document.addEventListener(event, handleActivity));
    resetInactivityTimer();
    return () => {
      activityEvents.forEach((event) => document.removeEventListener(event, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [resetInactivityTimer]);

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const goToSettings = () => {
    setLocation("/configuracoes");
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={goToSettings}
        className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100"
        title="Configurações"
      >
        <Avatar className="h-10 w-10 border-2 border-green-200">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-400 text-white font-semibold">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
      </Button>

      <AlertDialog open={showLogoutWarning} onOpenChange={setShowLogoutWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessão prestes a expirar</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado em 30 segundos devido à inatividade.
              Clique em "Continuar" para manter sua sessão ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <AlertDialogAction onClick={resetInactivityTimer}>Continuar</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
