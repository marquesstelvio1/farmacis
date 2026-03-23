import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, Plus, Minus, MapPin } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";

export function CartDrawer() {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const [, setLocation] = useLocation();

  const handleCheckout = () => {
    // Close drawer, then navigate to the map page to pick delivery location
    setIsOpen(false);
    // Small delay so the drawer animation finishes
    setTimeout(() => {
      setLocation("/escolher-local");
    }, 200);
  };

  const handleClose = () => {
    setIsOpen(false);
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

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {items.length === 0 ? (
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
                    onClick={clearCart}
                    className="py-3 px-4 rounded-xl text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin size={18} />
                    Finalizar
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
