import { ShoppingCart, Plus, X, Store, FileText, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type ProductResponse } from "@shared/routes";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: ProductResponse;
  index?: number;
  distance?: number | null;
}

export function ProductCard({ product, index = 0, distance }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cálculo Dinâmico: Margem de 15% sobre o Preço Base
  const basePrice = Number(product.precoBase || product.price);
  const finalPrice = basePrice * 1.15;

  return (
    <>
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-lg shadow-slate-950/50 border border-slate-700 hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-48 w-full mb-6 rounded-xl overflow-hidden bg-slate-700/30">
        <img
          src={product.imageUrl ?? undefined}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
        {product.activeIngredient && (
          <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm border border-blue-400">
            {product.activeIngredient}
          </div>
        )}
        {product.prescriptionRequired && (
          <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1.5">
            <FileText size={12} />
            Receita
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          {(product.diseases ?? []).slice(0, 2).map((disease) => (
            <span key={disease} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-md">
              {disease}
            </span>
          ))}
          {(product.diseases?.length ?? 0) > 2 && (
            <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-md">
              +{(product.diseases?.length ?? 0) - 2}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-blue-400"}`} />
          <span className={`text-xs font-medium ${product.stock > 0 ? "text-emerald-400" : "text-blue-400"}`}>
            {product.stock > 0 ? "Disponível" : "Disponível em outras farmácias"}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium leading-none mb-1">Preço</span>
            <span className="text-2xl font-black text-blue-400 leading-none mb-1">
              {finalPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
            <span className="text-[10px] text-slate-400 line-through mb-2">
              {basePrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
            
            {product.pharmacyName && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Vendido e Entregue por:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 py-1 px-2 bg-blue-50/50 rounded-lg w-fit">
                    <Store size={10} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300 truncate max-w-[100px]">
                      {product.pharmacyName}
                    </span>
                  </div>
                  {distance !== undefined && distance !== null && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-1 rounded-lg">
                      <MapPin size={8} />
                      {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => product.stock > 0 && setShowConfirmModal(true)}
            disabled={product.stock <= 0}
            className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 ${product.stock > 0
              ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            aria-label={product.stock > 0 ? "Adicionar ao carrinho" : "Esgotado"}
            title={product.prescriptionRequired ? "Requer receita médica" : "Adicionar ao carrinho"}
          >
            {product.stock <= 0 ? <X size={20} /> : (isHovered ? <Plus size={24} /> : <ShoppingCart size={22} />)}
          </button>
        </div>
      </div>
      </motion.div>

      {/* Modal de Confirmação de Origem */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-3xl p-6 border-slate-700 bg-slate-900 shadow-2xl">
          <DialogHeader>
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 mx-auto">
              <Store size={32} />
            </div>
            <DialogTitle className="text-center text-xl font-black text-white">Confirmar Origem</DialogTitle>
            <div className="py-4 text-center">
              <p className="text-slate-400 text-sm">Este medicamento será processado por:</p>
              <p className="text-lg font-bold text-blue-400 mt-1">{product.pharmacyName}</p>
              <div className="mt-4 p-3 bg-slate-800 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Resumo</p>
                <p className="text-sm font-semibold text-white">{product.name} x 1</p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="rounded-xl flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                addItem({...product, price: finalPrice.toString()});
                setShowConfirmModal(false);
              }} 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl flex-1 font-bold"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
