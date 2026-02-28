import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, Plus, Minus, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

export function CartDrawer() {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [selectedPharmacy, setSelectedPharmacy] = useState<number | null>(null);

  const { data: pharmacies } = useQuery({
    queryKey: [api.pharmacies.list.path],
    queryFn: async () => {
      const res = await fetch(api.pharmacies.list.path);
      return await res.json();
    },
    enabled: step === 'checkout'
  });

  const orderMutation = useMutation({
    mutationFn: async (pharmacyId: number) => {
      const res = await fetch(api.orders.create.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId,
          customerName: "Usuário Teste",
          total: totalPrice().toString(),
          items: JSON.stringify(items)
        })
      });
      return await res.json();
    },
    onSuccess: () => {
      setStep('success');
      clearCart();
    }
  });

  const handleCheckout = () => {
    if (step === 'cart') {
      setStep('checkout');
    } else if (step === 'checkout' && selectedPharmacy) {
      orderMutation.mutate(selectedPharmacy);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep('cart');
      setSelectedPharmacy(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  {step === 'success' ? <CheckCircle2 size={20} /> : <ShoppingBag size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {step === 'cart' ? 'Seu Carrinho' : step === 'checkout' ? 'Escolha a Farmácia' : 'Pedido Realizado'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {step === 'success' ? 'Aguardando confirmação' : `${totalItems()} itens adicionados`}
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

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {step === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Pedido Enviado!</h3>
                  <p className="text-slate-600 mb-6">
                    A farmácia recebeu seu pedido e está analisando. Você receberá uma notificação assim que for aceito.
                  </p>
                  <button 
                    onClick={handleClose}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
                  >
                    Voltar às compras
                  </button>
                </div>
              ) : step === 'checkout' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 font-medium mb-2">Selecione uma farmácia próxima para processar seu pedido:</p>
                  {pharmacies?.map((pharmacy: any) => (
                    <button
                      key={pharmacy.id}
                      onClick={() => setSelectedPharmacy(pharmacy.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        selectedPharmacy === pharmacy.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-white bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className={selectedPharmacy === pharmacy.id ? 'text-blue-600' : 'text-slate-400'} size={20} />
                        <div>
                          <h4 className="font-bold text-slate-800">{pharmacy.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{pharmacy.address}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                              Aberta
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">0.8 km de distância</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <ShoppingBag size={64} className="text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">O carrinho está vazio</p>
                  <p className="text-sm text-slate-400 mt-2">Adicione produtos para continuar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-xl p-2 flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="w-full h-full object-contain mix-blend-multiply" 
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 line-clamp-1">{item.product.name}</h4>
                        <p className="text-blue-600 font-bold mt-1">
                          {Number(item.product.price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-700">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeItem(item.product.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors ml-auto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    {totalPrice().toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-500">Frete</span>
                  <span className="font-semibold text-green-500">Grátis</span>
                </div>
                
                <div className="flex items-center justify-between mb-6 pt-4 border-t border-slate-100">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    {totalPrice().toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={step === 'checkout' ? () => setStep('cart') : clearCart}
                    className="py-3 px-4 rounded-xl text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {step === 'checkout' ? 'Voltar' : 'Limpar'}
                  </button>
                  <button 
                    onClick={handleCheckout}
                    disabled={step === 'checkout' && !selectedPharmacy || orderMutation.isPending}
                    className="py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center"
                  >
                    {orderMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : step === 'checkout' ? 'Enviar Pedido' : 'Finalizar'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
