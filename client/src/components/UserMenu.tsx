import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { User, LogOut, Settings, Package, Heart, Phone, AlertCircle } from "lucide-react";
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
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100">
            <Avatar className="h-10 w-10 border-2 border-blue-200">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-400 text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || "Usuário"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "usuario@email.com"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/configuracoes" className="cursor-pointer flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/pedidos" className="cursor-pointer flex items-center">
              <Package className="mr-2 h-4 w-4" />
              <span>Meus Pedidos</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Informações Médicas
          </DropdownMenuLabel>

          <DropdownMenuItem asChild>
            <Link href="/info-medica" className="cursor-pointer flex items-center">
              <Heart className="mr-2 h-4 w-4 text-red-500" />
              <span>Dados Médicos</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/info-medica" className="cursor-pointer flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
              <span>Emergência</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
