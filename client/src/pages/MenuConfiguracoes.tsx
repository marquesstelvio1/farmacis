import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Package,
  Heart,
  User,
  Headphones,
  ChevronRight,
  LogOut,
  Settings,
  Clock,
  ShieldCheck,
  FileText,
  MapPin,
  Bell,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

const menuItems = [
  {
    id: "pedidos",
    label: "Meus Pedidos",
    description: "Histórico e acompanhamento",
    icon: Package,
    href: "/pedidos",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    id: "farmacia",
    label: "Minha Farmácia",
    description: "Dados da farmácia e pagamentos",
    icon: Store,
    href: "/farmacia/config",
    color: "bg-indigo-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600"
  },
  {
    id: "saude",
    label: "Configurações de Saúde",
    description: "Dados médicos e emergência",
    icon: Heart,
    href: "/info-medica",
    color: "bg-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-600"
  },
  {
    id: "perfil",
    label: "Perfil",
    description: "Dados pessoais e endereço",
    icon: User,
    href: "/configuracoes",
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-600"
  },
  {
    id: "suporte",
    label: "Suporte",
    description: "Ajuda e contacto",
    icon: Headphones,
    href: "/suporte",
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600"
  }
];

const quickActions = [
  {
    id: "enderecos",
    label: "Meus Endereços",
    icon: MapPin,
    href: "/configuracoes",
    color: "text-orange-500"
  },
  {
    id: "notificacoes",
    label: "Notificações",
    icon: Bell,
    href: "/configuracoes",
    color: "text-yellow-500"
  },
  {
    id: "seguranca",
    label: "Segurança",
    icon: ShieldCheck,
    href: "/configuracoes",
    color: "text-teal-500"
  },
  {
    id: "termos",
    label: "Termos e Condições",
    icon: FileText,
    href: "/termos",
    color: "text-slate-500"
  }
];

export default function MenuConfiguracoes() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    toast({
      title: "Sessão terminada",
      description: "Você saiu da sua conta."
    });
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user?.name ? getInitials(user.name) : "U"}
              </div>
              <div>
                <h1 className="font-bold text-slate-900">{user?.name || "Utilizador"}</h1>
                <p className="text-sm text-slate-500">{user?.email || "usuario@email.com"}</p>
              </div>
            </div>
            <Link href="/configuracoes">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-5 h-5 text-slate-600" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Menu Principal */}
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={item.href}>
                  <div className={`${item.bgColor} p-4 rounded-2xl border border-slate-100 hover:shadow-md transition-all cursor-pointer group`}>
                    <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className={`font-bold ${item.textColor} text-sm mb-1`}>{item.label}</h3>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Ações Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">Ações Rápidas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <Icon className={`w-5 h-5 ${action.color}`} />
                    <span className="flex-1 text-sm font-medium text-slate-700">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Medicamentos Ativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Medicamentos</h3>
              <p className="text-xs text-slate-500">Lembretes de medicação</p>
            </div>
            <Link href="/configuracoes" className="ml-auto">
              <Button variant="ghost" size="sm" className="text-teal-600">
                Gerir
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-600">Configure lembretes para os seus medicamentos no Modo Receita.</p>
        </motion.div>

        {/* Sair */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Terminar Sessão
          </Button>
        </motion.div>

        {/* Versão */}
        <p className="text-center text-xs text-slate-400">
          Brócolis v1.0.0
        </p>
      </div>
    </div>
  );
}
