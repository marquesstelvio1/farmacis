import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { User, LogOut, Settings, CreditCard, UserCircle, Wallet, Plus, Package, Store } from "lucide-react";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
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

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const WARNING_BEFORE_LOGOUT = 30 * 1000; // 30 seconds warning

export function UserMenu({ onLogout }: UserMenuProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user data from localStorage
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

  // Handle logout
  const handleLogout = useCallback(() => {
    // Clear timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Clear localStorage
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");

    // Call parent logout handler
    onLogout();

    // Redirect to login
    setLocation("/login");
  }, [onLogout, setLocation]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Hide warning if showing
    setShowLogoutWarning(false);

    // Set warning timer (5 minutes - 30 seconds)
    warningTimerRef.current = setTimeout(() => {
      setShowLogoutWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

    // Set logout timer (5 minutes)
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  // Setup activity listeners
  useEffect(() => {
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Angolan payment methods
  const paymentMethods = [
    { name: "Multicaixa", type: "card" },
    { name: "M-Pesa", type: "mobile" },
    { name: "Unitel Money", type: "mobile" },
    { name: "Transferência Bancária", type: "bank" },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100"
          >
            <Avatar className="h-10 w-10 border-2 border-blue-200">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-400 text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || "Usuário"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "usuario@email.com"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Account Info */}
          <DropdownMenuItem asChild>
            <Link href="/conta" className="cursor-pointer flex items-center">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Minha Conta</span>
            </Link>
          </DropdownMenuItem>

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

          <DropdownMenuItem asChild>
            <Link href="/pagamentos" className="cursor-pointer flex items-center">
              <Wallet className="mr-2 h-4 w-4" />
              <span>Meus Pagamentos</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Quick Payment Methods */}
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            Métodos Angolanos
          </DropdownMenuLabel>
          {paymentMethods.slice(0, 3).map((method) => (
            <DropdownMenuItem key={method.name} className="cursor-pointer" asChild>
              <Link href="/pagamentos">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>{method.name}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem className="cursor-pointer text-blue-600" asChild>
            <Link href="/pagamentos">
              <Plus className="mr-2 h-4 w-4" />
              <span>Gerenciar métodos...</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Management Portals */}
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            Painéis de Gestão
          </DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer">
              <Settings className="mr-2 h-4 w-4 text-blue-600" />
              <span>Administração Central</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="http://localhost:5174" target="_blank" rel="noopener noreferrer">
              <Store className="mr-2 h-4 w-4 text-green-600" />
              <span>Gestão da Farmácia</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/farmacia/admin">
              <Package className="mr-2 h-4 w-4 text-purple-600" />
              <span>Pedidos da Farmácia (Alt)</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Inactivity Warning Dialog */}
      <AlertDialog open={showLogoutWarning} onOpenChange={setShowLogoutWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessão prestes a expirar</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado em 30 segundos devido à inatividade.
              Clique em "Continuar" para manter sua sessão ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetInactivityTimer}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
