import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, Plus, Minus, FileText, CheckCircle2, Store, Upload, AlertCircle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useLocation } from "wouter";

export function CartDrawer() {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, totalPrice, totalItems, clearCart, getItemsRequiringPrescription, prescriptions, addPrescription, removePrescription, hasAllPrescriptions } = useCart();
  const { settings, fetchSettings } = useSystemSettings();
  const [, setLocation] = useLocation();
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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-100 dark:border-slate-700"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Seu Carrinho</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {totalItems()} {totalItems() === 1 ? 'item' : 'itens'} adicionados
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <ShoppingBag size={64} className="text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400">O carrinho está vazio</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Adicione produtos para continuar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const prescription = prescriptions.get(item.product.id);
                    const needsPrescription = item.product.prescriptionRequired;
                    
                    return (
                      <div key={item.product.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-xl p-2 flex-shrink-0 relative">
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
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{item.product.name}</h4>
                          <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
                            {Number(item.product.price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </p>
                          
                          {needsPrescription && (
                            <div className="mt-2">
                              {prescription ? (
                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                  <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                                  <span className="text-xs text-green-700 dark:text-green-400 font-medium">Receita enviada</span>
                                  <button
                                    onClick={() => removePrescription(item.product.id)}
                                    className="ml-auto text-red-500 hover:text-red-700"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                  <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Requer receita</span>
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

                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="p-1.5 text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors ml-auto"
                            >
                              <Trash2 size={16} />
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
              <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                {isMultiPharmacy && (
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl flex items-start gap-3">
                    <Store className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-300 leading-tight">Pedido Multi-Origem</p>
                      <p className="text-[10px] text-purple-700 dark:text-purple-400 mt-0.5 font-semibold">
                        O seu pedido será recolhido em {uniquePharmacies.size} locais diferentes. Taxas de entrega podem variar.
                      </p>
                    </div>
                  </div>
                )}

                {hasPrescriptionsInCart && (
                  <div className={`mb-4 p-3 rounded-xl ${allPrescriptionsAdded ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
                    <div className="flex items-start gap-2">
                      {allPrescriptionsAdded ? (
                        <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-xs ${allPrescriptionsAdded ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {allPrescriptionsAdded 
                          ? 'Todas as receitas foram enviadas. A farmácia analisará antes de confirmar.' 
                          : 'Faltam enviar receitas médicas. Envie para prosseguir.'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {cartTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isMultiPharmacy ? `Frete (${uniquePharmacies.size} farmácias)` : 'Frete'}
                  </span>
                  <span className={`font-semibold ${totalDeliveryFee === 0 ? 'text-green-500 dark:text-green-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {totalDeliveryFee === 0 ? 'Grátis' : totalDeliveryFee.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-lg font-bold text-slate-800 dark:text-white">Total</span>
                  <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {grandTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>

                {!meetsMinimum && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <AlertCircle size={14} />
                      Mínimo de {minOrderAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} para encomendar.
                      Faltam {(minOrderAmount - cartTotal).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} para atingir.
                    </p>
                  </div>
                )}

                <div className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Ao finalizar, você confirma os dados no checkout e escolhe a forma de entrega/pagamento.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={clearCart}
                    className="py-3 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={(hasPrescriptionsInCart && !allPrescriptionsAdded) || !meetsMinimum}
                    className={`py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      (hasPrescriptionsInCart && !allPrescriptionsAdded) || !meetsMinimum
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5'
                    }`}
                  >
                    Finalizar
                  </button>
                </div>

                {meetsMinimum && (!hasPrescriptionsInCart || allPrescriptionsAdded) && (
                  <p className="mt-2 text-[11px] text-slate-500 text-center">
                    Você será redirecionado para revisar endereço e pagamento.
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
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-[70] p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-amber-600 dark:text-amber-400" size={20} />
                        Enviar Receita
                      </h3>
                      <button
                        onClick={() => setEditingPrescriptionFor(null)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                      className="w-full py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Clique para carregar</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">JPG, PNG (máx. 5MB)</p>
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
