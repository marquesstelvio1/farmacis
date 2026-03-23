import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    MapPin,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    CreditCard,
    Search,
    ArrowLeft,
    Store,
    Wallet
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
    id: number;
    productName: string;
    quantity: number;
    unitPrice: string;
}

interface Order {
    id: number;
    pharmacyId: number;
    customerName: string;
    total: string;
    status: "pending" | "accepted" | "rejected" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed";
    paymentMethod: string;
    customerAddress: string;
    createdAt: string;
    items?: OrderItem[];
}

const statusConfig = {
    pending: { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: Clock },
    accepted: { label: "Aceite", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700", icon: AlertCircle },
    preparing: { label: "Em Preparação", color: "bg-purple-100 text-purple-700", icon: Package },
    ready: { label: "Pronto", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
    out_for_delivery: { label: "Em Entrega", color: "bg-blue-500 text-white", icon: MapPin },
    delivered: { label: "Entregue", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    cancelled: { label: "Cancelado", color: "bg-slate-100 text-slate-700", icon: AlertCircle },
};

export default function UserOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : {};

    const fetchOrders = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/user/orders?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const handlePayment = async (orderId: number) => {
        toast({
            title: "Processando Pagamento",
            description: "Aguarde enquanto processamos seu pagamento...",
        });

        try {
            await new Promise(r => setTimeout(r, 1500));
            const res = await fetch(`/api/pharmacy/orders/${orderId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus: "paid" }),
            });
            if (res.ok) {
                toast({
                    title: "Pagamento Concluído",
                    description: "Seu pagamento foi confirmado pela farmácia.",
                });
                fetchOrders();
            }
        } catch (err) {
            toast({
                title: "Erro no Pagamento",
                description: "Não foi possível processar o pagamento.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <Link href="/">
                    <Button variant="ghost" className="mb-6 text-slate-600 hover:bg-slate-100">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar ao Início
                    </Button>
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Meus Pedidos</h1>
                        <p className="text-slate-500 mt-1">Acompanhe o estado das suas encomendas</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Package size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Total de Pedidos</p>
                            <p className="text-lg font-bold text-slate-800 leading-none">{orders.length}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <Card className="border-dashed py-20">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Nenhum pedido encontrado</h3>
                            <p className="text-slate-500 mt-2 max-w-xs">
                                Você ainda não realizou nenhum pedido em nossa plataforma.
                            </p>
                            <Link href="/">
                                <Button className="mt-8 bg-blue-600 px-8 py-6 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/20">
                                    Explorar Produtos
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {orders.map((order) => {
                                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                                const StatusIcon = config.icon;
                                const isCash = order.paymentMethod === "cash";
                                const canPay = !isCash && (order.status === "accepted" || order.status === "ready") && order.paymentStatus === "pending";

                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        layout
                                    >
                                        <Card className="overflow-hidden border-slate-200 hover:shadow-xl transition-all duration-300 group">
                                            <div className="bg-white p-6">
                                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                            <Store size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">Pedido #{order.id}</h3>
                                                            <p className="text-sm text-slate-500">
                                                                {new Date(order.createdAt).toLocaleDateString('pt-AO', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${config.color}`}>
                                                            <StatusIcon size={14} />
                                                            {config.label}
                                                        </Badge>

                                                        <Badge className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${order.paymentStatus === "paid"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-slate-100 text-slate-500"
                                                            }`}>
                                                            {order.paymentStatus === "paid" ? "Pago" : "Pagamento Pendente"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Endereço de Entrega</p>
                                                                <p className="text-slate-700 mt-1">{order.customerAddress}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3">
                                                            <Wallet className="w-5 h-5 text-slate-400 mt-0.5" />
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Método de Pagamento</p>
                                                                <p className="text-slate-700 mt-1 capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Total do Pedido</span>
                                                            <span className="text-2xl font-black text-blue-600">
                                                                {Number(order.total).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                                            </span>
                                                        </div>

                                                        {canPay ? (
                                                            <Button
                                                                onClick={() => handlePayment(order.id)}
                                                                className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                                            >
                                                                <CreditCard size={20} />
                                                                Pagar Agora
                                                            </Button>
                                                        ) : order.paymentStatus === "paid" ? (
                                                            <div className="w-full bg-green-50 text-green-700 py-3 rounded-xl border border-green-200 text-center font-bold flex items-center justify-center gap-2">
                                                                <CheckCircle2 size={18} />
                                                                Pedido Pago
                                                            </div>
                                                        ) : isCash ? (
                                                            <div className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl border border-blue-200 text-center text-sm font-bold flex items-center justify-center gap-2">
                                                                <Wallet size={18} />
                                                                Pagamento em Dinheiro na Entrega
                                                            </div>
                                                        ) : order.status === "pending" ? (
                                                            <div className="w-full bg-amber-50 text-amber-700 py-3 rounded-xl border border-amber-200 text-center text-sm font-medium px-4">
                                                                Aguardando confirmação da farmácia para habilitar o pagamento
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {order.items && order.items.length > 0 && (
                                                    <div className="mt-6 border-t border-slate-50 pt-4">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Itens do Pedido</p>
                                                        <div className="space-y-2">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between text-sm">
                                                                    <span className="text-slate-600">{item.quantity}x {item.productName}</span>
                                                                    <span className="font-medium text-slate-900">
                                                                        {Number(item.unitPrice).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
