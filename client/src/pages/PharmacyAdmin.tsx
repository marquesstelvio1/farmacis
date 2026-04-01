import { useState, useEffect, ReactNode } from "react";
import { io } from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Package,
  CheckCircle,
  XCircle,
  Calendar,
  ShoppingBag,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Truck,
  RotateCcw,
  MapPin,
  FileText,
  Navigation as NavigationIcon,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// ---------- Login Screen ----------
function PharmacyLoginScreen({ onLogin }: { onLogin: (admin: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacy/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao fazer login");
      localStorage.setItem("pharmacyAdmin", JSON.stringify({ ...data.user, token: data.token }));
      onLogin({ ...data.user, token: data.token });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl">💊</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Painel da Farmácia</h1>
          <p className="text-slate-500 text-sm mt-1">Faça login para continuar</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@farmacia.com" required />
          </div>
          <div>
            <Label htmlFor="admin-password">Senha</Label>
            <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">
          Contas de teste: admin.luanda@farmacia.com / farm123
        </p>
      </div>
    </div>
  );
}
// ---------- UI Imports moved to top ----------

interface Order {
  customerLng: any;
  customerLat: any;
  customerAddress: string;
  customerPhone?: string;
  id: number;
  pharmacyId: number;
  paymentProof?: string;
  customerName: string;
  total: string;
  status: "pending" | "accepted" | "rejected" | "paid" | "processing" | "shipped" | "delivered" | "ready" | "proof_submitted";
  paymentMethod: string;
  bookingType: string;
  scheduledTime?: string;
  items?: any[];
  createdAt: string;
  history?: OrderHistory[];
}

interface OrderHistory {
  id: number;
  orderId: number;
  status: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  totalRevenue: number;
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  accepted: { label: "Aceito", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  proof_submitted: { label: "Comprovativo Recebido", color: "bg-indigo-100 text-indigo-700", icon: FileText },
  rejected: { label: "Recusado", color: "bg-red-100 text-red-700", icon: XCircle },
  paid: { label: "Pago", color: "bg-green-100 text-green-700", icon: DollarSign },
  processing: { label: "Em Processamento", color: "bg-purple-100 text-purple-700", icon: Package },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  ready: { label: "Pronto para Levantamento", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle },
  delivered: { label: "Entregue", color: "bg-teal-100 text-teal-700", icon: CheckCircle },
};

export default function PharmacyAdmin() {
  const { toast } = useToast();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Load admin session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("pharmacyAdmin");
    if (stored) {
      try { setAdminSession(JSON.parse(stored)); } catch { }
    } else {
      setIsLoading(false);
    }
  }, []);

  const pharmacyId = adminSession?.pharmacyId;
  console.log('Admin session:', adminSession);
  console.log('Pharmacy ID:', pharmacyId);

  // If not logged in, show login screen
  if (!adminSession) {
    return <PharmacyLoginScreen onLogin={(admin) => { setAdminSession(admin); setIsLoading(true); }} />;
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/pharmacy/orders?pharmacyId=${pharmacyId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Orders data received:', data);
        setOrders(data);
      } else {
        console.error('Failed to fetch orders:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/pharmacy/dashboard-stats?pharmacyId=${pharmacyId}`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.todayOrders,
          pending: data.pendingOrders,
          accepted: 0,
          rejected: 0,
          paid: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          totalRevenue: parseFloat(data.todayRevenue),
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let socket: any;

    // Don't connect until we have a valid pharmacyId
    if (!pharmacyId) return;

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrders(), fetchStats()]);
      setIsLoading(false);
    };

    // Initial load
    loadData();

    // Set up Socket.IO connection for real-time notifications
    try {
      socket = io({
        path: '/socket.io',
      });

      socket.on('connect', () => {
        console.log("Socket connected, joining pharmacy room:", pharmacyId);
        socket.emit('join-pharmacy', pharmacyId);
      });

      socket.on('new-order', (orderData: any) => {
        console.log("New order received via socket:", orderData);
        toast({
          title: "🚨 Novo Pedido Recebido!",
          description: `Pedido #${orderData.id} de ${orderData.customerName} - Total: ${orderData.total} AOA`,
          className: "bg-blue-600 text-white border-none",
        });

        // Play notification sound
        try {
          const context = new AudioContext();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, context.currentTime); // A5
          gain.gain.setValueAtTime(0, context.currentTime);
          gain.gain.linearRampToValueAtTime(1, context.currentTime + 0.1);
          gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);

          osc.start(context.currentTime);
          osc.stop(context.currentTime + 0.5);
        } catch (e) { console.error("Could not play sound"); }

        // Refresh data automatically
        fetchOrders();
        fetchStats();
      });

    } catch (err) {
      console.error("Socket error", err);
    }

    // Backup polling every 10 seconds
    interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 10000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.emit('leave-pharmacy', pharmacyId);
        socket.disconnect();
      }
    };
  }, [pharmacyId]);

  const handleAcceptOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/pharmacy/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (response.ok) {
        toast({
          title: "Pedido Aceito",
          description: "O cliente será notificado para realizar o pagamento.",
        });
        await fetchOrders();
        await fetchStats();
        setIsDetailsOpen(false);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o pedido.",
        variant: "destructive",
      });
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !rejectReason) return;

    try {
      const response = await fetch(`/api/pharmacy/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (response.ok) {
        toast({
          title: "Pedido Recusado",
          description: "O cliente será notificado sobre a recusa.",
        });
        await fetchOrders();
        await fetchStats();
        setIsRejectDialogOpen(false);
        setIsDetailsOpen(false);
        setRejectReason("");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível recusar o pedido.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/pharmacy/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: "Status Atualizado",
          description: `Pedido marcado como ${statusConfig[status as keyof typeof statusConfig]?.label || status}.`,
        });
        await fetchOrders();
        await fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesTab = activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-AO");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <Store className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">Painel da Farmácia</h1>
              <p className="text-xs text-slate-500">{adminSession?.pharmacyName || "Gerenciamento de Pedidos"} • ID {pharmacyId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { fetchOrders(); fetchStats(); }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => {
              localStorage.removeItem("pharmacyAdmin");
              setAdminSession(null);
            }}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Pedidos</p>
                    <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalRevenue.toString())}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Entregues</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.delivered}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-teal-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Section */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Pedidos</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="accepted">Aceitos</TabsTrigger>
                <TabsTrigger value="proof_submitted">Comprovativos</TabsTrigger>
                <TabsTrigger value="paid">Pagos</TabsTrigger>
                <TabsTrigger value="processing">Processando</TabsTrigger>
                <TabsTrigger value="shipped">Enviados</TabsTrigger>
                <TabsTrigger value="ready">Prontos</TabsTrigger>
                <TabsTrigger value="delivered">Entregues</TabsTrigger>
                <TabsTrigger value="rejected">Recusados</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum pedido encontrado</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => {
                      const status = statusConfig[order.status];
                      const Icon = status?.icon || Package;
                      console.log('Processing order:', order);
                      const items = Array.isArray(order.items) ? order.items : [];
                      console.log('Order items:', items);

                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border dark:border-slate-800 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status?.color || 'bg-gray-100'}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold dark:text-slate-100">Pedido #{order.id}</span>
                                  <Badge className={status?.color}>{status?.label}</Badge>
                                </div>
                                <p className="text-sm text-slate-500">{order.customerName}</p>
                                <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg dark:text-white">{formatCurrency(order.total)}</p>
                              <p className="text-sm text-slate-500">{items.length} item(s)</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (() => {
            const isDigital = ["multicaixa_express", "transferencia"].includes(selectedOrder.paymentMethod);
            const isLocked = isDigital && (selectedOrder.status !== "pending" && selectedOrder.status !== "rejected");
            
            return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Telefone</p>
                  <p className="font-medium">{selectedOrder.customerPhone || 'N/A'}</p>
                </div>
              </div>

              {selectedOrder.scheduledTime && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
                  <Calendar className="text-blue-600 w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase">AGENDAMENTO</p>
                    <p className="text-sm font-semibold text-blue-900">{formatDate(selectedOrder.scheduledTime)}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-500 flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Endereço de Entrega
                </p>
                <p className="text-sm font-medium">{selectedOrder.customerAddress}</p>

                {selectedOrder.customerLat && selectedOrder.customerLng && (
                  <Button
                    variant="ghost"
                    className="h-auto p-0 mt-2 text-xs text-blue-600 flex items-center gap-1"
                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedOrder.customerLat},${selectedOrder.customerLng}`, '_blank')}
                  >
                    <NavigationIcon className="w-3 h-3" />
                    Ver localização exata no Google Maps
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Badge className={statusConfig[selectedOrder.status]?.color}>
                  {statusConfig[selectedOrder.status]?.label}
                </Badge>
                <AnimatePresence>
                  {isLocked && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Badge className="bg-blue-600 text-white border-none flex items-center gap-1 shadow-sm">
                        🔒 Transação Garantida - MCX
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                  {selectedOrder.bookingType === 'pickup' ? 'Levantamento (Reserva)' : 'Entrega Domicílio'}
                </Badge>
                {selectedOrder.bookingType === 'pickup' && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-mono">
                    REF: REC-{selectedOrder.id}-{new Date(selectedOrder.createdAt).getFullYear()}
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {selectedOrder.paymentMethod.replace('_', ' ')}
                </Badge>
              </div>

              {/* Itens do Pedido */}
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">Itens do Pedido</p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-700">{item.productName || item.name} x{item.quantity}</span>
                        <span className="font-medium">{formatCurrency((parseFloat(item.unitPrice || item.price || "0") * item.quantity).toString())}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum item encontrado</p>
                      <p className="text-xs">Debug: {JSON.stringify(selectedOrder.items)}</p>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedOrder.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceitar Pedido
                  </Button>
                  <AnimatePresence>
                    {!isLocked && (
                      <motion.div exit={{ opacity: 0, x: 20 }} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => setIsRejectDialogOpen(true)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {selectedOrder.status === "proof_submitted" && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <FileText size={16} />
                    Comprovativo por Analisar
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    O cliente enviou o comprovativo bancário. Verifique o documento antes de confirmar.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                      onClick={() => selectedOrder.paymentProof && window.open(selectedOrder.paymentProof, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Ficheiro
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleUpdateStatus(selectedOrder.id, "paid")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Pago
                    </Button>
                  </div>
                </div>
              )}

              {selectedOrder.status === "accepted" && (
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-blue-700">
                    Aguardando pagamento do cliente...
                  </p>
                </div>
              )}

              {selectedOrder.status === "paid" && (
                <Button
                  className="w-full"
                  onClick={() => handleUpdateStatus(selectedOrder.id, "processing")}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Iniciar Processamento
                </Button>
              )}

              {selectedOrder.status === "processing" && (
                selectedOrder.bookingType === 'pickup' ? (
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "ready")}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Pronto
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "shipped")}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Marcar como Enviado
                  </Button>
                )
              )}

              {(selectedOrder.status === "shipped" || selectedOrder.status === "ready") && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdateStatus(selectedOrder.id, "delivered")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {selectedOrder.bookingType === 'pickup' ? 'Marcar como Entregue ao Cliente' : 'Marcar como Entregue'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Pedido</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. O cliente será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da recusa (ex: produto indisponível, endereço inválido...)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectOrder}
              disabled={!rejectReason.trim()}
            >
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
