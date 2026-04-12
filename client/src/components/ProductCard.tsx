import { ShoppingCart, Plus, X, Store, FileText, MapPin, Globe } from "lucide-react";
import { motion } from "framer-motion";
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

interface ProductVariant {
  id: number;
  origin: string | null;
  dosage: string | null;
  price: string;
  precoBase: string | null;
  stock: number;
  pharmacyId: number | null;
  pharmacyName: string | null;
  distance?: number | null;
}

interface ProductCardProps {
  product: ProductResponse;
  variants?: ProductVariant[];
  index?: number;
  distance?: number | null;
}

export function ProductCard({ product, variants = [], index = 0, distance }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // If no variants provided, use the product itself as the only variant
  const allVariants: ProductVariant[] = variants.length > 0 
    ? variants 
    : [{
        id: product.id,
        origin: 'default',
        dosage: product.dosage ?? null,
        price: String(product.price),
        precoBase: product.precoBase ? String(product.precoBase) : String(product.price),
        stock: product.stock,
        pharmacyId: product.pharmacyId ?? null,
        pharmacyName: product.pharmacyName ?? null,
        distance: distance
      }];

  // Get the currently selected variant or default to first
  const currentVariant = selectedVariant || allVariants[0];
  
  // Cálculo Dinâmico: Margem de 15% sobre o Preço Base
  const basePrice = Number(currentVariant.precoBase || currentVariant.price);
  const finalPrice = basePrice * 1.15;

  const getOriginLabel = (origin: string | null) => {
    switch (origin) {
      case 'portugues': return 'Português';
      case 'indiano': return 'Indiano';
      default: return 'Padrão';
    }
  };

  const getOriginFlag = (origin: string | null) => {
    switch (origin) {
      case 'portugues': return '🇵🇹';
      case 'indiano': return '🇮🇳';
      default: return '🏥';
    }
  };

  return (
    <>
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-gradient-to-br from-white to-green-50 rounded-2xl p-5 shadow-lg shadow-green-900/10 border border-green-200 hover:shadow-xl hover:shadow-green-500/20 hover:border-green-400/50 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-48 w-full mb-6 rounded-xl overflow-hidden bg-green-100">
        <img
          src={product.imageUrl ?? undefined}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
        {product.activeIngredient && (
          <div className="absolute top-3 right-3 bg-green-600/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm border border-green-400">
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
        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{product.name}</h3>
        
        {/* Show dosage prominently if available */}
        {currentVariant.dosage && (
          <div className="mb-3">
            <span className="inline-block text-sm font-bold text-green-700 bg-green-100 border border-green-400 px-3 py-1.5 rounded-lg">
              💊 {currentVariant.dosage}
            </span>
          </div>
        )}
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        {/* Variant Selector - Show if multiple variants exist */}
        {allVariants.length > 1 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <Globe size={12} />
              Selecione a origem:
            </p>
            <div className="flex flex-wrap gap-2">
              {allVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentVariant.id === variant.id
                      ? 'bg-green-500 text-white border border-green-600'
                      : 'bg-white text-slate-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className="mr-1">{getOriginFlag(variant.origin)}</span>
                  {getOriginLabel(variant.origin)}
                  {variant.dosage && <span className="ml-1 text-[10px] opacity-75">({variant.dosage})</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Disease tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {(product.diseases ?? []).slice(0, 2).map((disease: string) => (
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
          <div className={`h-1.5 w-1.5 rounded-full ${currentVariant.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
          <span className={`text-xs font-medium ${currentVariant.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {currentVariant.stock > 0 ? "Disponível" : "Disponível em outras farmácias"}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-green-200">
          <div className="flex flex-col">
            {/* Área de Preços Múltiplos */}
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-xs text-slate-600 font-medium">Preço Disponível:</span>
              
              {/* Se houver variantes (Português/Indiano), mostra mini-preços para comparação */}
              {allVariants.length > 1 ? (
                <div className="flex flex-col gap-1">
                  {allVariants.filter(v => Number(v.price) > 0).map(v => (
                    <div key={v.id} className={`flex items-center gap-2 ${currentVariant.id === v.id ? 'opacity-100' : 'opacity-60'}`}>
                      <span className="text-[10px] font-bold bg-slate-100 px-1 rounded">{getOriginFlag(v.origin)}</span>
                      <span className={`text-sm font-black ${currentVariant.id === v.id ? 'text-green-600' : 'text-slate-600'}`}>
                        {(Number(v.price)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <span className="text-2xl font-black text-green-600 leading-none">
                    {finalPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                  <span className="text-[10px] text-slate-500 line-through">
                    {basePrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </>
              )}
            </div>
            
            {currentVariant.pharmacyName && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Vendido e Entregue por:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 py-1 px-2 bg-green-50 rounded-lg w-fit border border-green-200">
                    <Store size={10} className="text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 truncate max-w-[100px]">
                      {currentVariant.pharmacyName}
                    </span>
                  </div>
                  {currentVariant.distance !== undefined && currentVariant.distance !== null && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-1 rounded-lg">
                      <MapPin size={8} />
                      {currentVariant.distance < 1 ? `${(currentVariant.distance * 1000).toFixed(0)}m` : `${currentVariant.distance.toFixed(1)}km`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => currentVariant.stock > 0 && setShowConfirmModal(true)}
            disabled={currentVariant.stock <= 0}
            className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 ${currentVariant.stock > 0
              ? "bg-green-500/20 text-green-600 hover:bg-green-500 hover:text-white"
              : "bg-gray-300 text-slate-500 cursor-not-allowed"
              }`}
            aria-label={currentVariant.stock > 0 ? "Adicionar ao carrinho" : "Esgotado"}
            title={product.prescriptionRequired ? "Requer receita médica" : "Adicionar ao carrinho"}
          >
            {currentVariant.stock <= 0 ? <X size={20} /> : (isHovered ? <Plus size={24} /> : <ShoppingCart size={22} />)}
          </button>
        </div>
      </div>
      </motion.div>

      {/* Modal de Confirmação de Origem */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-3xl p-6 border-green-200 bg-white shadow-2xl shadow-green-900/10">
          <DialogHeader>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4 mx-auto">
              <Store size={32} />
            </div>
            <DialogTitle className="text-center text-xl font-black text-slate-800">Confirmar Origem</DialogTitle>
            <div className="py-4 text-center">
              <p className="text-slate-600 text-sm">Este medicamento será processado por:</p>
              <p className="text-lg font-bold text-green-600 mt-1">{currentVariant.pharmacyName}</p>
              
              {/* Show selected variant info */}
              {currentVariant.origin && currentVariant.origin !== 'default' && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <Globe size={14} className="text-green-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {getOriginFlag(currentVariant.origin)} {getOriginLabel(currentVariant.origin)}
                  </span>
                  {currentVariant.dosage && (
                    <span className="text-xs text-slate-500">• {currentVariant.dosage}</span>
                  )}
                </div>
              )}
              
              <div className="mt-4 p-3 bg-green-50 rounded-2xl border border-green-200">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Resumo</p>
                <p className="text-sm font-semibold text-slate-800">{product.name} x 1</p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {finalPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="rounded-xl flex-1 hover:bg-gray-100">
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                addItem({
                  ...product, 
                  id: currentVariant.id,
                  price: finalPrice.toString(),
                  origin: currentVariant.origin,
                  dosage: currentVariant.dosage
                });
                setShowConfirmModal(false);
              }} 
              className="bg-green-600 hover:bg-green-700 rounded-xl flex-1 font-bold text-white"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
