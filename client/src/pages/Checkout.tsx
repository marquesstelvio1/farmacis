import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Smartphone, Building2, ArrowLeft, Check,
  Loader2, MapPin, Navigation, AlertCircle, CheckCircle2, Phone,
  Store, User, Plus, Star,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { usePaymentMethods, PaymentMethod } from "@/hooks/use-payment-methods";
import { normalizeError } from "@/lib/errorHandler";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateAngolanPhone(raw: string): boolean {
  const normalised = raw.replace(/[\s\-]/g, "");
  return /^\+2449\d{8}$/.test(normalised) || /^9\d{8}$/.test(normalised);
}

function formatAngolanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("244") && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith("9") && digits.length === 9) {
    return `+244 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("244")) return `+${digits}`;
  if (digits.startsWith("9") && digits.length === 9) return `+244${digits}`;
  return raw.replace(/\s/g, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalPrice, clearCart } = useCart();
  const total = totalPrice();

  // User session
  const [user, setUser] = useState<any>({});

  // Payment methods hook
  const { methods, isLoading: methodsLoading } = usePaymentMethods(user?.id);

  // Delivery info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerLat, setCustomerLat] = useState<string | null>(null);
  const [customerLng, setCustomerLng] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Pharmacy selection
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<number | null>(null);
  const [pharmaciesLoading, setPharmaciesLoading] = useState(true);

  // Payment Selection
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | string | null>(null);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  // ─── Load user session, phone, address & map-selected location ──────────
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.name) setCustomerName(u.name);
      if (u.phone) {
        const formatted = formatAngolanPhone(u.phone);
        setCustomerPhone(formatted);
        setPhoneStatus("valid");
      }
      if (u.address) {
        setCustomerAddress(u.address);
      }
    }

    // Read delivery location chosen on the map page
    const savedLoc = sessionStorage.getItem("deliveryLocation");
    if (savedLoc) {
      try {
        const loc = JSON.parse(savedLoc);
        setCustomerLat(loc.lat);
        setCustomerLng(loc.lng);
        if (loc.address) setCustomerAddress(loc.address);
        setLocationStatus("success");
      } catch { }
    }

    // Load pharmacies
    fetch("/api/pharmacies")
      .then(res => res.json())
      .then(data => {
        setPharmacies(data || []);
        if (data && data.length === 1) {
          setSelectedPharmacy(data[0].id);
        }
      })
      .catch(err => {
        console.error("Failed to load pharmacies:", normalizeError(err));
        setPharmacies([]);
      })
      .finally(() => setPharmaciesLoading(false));
  }, []);

  // Set default payment method if available
  useEffect(() => {
    if (!selectedPaymentMethodId) {
      if (methods.length > 0) {
        const def = methods.find(m => m.isDefault) || methods[0];
        setSelectedPaymentMethodId(def.id);
      } else {
        // Default to cash when no payment methods are registered.
        setSelectedPaymentMethodId('cash');
      }
    }
  }, [methods, selectedPaymentMethodId]);

  // ─── Phone validation ────────────────────────────────────────────────────
  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (!value.trim()) {
      setPhoneStatus("idle");
      setPhoneError("");
      return;
    }
    if (validateAngolanPhone(value)) {
      setPhoneStatus("valid");
      setPhoneError("");
    } else {
      setPhoneStatus("invalid");
      setPhoneError("Use o formato +244 9XX XXX XXX");
    }
  };

  // ─── Save phone & address to profile ─────────────────────────────────────
  const saveToProfile = async (phone: string, address: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, phone, address }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) { setError("Nome do cliente é obrigatório"); return; }
    if (!customerPhone.trim() || !validateAngolanPhone(customerPhone)) {
      setError("Telefone de entrega inválido"); return;
    }
    if (!customerAddress.trim()) { setError("Endereço de entrega é obrigatório"); return; }
    if (!customerLat || !customerLng) {
      setError("Por favor, seleccione o local de entrega no mapa.");
      document.getElementById("location-section")?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!selectedPharmacy) {
      setError("Seleccione uma farmácia.");
      document.getElementById("pharmacy-section")?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!selectedPaymentMethodId) {
      setError("Seleccione um método de pagamento.");
      document.getElementById("payment-section")?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Express payment requires immediate payment
    const methodDetails = methods.find(m => m.id === selectedPaymentMethodId);
    const isExpress = methodDetails?.type === 'express' || selectedPaymentMethodId === 'express';
    if (isExpress) {
      setError("Pagamento express requer confirmação de pagamento imediato. Por favor, processe o pagamento antes de continuar.");
      document.getElementById("payment-section")?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsProcessing(true);

    try {
      const normPhone = normalisePhone(customerPhone);
      await saveToProfile(normPhone, customerAddress.trim());

      // Create order
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId: selectedPharmacy,
          userId: user.id || null,
          customerName: customerName.trim(),
          customerPhone: normPhone,
          customerAddress: customerAddress.trim(),
          customerLat: customerLat ?? null,
          customerLng: customerLng ?? null,
          total: String(total || 0),
          deliveryFee: "0",
          status: "pending",
          paymentMethod: selectedPaymentMethodId === 'cash' ? 'cash' : (methodDetails?.type || "mpesa"),
          paymentStatus: "pending",
          notes: selectedPaymentMethodId === 'cash' ? 'Pagamento em Dinheiro na Entrega' : `Pagamento via ${methodDetails?.name || 'M-Pesa'} (ID: ${selectedPaymentMethodId})`,
          items: items.map((i: any) => ({
            name: i.product.name,
            productId: i.product.id,
            quantity: i.quantity,
            price: Number(i.product.price),
          })),
        }),
      });

      if (!orderResponse.ok) {
        try {
          const errorData = await orderResponse.json();
          throw new Error(errorData.message || `Erro ${orderResponse.status}`);
        } catch (parseError) {
          throw new Error(normalizeError(parseError));
        }
      }

      // Clean up
      sessionStorage.removeItem("deliveryLocation");
      setIsComplete(true);
      clearCart();
      setTimeout(() => setLocation("/pedidos"), 3000);

    } catch (err: any) {
      setError(normalizeError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Success screen ──────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Pedido Criado!</h2>
          <p className="text-slate-300">O pagamento será habilitado após a farmácia confirmar seu pedido.</p>
          <p className="text-slate-400 text-sm mt-4 italic">A redirigir para meus pedidos...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Summary */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm h-fit">
            <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div className="max-w-[150px]">
                      <p className="font-medium text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-sm text-slate-500">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {(Number(item.product.price) * item.quantity).toLocaleString()} AOA
                    </p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4">
                  <p className="text-lg font-bold text-slate-900">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{total.toLocaleString()} AOA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Finalizar Encomenda</CardTitle>
              <CardDescription>Confirme os seus dados de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Person */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="w-4 h-4" />Nome Completo *</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />Telefone *</Label>
                  <div className="relative">
                    <Input
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={phoneStatus === "valid" ? "border-green-400" : phoneStatus === "invalid" ? "border-red-400" : ""}
                    />
                    {phoneStatus === "valid" && <CheckCircle2 className="absolute right-3 top-2.5 w-5 h-5 text-green-500" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Endereço de Entrega *</Label>
                  <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />
                </div>

                {/* Map Point */}
                <div className="space-y-2" id="location-section">
                  <Label className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4 text-blue-600" />Localização no Mapa *</Label>
                  {customerLat ? (
                    <div className="p-3 rounded-xl border border-green-200 bg-green-50 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                        <CheckCircle2 size={16} /> Confirmado
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setLocation("/escolher-local")}>Alterar Ponto</Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full h-20 border-dashed border-blue-300 bg-blue-50 text-blue-600 flex flex-col gap-1" onClick={() => setLocation("/escolher-local")}>
                      <MapPin size={24} />
                      <span className="font-bold">Marcar Ponto no Mapa</span>
                    </Button>
                  )}
                </div>

                {/* Pharmacy */}
                <div className="space-y-3" id="pharmacy-section">
                  <Label className="flex items-center gap-2 font-semibold"><Store className="w-4 h-4 text-blue-600" />Seleccionar Farmácia *</Label>
                  {pharmaciesLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                    <div className="space-y-2">
                      {pharmacies.map((p: any) => (
                        <button key={p.id} type="button" onClick={() => setSelectedPharmacy(p.id)} className={`w-full p-3 text-left rounded-xl border-2 transition-all ${selectedPharmacy === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white'}`}>
                          <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate">{p.address}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Methods */}
                <div className="space-y-3" id="payment-section">
                  <Label className="flex items-center gap-2 font-semibold"><Wallet className="w-4 h-4 text-blue-600" />Método de Pagamento Guardado *</Label>
                  {methodsLoading ? <Loader2 className="animate-spin mx-auto" /> : methods.length === 0 ? (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-center">
                      <p className="text-sm text-amber-700 mb-3">Não tens métodos guardados.</p>
                      <Link href="/pagamentos"><Button variant="outline" size="sm" className="w-full">Adicionar Agora</Button></Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {methods.map((m) => (
                        <button key={m.id} type="button" onClick={() => setSelectedPaymentMethodId(m.id)} className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between ${selectedPaymentMethodId === m.id ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-100 bg-white'}`}>
                          <div className="flex items-center gap-3">
                            <CreditCard size={20} className={selectedPaymentMethodId === m.id ? 'text-primary-600' : 'text-slate-400'} />
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{m.name} {m.isDefault && <Star size={10} className="inline fill-primary-500 text-primary-500 ml-1" />}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{m.type}</p>
                            </div>
                          </div>
                          {selectedPaymentMethodId === m.id && <CheckCircle2 size={16} className="text-primary-500" />}
                        </button>
                      ))}

                      {/* Cash Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethodId('cash')}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between ${selectedPaymentMethodId === 'cash' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-100 bg-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Wallet size={20} className={selectedPaymentMethodId === 'cash' ? 'text-primary-600' : 'text-slate-400'} />
                          <div>
                            <p className="font-bold text-slate-800 text-sm">Dinheiro (Cash)</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pagamento na Entrega</p>
                          </div>
                        </div>
                        {selectedPaymentMethodId === 'cash' && <CheckCircle2 size={16} className="text-primary-500" />}
                      </button>
                    </div>
                  )}
                  <Link href="/pagamentos">
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-blue-600 hover:text-blue-700">
                      <Plus size={14} className="mr-1" /> Gerenciar Métodos
                    </Button>
                  </Link>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle size={14} />{error}</div>}

                <Button type="submit" className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black rounded-xl shadow-xl shadow-blue-500/30" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin" /> : `SOLICITAR ENCOMENDA · ${total.toLocaleString()} AOA`}
                </Button>

                <p className="text-[10px] text-center text-slate-400 px-4 leading-tight">
                  Ao solicitar, o seu pedido será enviado para a farmácia. O pagamento só será solicitado após a confirmação de stock.
                </p>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
