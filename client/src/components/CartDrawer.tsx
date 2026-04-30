import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, Plus, Minus, FileText, CheckCircle2, Store, Upload, AlertCircle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useLocation } from "wouter";
import { useUser } from "@/UserContext";

export function CartDrawer() {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, totalPrice, totalItems, clearCart, getItemsRequiringPrescription, prescriptions, addPrescription, removePrescription, hasAllPrescriptions } = useCart();
  const { settings, fetchSettings } = useSystemSettings();
  const [, setLocation] = useLocation();
  const { user, isLogged } = useUser();
  const [editingPrescriptionFor, setEditingPrescriptionFor] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const baseDeliveryFee = settings ? parseFloat(settings.delivery_fee) : 0;
  const uniquePharmacies = new Set(items.map(i => i.product.pharmacyId));
  const totalDeliveryFee = baseDeliveryFee * uniquePharmacies.size;
  const minOrderAmount = settings ? parseFloat(settings.min_order_amount) : 500;
  const cartTotal = totalPrice();
  const grandTotal = cartTotal + totalDeliveryFee;
  const meetsMinimum = cartTotal >= minOrderAmount;

  const itemsRequiringPrescription = getItemsRequiringPrescription();
  const allPrescriptionsAdded = hasAllPrescriptions();
  const hasPrescriptionsInCart = itemsRequiringPrescription.length > 0;

  // Lógica de Multi-Inventário
  const isMultiPharmacy = uniquePharmacies.size > 1;

  const handleCheckout = () => {
    if (hasPrescriptionsInCart && !allPrescriptionsAdded) {
      alert("Por favor, envie a receita médica para os produtos que a requerem.");
      return;
    }
    
    // Check if user is authenticated
    if (!isLogged()) {
      // Mark that user should be redirected to checkout after login
      localStorage.setItem("redirectToCheckoutAfterLogin", "true");
      setIsOpen(false);
      setTimeout(() => {
        setLocation("/login");
      }, 200);
      return;
    }
    
    setIsOpen(false);
    setTimeout(() => {
      setLocation("/checkout");
    }, 200);
  };

  const handleFileSelect = (productId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      addPrescription(productId, { imageUrl: result, base64: result });
      setEditingPrescriptionFor(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingPrescriptionFor(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
          >
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Seu Carrinho</h2>
                  <p className="text-sm text-slate-500">
                    {totalItems()} {totalItems() === 1 ? 'item' : 'itens'} adicionados
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={32} className="text-green-500 sm:w-10 sm:h-10" />
                  </div>
                  <p className="text-base sm:text-lg font-medium text-slate-600">O carrinho está vazio</p>
                  <p className="text-sm text-slate-400 mt-2">Adicione produtos para continuar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const prescription = prescriptions.get(item.product.id);
                    const needsPrescription = item.product.prescriptionRequired;
                    
                    return (
                      <div key={item.product.id} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl p-2 flex-shrink-0 relative">
                          <img
                            src={item.product.imageUrl ?? undefined}
                            alt={item.product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                          {needsPrescription && (
                            <div className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                              <FileText size={12} className="text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-sm sm:text-base line-clamp-1">{item.product.name}</h4>
                          <p className="text-green-600 font-bold mt-1">
                            {Number(item.product.price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </p>
                          
                          {needsPrescription && (
                            <div className="mt-2">
                              {prescription ? (
                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                  <CheckCircle2 size={14} className="text-green-600" />
                                  <span className="text-xs text-green-700 font-medium">Receita enviada</span>
                                  <button
                                    onClick={() => removePrescription(item.product.id)}
                                    className="ml-auto text-red-500 hover:text-red-700 p-1"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                  <AlertCircle size={14} className="text-amber-600" />
                                  <span className="text-xs text-amber-700 font-medium">Requer receita</span>
                                  <button
                                    onClick={() => setEditingPrescriptionFor(item.product.id)}
                                    className="ml-auto flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600"
                                  >
                                    <Upload size={12} />
                                    Enviar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-2 sm:p-1.5 text-slate-500 hover:text-green-600 transition-colors disabled:opacity-50"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={16} className="sm:w-4 sm:h-4" />
                              </button>
                              <span className="w-10 sm:w-8 text-center text-sm font-semibold text-slate-700">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="p-2 sm:p-1.5 text-slate-500 hover:text-green-600 transition-colors"
                              >
                                <Plus size={16} className="sm:w-4 sm:h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
                {isMultiPharmacy && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-xl flex items-start gap-3">
                    <Store className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-purple-900 leading-tight">Pedido Multi-Origem</p>
                      <p className="text-[10px] text-purple-700 mt-0.5 font-semibold">
                        O seu pedido será recolhido em {uniquePharmacies.size} locais diferentes.
                      </p>
                    </div>
                  </div>
                )}

                {hasPrescriptionsInCart && (
                  <div className={`mb-4 p-3 rounded-xl ${allPrescriptionsAdded ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className="flex items-start gap-2">
                      {allPrescriptionsAdded ? (
                        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-xs ${allPrescriptionsAdded ? 'text-green-700' : 'text-amber-700'}`}>
                        {allPrescriptionsAdded
                          ? 'Todas as receitas foram enviadas. A farmácia analisará antes de confirmar.'
                          : 'Faltam enviar receitas médicas. Envie para prosseguir.'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Subtotal</span>
                    <span className="font-semibold text-slate-800">
                      {cartTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">
                      {isMultiPharmacy ? `Frete (${uniquePharmacies.size} farmácias)` : 'Frete'}
                    </span>
                    <span className={`font-semibold ${totalDeliveryFee === 0 ? 'text-green-600' : 'text-slate-800'}`}>
                      {totalDeliveryFee === 0 ? 'Grátis' : totalDeliveryFee.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 pt-4 border-t border-slate-100">
                  <span className="text-base sm:text-lg font-bold text-slate-800">Total</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-green-600">
                    {grandTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>

                {!meetsMinimum && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle size={14} />
                      Mínimo de {minOrderAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}.
                      Faltam {(minOrderAmount - cartTotal).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}.
                    </p>
                  </div>
                )}

                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] text-slate-600">
                    Ao finalizar, você confirma os dados no checkout e escolhe a forma de entrega/pagamento.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={clearCart}
                    className="py-3 px-4 rounded-xl text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={(hasPrescriptionsInCart && !allPrescriptionsAdded) || !meetsMinimum}
                    className={`py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      (hasPrescriptionsInCart && !allPrescriptionsAdded) || !meetsMinimum
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5'
                    }`}
                  >
                    Finalizar
                  </button>
                </div>

                {meetsMinimum && (!hasPrescriptionsInCart || allPrescriptionsAdded) && (
                  <p className="mt-2 text-[11px] text-slate-500 text-center">
                    Será redirecionado para revisar endereço e pagamento.
                  </p>
                )}
              </div>
            )}

            {/* Prescription Upload Modal */}
            <AnimatePresence>
              {editingPrescriptionFor && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingPrescriptionFor(null)}
                    className="fixed inset-0 bg-black/50 z-[60]"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl z-[70] p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-amber-600" size={20} />
                        Enviar Receita
                      </h3>
                      <button
                        onClick={() => setEditingPrescriptionFor(null)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">
                      Fotografe ou selecione a imagem da receita médica válida.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(editingPrescriptionFor, e)}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 sm:py-8 border-2 border-dashed border-slate-300 rounded-xl text-center hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">Clique para carregar</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG (máx. 5MB)</p>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
