import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    MapPin,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ShoppingBag,
    QrCode,
    FileText,
    CreditCard,
    Search,
    ArrowLeft,
    Store,
    Wallet,
    Truck,
    Star
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    deliveryFee?: string;
    status: "pending" | "accepted" | "awaiting_proof" | "proof_submitted" | "rejected" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled" | "paid";
    paymentStatus: "pending" | "paid" | "failed";
    paymentMethod: string;
    bookingType: "delivery" | "pickup";
    scheduledTime?: string;
    customerAddress: string;
    createdAt: string;
    pharmacyIban?: string;
    pharmacyMulticaixaExpress?: string;
    items?: OrderItem[];
    reviewRating?: number | null;
    reviewComment?: string | null;
    reviewedAt?: string | null;
}

interface ReviewDraft {
    rating: number;
    comment: string;
    submitting: boolean;
}

const statusConfig = {
    pending: { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: Clock },
    accepted: { label: "Aceite", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    awaiting_proof: { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-700", icon: CreditCard },
    proof_submitted: { label: "Comprovativo Enviado", color: "bg-indigo-100 text-indigo-700", icon: FileText },
    rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700", icon: AlertCircle },
    preparing: { label: "Em Preparação", color: "bg-purple-100 text-purple-700", icon: Package },
    ready: { label: "Pronto", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
    out_for_delivery: { label: "Em Entrega", color: "bg-green-500 text-white", icon: MapPin },
    delivered: { label: "Entregue", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    cancelled: { label: "Cancelado", color: "bg-slate-100 text-slate-700", icon: AlertCircle },
};

export default function UserOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProofModal, setShowProofModal] = useState(false);
    const [selectedOrderForProof, setSelectedOrderForProof] = useState<Order | null>(null);
    const [showPickupQR, setShowPickupQR] = useState<number | null>(null);
    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewDraft>>({});
    // Payment details from client
    const [_clientPaymentDetails, setClientPaymentDetails] = useState({
        iban: "",
        multicaixaExpress: "",
        accountName: ""
    });
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
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Se for pagamento eletrônico mas não houver dados bancários da farmácia
        if (order.paymentMethod !== 'cash' && !order.pharmacyIban && !order.pharmacyMulticaixaExpress) {
            toast({
                title: "Dados Indisponíveis",
                description: "A farmácia ainda não forneceu os dados para transferência. Tente novamente em instantes.",
                variant: "destructive"
            });
            return;
        }

        // Abrir modal de upload para pagamentos eletrônicos
        if (order.paymentMethod !== 'cash' && (order.pharmacyIban || order.pharmacyMulticaixaExpress)) {
            setSelectedOrderForProof(order);
            setShowProofModal(true);
            return;
        }

        // For cash or other cases, mark as paid directly
        try {
            toast({
                title: "Processando Pagamento",
                description: "Aguarde...",
            });
            const res = await fetch(`/api/pharmacy/orders/${orderId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus: "paid" }),
            });
            if (res.ok) {
                toast({
                    title: "Pagamento Concluído",
                    description: "Seu pagamento foi registrado.",
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

    const handleConfirmPaymentWithProof = async () => {
        if (!selectedOrderForProof || !paymentProof) {
            toast({
                title: "Comprovativo Necessário",
                description: "Por favor, carregue o comprovativo de pagamento.",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await fetch(`/api/user/orders/${selectedOrderForProof.id}/payment-proof`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    paymentProof: paymentProof,
                    status: "proof_submitted",
                    paymentStatus: "paid",
                }),
            });
            if (res.ok) {
                toast({
                    title: "Comprovativo Enviado",
                    description: "O seu pagamento foi registado e está em análise.",
                });
                setShowProofModal(false);
                setSelectedOrderForProof(null);
                setPaymentProof(null);
                setProofFile(null);
                fetchOrders();
            }
        } catch (err) {
            toast({
                title: "Erro",
                description: "Não foi possível enviar o comprovativo.",
                variant: "destructive",
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Ficheiro Muito Grande",
                description: "O comprovativo deve ter no máximo 5MB.",
                variant: "destructive",
            });
            return;
        }

        setProofFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPaymentProof(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const setReviewRating = (orderId: number, rating: number) => {
        setReviewDrafts((prev) => ({
            ...prev,
            [orderId]: {
                rating,
                comment: prev[orderId]?.comment || "",
                submitting: prev[orderId]?.submitting || false,
            },
        }));
    };

    const setReviewComment = (orderId: number, comment: string) => {
        setReviewDrafts((prev) => ({
            ...prev,
            [orderId]: {
                rating: prev[orderId]?.rating ?? 0,
                comment,
                submitting: prev[orderId]?.submitting || false,
            },
        }));
    };

    const submitReview = async (orderId: number) => {
        const draft = reviewDrafts[orderId];
        if (!draft) return;
        if (draft.rating < 0 || draft.rating > 5) {
            toast({
                title: "Avaliação inválida",
                description: "Selecione uma avaliação de 0 a 5 estrelas.",
                variant: "destructive",
            });
            return;
        }

        setReviewDrafts((prev) => ({
            ...prev,
            [orderId]: { ...prev[orderId], submitting: true },
        }));

        try {
            const res = await fetch(`/api/user/orders/${orderId}/review`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.id,
                    rating: draft.rating,
                    comment: draft.comment,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Falha ao enviar avaliação");
            }

            toast({
                title: "Avaliação enviada",
                description: "Obrigado pelo seu feedback.",
            });
            await fetchOrders();
        } catch (err: any) {
            toast({
                title: "Erro",
                description: err?.message || "Não foi possível enviar a avaliação.",
                variant: "destructive",
            });
        } finally {
            setReviewDrafts((prev) => ({
                ...prev,
                [orderId]: { ...prev[orderId], submitting: false },
            }));
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
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <Package size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total de Pedidos</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-none">{orders.length}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <Card className="border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-20">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Nenhum pedido encontrado</h3>
                            <p className="text-slate-500 mt-2 max-w-xs">
                                Você ainda não realizou nenhum pedido em nossa plataforma.
                            </p>
                            <Link href="/">
                                <Button className="mt-8 bg-green-600 px-8 py-6 rounded-xl text-lg font-semibold shadow-lg shadow-green-500/20">
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
                                
                                // O botão de pagar aparece se não for dinheiro, o pagamento estiver pendente 
                                // e a farmácia já tiver aceitado ou solicitado o comprovativo.
                                const canPay = !isCash && (order.status === "accepted" || order.status === "awaiting_proof") && order.paymentStatus === "pending";

                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        layout
                                    >
                                        <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl dark:hover:shadow-slate-900/50 transition-all duration-300 group">
                                                <div className="bg-white p-6">
                                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
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
                                                            ? ""
                                                            : ""
                                                            }`}
                                                            style={order.paymentStatus === "paid"
                                                                ? { backgroundColor: "rgba(181, 241, 118, 0.35)", color: "#072a1c" }
                                                                : { backgroundColor: "#f7faf5", color: "#607369", border: "1px solid #dce4d7" }
                                                            }>
                                                            {order.paymentStatus === "paid" ? "Pago" : "Pagamento Pendente"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-5 h-5 mt-0.5 ${order.bookingType === 'pickup' ? 'text-purple-500' : 'text-green-500'}`}>
                                                                {order.bookingType === 'pickup' ? <ShoppingBag size={20} /> : <Truck size={20} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Serviço</p>
                                                                <p className="text-slate-700 mt-1 font-semibold">
                                                                    {order.bookingType === 'pickup' ? 'Levantamento na Loja' : 'Entrega ao Domicílio'}
                                                                </p>
                                                                {order.scheduledTime && (
                                                                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs font-medium">
                                                                        <Calendar size={12} />
                                                                        Agendado: {new Date(order.scheduledTime).toLocaleString('pt-AO')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {order.bookingType === 'pickup' && order.paymentStatus === 'paid' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setShowPickupQR(order.id)}
                                                                className="w-full mt-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2"
                                                            >
                                                                <QrCode size={16} />
                                                                Mostrar Código de Levantamento
                                                            </Button>
                                                        )}

                                                        {order.bookingType !== 'pickup' && (
                                                            <div className="flex items-start gap-3">
                                                                <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Endereço de Entrega</p>
                                                                    <p className="text-slate-700 dark:text-slate-300 mt-1">{order.customerAddress}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-start gap-3">
                                                            <Wallet className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Método de Pagamento</p>
                                                                <p className="text-slate-700 dark:text-slate-300 mt-1 capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                                                            </div>
                                                        </div>

                                                        {order.paymentMethod !== 'cash' && order.status === 'accepted' && (order.pharmacyIban || order.pharmacyMulticaixaExpress) && (
                                                            <div className="border rounded-xl p-4 mt-2" style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7" }}>
                                                                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#607369" }}>Dados para Pagamento</p>
                                                                {order.pharmacyIban && (
                                                                    <div className="mb-2">
                                                                        <p className="text-xs" style={{ color: "#607369" }}>IBAN</p>
                                                                        <p className="text-sm font-mono font-semibold" style={{ color: "#072a1c" }}>{order.pharmacyIban}</p>
                                                                    </div>
                                                                )}
                                                                {order.pharmacyMulticaixaExpress && (
                                                                    <div>
                                                                        <p className="text-xs" style={{ color: "#607369" }}>Multicaixa Express</p>
                                                                        <p className="text-sm font-mono font-semibold" style={{ color: "#072a1c" }}>{order.pharmacyMulticaixaExpress}</p>
                                                                    </div>
                                                                )}
                                                                <p className="text-xs mt-3" style={{ color: "#607369" }}>
                                                                    Utilize os dados acima para fazer o pagamento. Após confirmar o pagamento, clique em "Confirmar Pagamento".
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="rounded-2xl p-5 border" style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7" }}>
                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#607369" }}>Subtotal</span>
                                                                <span className="text-sm font-bold" style={{ color: "#072a1c" }}>
                                                                    {Number(Number(order.total) - (order.deliveryFee ? Number(order.deliveryFee) : 0)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                                                </span>
                                                            </div>
                                                            {order.deliveryFee && Number(order.deliveryFee) > 0 && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#607369" }}>Entrega</span>
                                                                    <span className="text-sm font-bold" style={{ color: "#072a1c" }}>
                                                                        {Number(order.deliveryFee).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: "#dce4d7" }}>
                                                                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "#072a1c" }}>Total</span>
                                                                <span className="text-2xl font-black" style={{ color: "#8bc14a" }}>
                                                                    {Number(order.total).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {canPay ? (
                                                            <Button
                                                                onClick={() => handlePayment(order.id)}
                                                                className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                                            >
                                                                <CreditCard size={20} />
                                                                {(order.pharmacyIban || order.pharmacyMulticaixaExpress) ? 'Confirmar Pagamento' : 'Pagar Agora'}
                                                            </Button>
                                                        ) : order.paymentStatus === "paid" ? (
                                                            <div className="w-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 py-3 rounded-xl border border-green-200 dark:border-green-800 text-center font-bold flex items-center justify-center gap-2">
                                                                <CheckCircle2 size={18} />
                                                                Pedido Pago
                                                            </div>
                                                        ) : isCash ? (
                                                            <div className="w-full bg-green-50 text-green-700 py-3 rounded-xl border border-green-200 text-center text-sm font-bold flex items-center justify-center gap-2">
                                                                <Wallet size={18} />
                                                                Pagamento em Dinheiro na Entrega
                                                            </div>
                                                        ) : order.status === "proof_submitted" ? (
                                                            <div className="w-full bg-green-50 text-green-700 py-3 rounded-xl border border-green-200 text-center text-sm font-medium px-4">
                                                                Comprovativo em análise pela farmácia
                                                            </div>
                                                        ) : order.status === "pending" ? (
                                                            <div className="w-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 py-3 rounded-xl border border-amber-200 dark:border-amber-800 text-center text-sm font-medium px-4">
                                                                Aguardando confirmação da farmácia para habilitar o pagamento
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {order.items && order.items.length > 0 && (
                                                    <div className="mt-6 border-t border-slate-50 dark:border-slate-700 pt-4">
                                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Itens do Pedido</p>
                                                        <div className="space-y-2">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between text-sm">
                                                                    <span className="text-slate-600 dark:text-slate-400">{item.quantity}x {item.productName}</span>
                                                                    <span className="font-medium text-slate-900 dark:text-slate-200">
                                                                        {Number(item.unitPrice).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {order.status === "delivered" && (
                                                    <div className="mt-6 border-t pt-4" style={{ borderColor: "#dce4d7" }}>
                                                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#607369" }}>
                                                            Avaliação do Pedido
                                                        </p>

                                                        {order.reviewRating !== null && order.reviewRating !== undefined ? (
                                                            <div className="rounded-xl border p-4" style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5" }}>
                                                                <div className="flex items-center gap-1 mb-2">
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <Star
                                                                            key={star}
                                                                            size={16}
                                                                            className={star <= Number(order.reviewRating) ? "fill-current" : ""}
                                                                            style={{ color: star <= Number(order.reviewRating) ? "#f59e0b" : "#cbd5e1" }}
                                                                        />
                                                                    ))}
                                                                    <span className="ml-2 text-sm font-semibold" style={{ color: "#072a1c" }}>
                                                                        {Number(order.reviewRating).toFixed(1)} / 5
                                                                    </span>
                                                                </div>
                                                                {order.reviewComment && (
                                                                    <p className="text-sm" style={{ color: "#607369" }}>
                                                                        {order.reviewComment}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5" }}>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                                        const selected = (reviewDrafts[order.id]?.rating || 0) >= star;
                                                                        return (
                                                                            <button
                                                                                key={star}
                                                                                type="button"
                                                                                onClick={() => setReviewRating(order.id, star)}
                                                                                className="p-1"
                                                                                aria-label={`Avaliar com ${star} estrelas`}
                                                                            >
                                                                                <Star
                                                                                    size={20}
                                                                                    className={selected ? "fill-current" : ""}
                                                                                    style={{ color: selected ? "#f59e0b" : "#cbd5e1" }}
                                                                                />
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <textarea
                                                                    value={reviewDrafts[order.id]?.comment || ""}
                                                                    onChange={(e) => setReviewComment(order.id, e.target.value)}
                                                                    placeholder="Escreva um comentário (opcional)"
                                                                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none h-20"
                                                                    style={{ borderColor: "#dce4d7", backgroundColor: "#ffffff", color: "#072a1c" }}
                                                                />
                                                                <Button
                                                                    onClick={() => submitReview(order.id)}
                                                                    disabled={!reviewDrafts[order.id] || reviewDrafts[order.id].submitting}
                                                                    className="w-full"
                                                                    style={{ backgroundColor: "#072a1c", color: "#b5f176" }}
                                                                >
                                                                    {reviewDrafts[order.id]?.submitting ? "A enviar..." : "Enviar Avaliação"}
                                                                </Button>
                                                            </div>
                                                        )}
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

            {/* Payment Proof Modal */}
            {showProofModal && selectedOrderForProof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b flex items-center justify-between rounded-t-2xl" style={{ borderColor: "#e0e0e0", backgroundColor: "#f7faf5" }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(181, 241, 118, 0.35)" }}>
                                    <CreditCard size={20} style={{ color: "#072a1c" }} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: "#072a1c" }}>Carregar Comprovativo</h2>
                                    <p className="text-xs" style={{ color: "#607369" }}>Pedido #{selectedOrderForProof.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowProofModal(false); setPaymentProof(null); setProofFile(null); }}
                                className="p-2 hover:bg-white rounded-lg"
                                style={{ color: "#607369" }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Pharmacy Payment Details */}
                            {selectedOrderForProof.pharmacyIban && (
                                <div className="border rounded-xl p-4" style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7" }}>
                                    <p className="text-[10px] font-bold uppercase mb-1 tracking-widest" style={{ color: "#607369" }}>IBAN para Transferência</p>
                                    <p className="text-sm font-mono font-semibold" style={{ color: "#072a1c" }}>{selectedOrderForProof.pharmacyIban}</p>
                                </div>
                            )}
                            {selectedOrderForProof.pharmacyMulticaixaExpress && (
                                <div className="border rounded-xl p-4" style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7" }}>
                                    <p className="text-[10px] font-bold uppercase mb-1 tracking-widest" style={{ color: "#607369" }}>Número Multicaixa Express</p>
                                    <p className="text-sm font-mono font-semibold" style={{ color: "#072a1c" }}>{selectedOrderForProof.pharmacyMulticaixaExpress}</p>
                                </div>
                            )}

                            {/* File Upload */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <p className="text-sm font-bold mb-3" style={{ color: "#072a1c" }}>
                                    Comprovativo de Pagamento *
                                </p>
                                <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="proof-camera"
                                        />
                                        <div className="flex items-center justify-center gap-2 py-3 px-4 text-white font-medium rounded-xl transition-colors" style={{ backgroundColor: "#072a1c" }}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Tirar Foto
                                        </div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="proof-upload"
                                        />
                                        <div className="flex items-center justify-center gap-2 py-3 px-4 font-medium rounded-xl transition-colors border" style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7", color: "#072a1c" }}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Carregar Ficheiro
                                        </div>
                                    </label>
                                </div>

                                {paymentProof && (
                                    <div className="relative mt-4">
                                        {proofFile?.type === 'application/pdf' ? (
                                            <div className="flex flex-col items-center p-8 rounded-xl border" style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7" }}>
                                                <FileText size={48} style={{ color: "#8bc14a" }} className="mb-2" />
                                                <p className="text-sm font-medium truncate w-full text-center" style={{ color: "#072a1c" }}>{proofFile.name}</p>
                                            </div>
                                        ) : (
                                            <img src={paymentProof} alt="Comprovativo" className="max-h-48 mx-auto rounded-xl border" style={{ borderColor: "#dce4d7" }} />
                                        )}
                                        <button
                                            onClick={() => { setPaymentProof(null); setProofFile(null); }}
                                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!paymentProof && (
                                <p className="text-sm flex items-center gap-2" style={{ color: "#607369" }}>
                                    <AlertCircle size={16} />
                                    Seleccione o comprovativo bancário (PDF ou Imagem)
                                </p>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t flex gap-3 rounded-b-2xl" style={{ borderColor: "#e0e0e0", backgroundColor: "#f7faf5" }}>
                            <Button
                                variant="outline"
                                onClick={() => { setShowProofModal(false); setPaymentProof(null); setProofFile(null); setClientPaymentDetails({ iban: "", multicaixaExpress: "", accountName: "" }); }}
                                className="flex-1"
                                style={{ borderColor: "#dce4d7", color: "#607369" }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmPaymentWithProof}
                                disabled={!paymentProof}
                                className="flex-1"
                                style={{ backgroundColor: "#072a1c", color: "#b5f176" }}
                            >
                                Confirmar Pagamento
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pickup QR Code Modal */}
            <AnimatePresence>
                {showPickupQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                                <ShoppingBag size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Código de Reserva</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Apresente este código na farmácia para levantar o seu pedido #{showPickupQR}</p>
                            
                            <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 mb-6">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=FARMACIS-ORDER-${showPickupQR}`} 
                                    alt="QR Code de Levantamento"
                                    className="mx-auto mix-blend-multiply dark:mix-blend-normal dark:invert"
                                />
                                <p className="mt-4 font-mono font-bold text-lg tracking-widest text-slate-700 dark:text-slate-300 uppercase">
                                    REC-{showPickupQR}-{new Date().getFullYear()}
                                </p>
                            </div>

                            <Button 
                                onClick={() => setShowPickupQR(null)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12"
                            >
                                Fechar
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
