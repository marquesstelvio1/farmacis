import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Check, Calendar, Truck,
  Loader2, MapPin, AlertCircle, CheckCircle2, Phone, ClipboardList,
  Store, User, ShoppingBag,
  Wallet, CreditCard, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { normalizeError } from "@/lib/errorHandler";
import { useGeolocation } from "@/hooks/use-geolocation";
import { DeliveryLocationPicker } from "@/components/DeliveryLocationPicker";
import { DeliveryToggle } from "@/components/DeliveryToggle";
import { useUser } from "@/UserContext";

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

// Payment methods that require proof
const PAYMENT_METHODS_REQUIRING_PROOF = ["multicaixa_express", "transferencia"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalPrice, clearCart, prescriptions } = useCart();
  const { settings, fetchSettings } = useSystemSettings();

  const { user, setUser: setGlobalUser } = useUser(); // Usa o user e setUser do contexto

  // Delivery info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerLat, setCustomerLat] = useState<string | null>(null);
  const [customerLng, setCustomerLng] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Agrupamento por Farmácia
  const itemsByPharmacy = items.reduce((acc: any, item: any) => {
    const pId = item.product.pharmacyId;
    if (!acc[pId]) {
      acc[pId] = {
        id: pId,
        name: item.product.pharmacyName || "Farmácia",
        items: []
      };
    }
    acc[pId].items.push(item);
    return acc;
  }, {});

  const pharmacyIds = Object.keys(itemsByPharmacy);

  // Configuração individual por farmácia
  const [pharmacyMethods, setPharmacyMethods] = useState<Record<number, "delivery" | "pickup">>(
    pharmacyIds.reduce((acc, id) => ({ ...acc, [Number(id)]: "delivery" }), {})
  );

  const [additionalNotes, setAdditionalNotes] = useState("");

  // Cálculos Totais
  const cartTotal = totalPrice();
  const minOrderAmount = settings ? parseFloat(settings.min_order_amount) : 500;
  const baseDeliveryFee = settings ? parseFloat(settings.delivery_fee) : 0;

  // Frete total é a soma dos fretes das farmácias que têm entrega selecionada
  const totalDeliveryFee = Object.keys(pharmacyMethods).reduce((sum, pId) =>
    pharmacyMethods[Number(pId)] === "delivery" ? sum + baseDeliveryFee : sum, 0
  );

  const grandTotal = cartTotal + totalDeliveryFee;
  const meetsMinimum = cartTotal >= minOrderAmount;


  // Geolocation (used for distance calculation in delivery)
  // const { calculateDistance } = useGeolocation();

  // Payment Selection
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash");

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Check if selected method requires proof (info only, not required at checkout)
  const requiresPaymentProof = PAYMENT_METHODS_REQUIRING_PROOF.includes(selectedPaymentMethod);

  // ─── Load system settings ───────────────────────────────────────────────
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── Load user session, phone, address & map-selected location ──────────
  useEffect(() => {
    if (user) { // Usa o user do contexto
      if (user.name) setCustomerName(user.name);
      if (user.phone) {
        // Garante que o telefone é uma string antes de formatar
        const formatted = formatAngolanPhone(user.phone);
        setCustomerPhone(formatted);
        setPhoneStatus("valid");
      }
      if (user.address) {
        setCustomerAddress(user.address);
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
      } catch { }
    }
  }, []);

  // ─── Phone validation ────────────────────────────────────────────────────
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const subNumber = digits.startsWith("244") ? digits.slice(3) : digits;
    const limited = subNumber.slice(0, 9);

    const parts = [];
    if (limited.length > 0) parts.push(limited.slice(0, 3));
    if (limited.length > 3) parts.push(limited.slice(3, 6));
    if (limited.length > 6) parts.push(limited.slice(6, 9));

    const formatted = limited.length > 0 ? "+244 " + parts.join(" ") : "";
    setCustomerPhone(formatted);

    if (limited.length === 0) {
      setPhoneStatus("idle");
      setPhoneError("");
      return;
    }
    if (limited.length === 9) {
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
        setGlobalUser(updatedUser);
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ⭐ NOVO: Verificar autenticação antes de prosseguir
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }

    if (!customerName.trim()) { setError("Nome do cliente é obrigatório"); return; }
    if (!customerPhone.trim() || !validateAngolanPhone(customerPhone)) {
      setError("Telefone de entrega inválido"); return;
    }

    // Valida endereço apenas se pelo menos uma farmácia exigir entrega
    const needsDelivery = Object.values(pharmacyMethods).includes("delivery");
    if (needsDelivery) {
      if (!customerAddress.trim()) { setError("Endereço de entrega é obrigatório"); return; }
      if (!customerLat || !customerLng) {
        setError("Por favor, seleccione o local de entrega no mapa.");
        document.getElementById("location-section")?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    if (!selectedPaymentMethod) {
      setError("Seleccione um método de pagamento.");
      document.getElementById("payment-section")?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!meetsMinimum) {
      setError(`Valor mínimo de ${minOrderAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} para encomendar.`);
      return;
    }

    setIsProcessing(true);

    try {
      const normPhone = normalisePhone(customerPhone);
      await saveToProfile(normPhone, customerAddress.trim());

      // Criar múltiplos pedidos (um para cada farmácia)
      const createdOrderIds: string[] = [];

      for (const pId of Object.keys(itemsByPharmacy)) {
        const pharmacyId = Number(pId);
        const pharmacyItems = itemsByPharmacy[pharmacyId].items;
        const method = pharmacyMethods[pharmacyId];
        const subtotal = pharmacyItems.reduce((s: number, i: any) => s + (Number(i.product.price) * i.quantity), 0);
        const fee = method === "delivery" ? baseDeliveryFee : 0;

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pharmacyId,
            userId: user?.id || null,
            customerName: customerName.trim(),
            customerPhone: normPhone,
            customerAddress: method === "delivery" ? customerAddress.trim() : "Levantamento na Loja",
            customerLat: customerLat ?? null,
            customerLng: customerLng ?? null,
            bookingType: method,
            total: String(subtotal + fee),
            deliveryFee: String(fee),
            status: "pending",
            paymentMethod: selectedPaymentMethod,
            paymentStatus: "pending",
            notes: `Farmácia: ${itemsByPharmacy[pharmacyId].name} | ${additionalNotes}`,
            items: pharmacyItems.map((i: any) => ({
              name: i.product.name,
              productId: i.product.id,
              quantity: i.quantity,
              price: Number(i.product.price),
              prescriptionRequired: i.product.prescriptionRequired || false,
              prescription: prescriptions.get(i.product.id) || null,
            })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Erro ao criar pedido: ${errorData.message || response.statusText}`);
        }

        const orderData = await response.json();
        createdOrderIds.push(orderData.id);
      }

      console.log(`✅ ${createdOrderIds.length} pedidos criados com sucesso`);

      // Clean up
      sessionStorage.removeItem("deliveryLocation");
      setIsComplete(true);
      clearCart();
      setTimeout(() => setLocation("/pedidos"), 3000);

    } catch (err: any) {
      setError(normalizeError(err));
      console.error("Erro ao criar pedidos:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Success screen ──────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradaent-do-br from-slati-900evia-blue-900 to-slate-900 nt-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {pharmacyIds.length > 1 ? "Pedidos Criados!" : "Pedido Criado!"}
          </h2>
          <p className="text-slate-300">
            {pharmacyIds.length > 1
              ? "As farmácias foram notificadas. O pagamento será habilitado individualmente conforme aceitação."
              : "O pagamento será habilitado após a farmácia confirmar seu pedido."}
          </p>
          <div className="mt-4 text-left text-sm text-slate-200">
            <p className="font-semibold">Pedidos enviados para:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-slate-200">
              {Object.values(itemsByPharmacy).map((group: any) => (
                <li key={group.id}>{group.name}</li>
              ))}
            </ul>
          </div>
          <p className="text-slate-400 text-sm mt-4 italic">A redirigir para meus pedidos...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Link href="/catalogo">
          <Button variant="ghost" className="text-slate-700 hover:bg-slate-100 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Summary */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-800/95 h-fit">
            <CardHeader><CardTitle className="text-slate-900 dark:text-white">Resumo do Pedido</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.values(itemsByPharmacy).map((group: any) => (
                  <div key={group.id} className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-700/80 border border-slate-100 dark:border-slate-600 shadow-sm space-y-3">
                    <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-100 dark:border-blue-800 pb-2">
                      <Store size={14} /> {group.name}
                    </h4>
                    <div className="space-y-2">
                      {group.items.map((item: any) => (
                        <div key={item.product.id} className="flex justify-between items-center">
                          <div className="max-w-[160px]">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{item.product.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">
                            {(Number(item.product.price) * item.quantity).toLocaleString()} AOA
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex items-center gap-1.5">
                        {pharmacyMethods[group.id] === 'pickup' ? <ShoppingBag size={12} className="text-amber-500 dark:text-amber-400" /> : <Truck size={12} className="text-blue-500 dark:text-blue-400" />}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{pharmacyMethods[group.id] === 'pickup' ? 'Levantamento' : 'Entrega'}</span>
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-slate-200">
                        {pharmacyMethods[group.id] === 'pickup' ? 'GRÁTIS' : `${baseDeliveryFee.toLocaleString()} AOA`}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-600">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Subtotal</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{cartTotal.toLocaleString()} AOA</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Frete</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {totalDeliveryFee.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </p>
                  </div>
                </div>

                {pharmacyIds.length > 1 && totalDeliveryFee > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-2">
                    <AlertCircle size={14} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
                      Nota: Como a sua encomenda inclui produtos de <strong>{pharmacyIds.length} farmácias</strong>,
                      o valor do frete corresponde à soma das taxas de entrega individuais de cada estabelecimento.
                    </p>
                  </div>
                )}

                {!meetsMinimum && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <AlertCircle size={14} />
                      Mínimo de {minOrderAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} para encomendar.
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Total</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{grandTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-800/95">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Finalizar Encomenda</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Confirme os seus dados de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Escolha por Farmácia */}
                <div className="space-y-6">
                  {Object.values(itemsByPharmacy).map((group: any) => (
                    <div key={group.id} className="space-y-4 p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-900/20 flex items-center justify-center">
                          <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{group.name}</h4>
                      </div>
                      <DeliveryToggle
                        value={pharmacyMethods[group.id]}
                        onChange={(value) => setPharmacyMethods({ ...pharmacyMethods, [group.id]: value })}
                        pharmacyName={group.name}
                      />
                    </div>
                  ))}
                </div>

                {/* Person */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><User className="w-4 h-4" />Nome Completo *</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Phone className="w-4 h-4" />Telefone *</Label>
                  <div className="relative">
                    <Input
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`dark:bg-slate-800 dark:border-slate-700 dark:text-white ${phoneStatus === "valid" ? "border-green-400" : phoneStatus === "invalid" ? "border-red-400" : ""}`}
                    />
                    {phoneStatus === "valid" && <CheckCircle2 className="absolute right-3 top-2.5 w-5 h-5 text-green-500" />}
                  </div>
                </div>

                {/* Location Picker */}
                <div className={`space-y-2 ${!Object.values(pharmacyMethods).includes("delivery") ? 'opacity-40 grayscale pointer-events-none' : ''}`} id="location-section">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Endereço para Entrega *
                  </Label>
                  {customerLat && customerLng ? (
                    <div className="p-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="text-green-700 dark:text-green-400 text-sm font-semibold flex items-center gap-1">
                              <CheckCircle2 size={14} /> Local Confirmado
                            </p>
                            <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                              {parseFloat(customerLat).toFixed(6)}, {parseFloat(customerLng).toFixed(6)}
                            </p>
                            {customerAddress && (
                              <p className="text-gray-600 dark:text-slate-400 text-xs mt-1 truncate">{customerAddress}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMapPicker(true)} // Open as modal
                        className="mt-3 w-full dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                      >
                        Alterar Local
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-20 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex flex-col gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => setShowMapPicker(true)}
                    >
                      <MapPin size={24} />
                      <span className="font-bold">Marcar Ponto no Mapa</span>
                    </Button>
                  )}
                </div>

                {/* Notas / Observações */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Notas / Observações
                  </Label>
                  <Input
                    placeholder="Ex: Tocar a campainha..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Payment Methods */}
                <div className="space-y-3" id="payment-section">
                  <Label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300"><Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />Método de Pagamento *</Label>

                  {/* Cash Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${selectedPaymentMethod === 'cash'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wallet size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Pagamento na Entrega</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Pague com Multicaixa ou Dinheiro ao receber</p>
                    </div>
                    {selectedPaymentMethod === 'cash' && <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />}
                  </button>

                  {/* Multicaixa Express Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('multicaixa_express')}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${selectedPaymentMethod === 'multicaixa_express'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Multicaixa Express</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Transferência imediata via ATM</p>
                    </div>
                    {selectedPaymentMethod === 'multicaixa_express' && <CheckCircle2 size={24} className="text-blue-500 flex-shrink-0" />}
                  </button>

                  {/* Transferencia Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('transferencia')}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${selectedPaymentMethod === 'transferencia'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Transferência Bancária</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Transferência para conta bancária</p>
                    </div>
                    {selectedPaymentMethod === 'transferencia' && <CheckCircle2 size={24} className="text-purple-500 flex-shrink-0" />}
                  </button>

                  {requiresPaymentProof && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <AlertCircle size={16} className="text-blue-600 dark:text-blue-400" />
                        O comprovativo de pagamento será solicitado após a farmácia aceitar o seu pedido.
                      </p>
                    </div>
                  )}
                </div>

                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-800 flex items-center gap-2"><AlertCircle size={14} />{error}</div>}

                <Button type="submit" className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white font-black rounded-xl shadow-xl shadow-blue-500/30 dark:shadow-blue-900/30 hover:shadow-2xl dark:hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none" disabled={isProcessing || !meetsMinimum}>
                  {isProcessing ? <Loader2 className="animate-spin" /> : `SOLICITAR ENCOMENDA · ${grandTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`}
                </Button>

                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 px-4 leading-tight">
                  Ao solicitar, o seu pedido será enviado para a farmácia. O pagamento só será solicitado após a farmácia aceitar o pedido.
                </p>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeliveryLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelect={(lat, lng, address) => {
          setCustomerLat(lat.toString());
          setCustomerLng(lng.toString());
          if (address) setCustomerAddress(address);
          setLocationStatus("success");
        }}
        initialLat={customerLat ? parseFloat(customerLat) : null}
        initialLng={customerLng ? parseFloat(customerLng) : null}
      />
    </div>
  );
}
